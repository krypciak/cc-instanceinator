import { runTask } from '../inst-util'
import type { InstanceinatorInstance } from '../instance'
import { ValueLock } from './value-lock'

declare global {
    namespace ig {
        interface SoundManager {
            intervalId: NodeJS.Timeout

            masterVolumeLock: ValueLock<number>

            updateMasterVolumeLock(this: this): void
        }
    }
}

function captureIntervalId(func: () => void): NodeJS.Timeout {
    const origSetInterval = window.setInterval
    let intervalId!: NodeJS.Timeout
    // @ts-expect-error
    window.setInterval = (...args: any[]) => {
        // @ts-expect-error
        const id = origSetInterval.call(window, ...args)
        intervalId = id
        return id
    }

    func()

    window.setInterval = origSetInterval
    return intervalId
}

function shouldMuteAudio(inst: InstanceinatorInstance | undefined): boolean {
    return !inst?.soundPlayCondition()
}

export function audioFix() {
    ig.SoundManager.inject({
        init() {
            this.intervalId = captureIntervalId(() => this.parent())
            this.masterVolumeLock = new ValueLock(
                0,
                () => this.volumes.master.gain.value,
                vol => {
                    this.volumes.master.gain.value = vol
                }
            )
        },
        _updateTracks() {
            const inst = instanceinator.instances[this._instanceId]
            if (!inst) {
                clearInterval(this.intervalId)
                return
            }
            if (!inst.soundPlayCondition()) return
            return runTask(inst, () => this.parent())
        },
        update() {
            this.parent()
            this.updateMasterVolumeLock()
        },
        updateMasterVolumeLock() {
            const inst = instanceinator.instances[this._instanceId]
            const shouldMute = shouldMuteAudio(inst)
            this.masterVolumeLock.updateLock(shouldMute)
        },
        setMasterVolume(volume) {
            if (this.masterVolumeLock.isLocked()) this.masterVolumeLock.setBackup(volume)
            else return this.parent(volume)
        },
    })
}
