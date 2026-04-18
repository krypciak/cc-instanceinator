import type {} from 'ccmodmanager/types/gui/gui'
import { IdLabelDrawClass } from './label-draw'
import { injectFixesPrestart } from './fixes/all'
import { filterInstanceObjectsFromArray, runTask, scheduleTask } from './inst-util'
import { initBuffersOnDrawEnable } from './performance'

type SoundPlayConditionFunc = (this: InstanceinatorInstance) => boolean

export interface InstanceinatorInstanceConfig {
    name: string
    display?: boolean
    forceDraw?: boolean
    soundPlayCondition?: SoundPlayConditionFunc
}
export interface InstanceinatorInstanceGlobals {
    ig: typeof window.ig
    sc: typeof window.sc
    modmanager: typeof window.modmanager
    nax?: typeof window.nax
}

export class InstanceinatorInstance implements InstanceinatorInstanceGlobals {
    id: number

    name!: string
    forceDraw!: boolean
    soundPlayCondition!: SoundPlayConditionFunc

    ig: typeof window.ig
    sc: typeof window.sc
    modmanager: typeof window.modmanager
    nax?: typeof window.nax

    labelDrawClasses: IdLabelDrawClass[]

    destroyed: boolean = false

    constructor({ ig, sc, modmanager, nax }: InstanceinatorInstanceGlobals, config: InstanceinatorInstanceConfig) {
        this.id = instanceinator.idCounter++

        this.ig = ig
        this.sc = sc
        this.modmanager = modmanager
        this.nax = nax

        this.setConfig(config)

        this.labelDrawClasses = instanceinator.labelDrawClasses.map(clazz => new clazz(this))

        instanceinator.allInstances.add(this)
    }

    setConfig({
        name,
        display = true,
        forceDraw = false,
        soundPlayCondition = () => this.display,
    }: InstanceinatorInstanceConfig) {
        this.name = name
        this._display = display
        this.forceDraw = forceDraw
        this.soundPlayCondition = soundPlayCondition
    }

    private _display!: boolean
    get display() {
        return this._display
    }
    set display(value: boolean) {
        if (this.destroyed) throw new Error('set InstanceinatorInstance#display when instance destroyed!')
        this._display = value

        this.ig.perf.draw =
            (this.display || this.forceDraw) && (!window.crossnode || !window.crossnode.options?.nukeImageStack)

        const displayType = value ? 'initial' : 'none'
        this.ig.system.inputDom.style.display = displayType

        runTask(this, () => {
            if (ig.perf.draw) initBuffersOnDrawEnable()

            if (ig.music) {
                if (value) {
                    ig.music.resume(0.5)
                } else {
                    ig.music.pause(0.5)
                }
            }
            ig.soundManager?.updateMasterVolumeLock()
        })
    }

    apply() {
        global.ig = window.ig = this.ig
        global.sc = window.sc = this.sc
        global.modmanager = window.modmanager = this.modmanager
        // @ts-expect-error
        global.nax = window.nax = this.nax
        instanceinator.id = this.id
    }

    destroy() {
        if (this.destroyed) throw new Error('called InstanceinatorInstance#destroy twice!')
        this.destroyed = true
        const div = this.ig.system?.inputDom
        if (div) document.body.removeChild(div)

        ig.storage.listeners = filterInstanceObjectsFromArray(ig.storage.listeners, this.id)

        runTask(this, () => {
            for (const handle of (ig.soundManager?.soundHandles as ig.SoundHandleWebAudio[]) ?? []) {
                handle.pause(true)
                handle.stop()
            }
            ig.music?.pause()
            ig.mapSounds?.onReset()
        })

        instanceinator.allInstances.delete(this)
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
                scheduleTask(instanceinator.instances[this._instanceId], () => {
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

    injectFixesPrestart()
}
