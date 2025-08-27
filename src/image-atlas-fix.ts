import { runTask } from './inst-util'

export function injectImageAtlasFix() {
    ig.ImageAtlas.inject({
        fillFragments() {
            const inst = instanceinator.instances[this._instanceId]
            if (!inst) return this.parent()

            return runTask(inst, () => this.parent())
        },
    })
}
