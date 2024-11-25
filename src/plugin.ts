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
        if (!CCInstanceinator.mod.isCCL3) Object.assign(mod, { id: CCInstanceinator.mod.name })

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

        // ig.System.inject({
        //     run() {
        //         const instances = Object.values(inst.instances).sort((a, b) => a.id - b.id)
        //         if (instances.length <= 1) return this.parent()
        //
        //         if (instances.length == 6) {
        //             let nextInst = instances[instances.findIndex(a => a.id == inst.instanceId) + 1]
        //             if (!nextInst) nextInst = instances[0]
        //
        //             nextInst.apply()
        //         }
        //
        //         this.parent()
        //     },
        // })
        injectInstance()
        injectTiling()
        if (window.crossnode?.options.test) {
            import('./tests')
        }
    }

    // async poststart() {
    //     this.instances[0] = Instance.currentReference('master')
    //
    //     for (let i = 1; i < 6; i++) {
    //         const instance = await Instance.copy(this.instances[0], 'child')
    //         this.append(instance)
    //         instance.apply()
    //     }
    // }

    append(instance: Instance) {
        this.instances[instance.id] = instance
    }

    delete(instance: Instance) {
        delete this.instances[instance.id]
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
