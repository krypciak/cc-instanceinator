import { runTask } from '../inst-util'

declare global {
    namespace ig {
        interface SoundManager {
            intervalId: NodeJS.Timeout
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

export function audioFix() {
    ig.SoundManager.inject({
        init() {
            this.intervalId = captureIntervalId(() => this.parent())
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
        requestPlaySoundHandle(groupName, handle) {
            const inst = instanceinator.instances[instanceinator.id]
            if (!inst.soundPlayCondition()) return

            return this.parent(groupName, handle)
        },
    })
}
