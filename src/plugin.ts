import { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import type {} from 'crossnode/crossnode.d.ts'
import { Mod1 } from './types'
import { injectInstance, Instance } from './instance'
import { injectTiling } from './tiler'

export default class CCInstanceinator implements PluginClass {
    static dir: string
    static mod: Mod1

    instanceId: number = 0
    instances: Record<number, Instance> = {}

    classes!: {
        System: ig.SystemConstructor
        CrossCode: sc.CrossCodeConstructor
    }
    Instance: typeof Instance

    constructor(mod: Mod1) {
        CCInstanceinator.dir = mod.baseDirectory
        CCInstanceinator.mod = mod
        CCInstanceinator.mod.isCCL3 = mod.findAllAssets ? true : false
        CCInstanceinator.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')

        this.Instance = Instance

        global.inst = window.inst = this
    }

    async prestart() {
        this.classes = {
            System: ig.System.extend({
                startRunLoop() {},
            }),
            CrossCode: sc.CrossCode.extend({
                init() {
                    this.parent()
                    this.events = new ig.EventManager()
                    this.renderer = new ig.Renderer2d()
                    this.physics = new ig.Physics()
                },
            }),
        }

        sc.TitleScreenGui.inject({
            init(...args) {
                this.parent(...args)
                if (true) {
                    this.introGui.timeLine = [{ time: 0, end: true }]
                    // @ts-expect-error
                    this.bgGui.parallax.addLoadListener({
                        onLoadableComplete: () => {
                            let { timeLine } = this.bgGui
                            // @ts-expect-error
                            let idx = timeLine.findIndex(item => item.time > 0)
                            if (idx < 0) idx = timeLine.length
                            timeLine.splice(idx, 0, { time: 0, goto: 'INTRO_SKIP_NOSOUND' })
                        },
                    })
                    this.removeChildGui(this.startGui)
                    // @ts-expect-error
                    this.startGui = {
                        show: () => {
                            ig.interact.removeEntry(this.screenInteract)
                            this.buttons.show()
                        },
                        hide: () => {},
                    }
                }
            },
        })

        let counter = 0
        ig.System.inject({
            run() {
                const instances = Object.values(inst.instances).sort((a, b) => a.id - b.id)

                if (instances.length > 0) {
                    counter++
                    let nextInst = instances[instances.findIndex(a => a.id == inst.instanceId) + 1]
                    if (!nextInst) nextInst = instances[0]

                    nextInst.apply()
                }

                this.parent()
            },
        })

        injectInstance()
        injectTiling()
    }

    async poststart() {
        this.instances[0] = Instance.currentReference()

        for (let i = 1; i < 2; i++) {
            const instance = await Instance.copy(this.instances[0], false)
            this.append(instance)
            instance.apply()
        }
    }

    append(instance: Instance) {
        this.instances[instance.id] = instance
    }
}

declare global {
    var inst: CCInstanceinator
    namespace NodeJS {
        interface Global {
            inst: CCInstanceinator
        }
    }
}
