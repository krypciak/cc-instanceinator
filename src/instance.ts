import type {} from 'ccmodmanager/types/gui/gui'
import { IdLabelDrawClass } from './label-draw'
import { injectFixes } from './fixes'

export class InstanceinatorInstance {
    id: number
    labelDrawClasses: IdLabelDrawClass[]

    constructor(
        public ig: typeof window.ig,
        public sc: typeof window.sc,
        public modmanager: typeof window.modmanager,
        public name: string = 'default',
        private _display: boolean = true,
        public forceDraw: boolean = false
    ) {
        this.id = instanceinator.idCounter
        instanceinator.idCounter++

        if (!this.display && !forceDraw) this.ig.perf.draw = false

        this.labelDrawClasses = instanceinator.labelDrawClasses.map(clazz => new clazz(this))
    }

    set display(value: boolean) {
        this._display = value

        const displayType = value ? 'initial' : 'none'
        this.ig.system.inputDom.style.display = displayType

        if (value) {
            this.ig.music.resume(0.5)
        } else {
            this.ig.music.pause(0.5)
        }
    }
    get display() {
        return this._display
    }

    apply() {
        global.ig = window.ig = this.ig
        global.sc = window.sc = this.sc
        global.modmanager = window.modmanager = this.modmanager
        instanceinator.id = this.id
    }

    onDelete() {
        const div = this.ig.system?.inputDom
        if (div) document.body.removeChild(div)

    }

    drawLabels() {
        let y = 0
        for (const clazz of this.labelDrawClasses) {
            y = clazz.draw(y)
        }
    }

    setCanvasScale(scale: number) {
        this.sc.options.values['pixel-size'] = scale - 1
        this.ig.system.resize(ig.system.width, ig.system.height, scale)
    }
}

declare global {
    namespace ig {
        interface Game {
            scheduledTasks: (() => void)[]
            postScheduledTasks: (() => void)[]
            nextScheduledTasks: (() => void)[]
        }
    }
}
export function injectInstance() {
    sc.StartLoader.inject({
        draw() {
            if (ig.ready) {
                clearInterval(this._intervalId)
            } else {
                this.parent()
            }
        },
    })

    ig.Game.inject({
        init() {
            this.scheduledTasks = []
            this.nextScheduledTasks = []
            this.postScheduledTasks = []
            this.parent()
        },
        update() {
            for (const task of this.scheduledTasks) task()
            this.scheduledTasks = this.nextScheduledTasks
            this.nextScheduledTasks = []

            this.parent()
        },
        deferredUpdate() {
            this.parent()

            for (const task of this.postScheduledTasks) task()
            this.postScheduledTasks = []
        },
        draw() {
            this.parent()
            const inst = instanceinator.instances[instanceinator.id]
            if (!inst) return
            inst.drawLabels()
        },
    })

    ig.Loader.inject({
        finalize() {
            if (this._instanceId != instanceinator.id) {
                instanceinator.instances[this._instanceId].ig.game.scheduledTasks.push(() => {
                    this.finalize()
                })
            } else {
                this.parent()
            }
        },
        draw() {
            if (this._instanceId != instanceinator.id) return
            this.parent()
        },
    })

    injectFixes()
}
