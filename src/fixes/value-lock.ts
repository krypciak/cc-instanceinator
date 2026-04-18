export class ValueLock<T> {
    private backupValue?: T

    constructor(
        private lockValue: T,
        private getValue: () => T,
        private setValue: (newValue: T) => void
    ) {}

    isLocked(): boolean {
        return this.backupValue !== undefined
    }

    lock(newValue: T) {
        if (this.isLocked()) throw new Error('called ValueLock#lock when value is already locked!')
        const oldValue = this.getValue()
        if (newValue !== undefined) this.setValue(newValue)
        this.setBackup(oldValue)
    }

    unlock() {
        const oldValue = this.backupValue!
        if (!this.isLocked()) throw new Error("called ValueLock#unlock when value wasn't locked!")
        this.setBackup(undefined)
        this.setValue(oldValue)
    }

    setBackup(value: T | undefined) {
        this.backupValue = value
    }

    updateLock(shouldLock: boolean) {
        if (shouldLock) {
            if (!this.isLocked()) {
                this.lock(this.lockValue)
            }
        } else if (this.isLocked()) {
            this.unlock()
        }
    }

    copy(): ValueLock<T> {
        const lock = new ValueLock(this.lockValue, this.getValue, this.setValue)
        lock.backupValue = lock.backupValue
        return lock
    }
}
