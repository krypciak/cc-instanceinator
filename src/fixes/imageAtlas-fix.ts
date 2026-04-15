import { runTask } from '../inst-util'

export function imageAtlasFix() {
    function getPrimaryInstanceId() {
        for (const id in instanceinator.instances) {
            if (instanceinator.instances[id].ig.perf.draw) return id
        }
        return 0
    }

    ig.ImageAtlas.inject({
        fillFragments() {
            if (instanceinator.id != getPrimaryInstanceId()) return
            return this.parent()
        },
    })
    ig.ImageAtlasFragment.inject({
        _fill() {
            const inst = instanceinator.instances[this._instanceId]
            if (!inst) return this.parent()

            return runTask(inst, () => this.parent())
        },
    })
}
