import { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import type {} from 'crossnode/crossnode.d.ts'
import { Mod1 } from './types'
import { injectInstance, InstanceinatorInstance } from './instance'
import { injectTiling } from './tiler'
import { injectFocus } from './focus'

import './class-id-to-class'

export default class CCInstanceinator implements PluginClass {
    static dir: string
    static mod: Mod1

    constructor(mod: Mod1) {
        CCInstanceinator.dir = mod.baseDirectory
        CCInstanceinator.mod = mod
        CCInstanceinator.mod.isCCL3 = mod.findAllAssets ? true : false
        CCInstanceinator.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')
        if (!CCInstanceinator.mod.isCCL3) Object.assign(mod, { id: CCInstanceinator.mod.name })

        global.instanceinator = window.instanceinator = new Instanceinator()
    }

    async prestart() {
        injectInstance()
        injectTiling()
        injectFocus()
        if (window.crossnode?.options.test) {
            import('./tests')
        }

        // ig.System.inject({
        //     run() {
        //         const insts = Object.values(instanceinator.instances).sort((a, b) => a.id - b.id)
        //         if (insts.length <= 1) return this.parent()
        //
        //         if (insts.length == 6) {
        //             let nextInst = insts[insts.findIndex(a => a.id == instanceinator.instanceId) + 1]
        //             if (!nextInst) nextInst = insts[0]
        //
        //             nextInst.apply()
        //         }
        //
        //         this.parent()
        //     },
        // })
    }

    // async poststart() {
    //     instanceinator.instances[0] = instanceinator.Instance.currentReference('master')
    //
    //     for (let i = 1; i < 6; i++) {
    //         const inst = await instanceinator.Instance.copy(instanceinator.instances[0], 'child')
    //         instanceinator.append(inst)
    //         inst.apply()
    //     }
    // }
}

class Instanceinator {
    instanceId: number = 0
    instances: Record<number, InstanceinatorInstance> = {}
    currentInstanceFocus: number = 0

    Instance = InstanceinatorInstance

    appendListeners: ((id: number) => void)[] = []
    deleteListeners: ((id: number) => void)[] = []

    append(instance: InstanceinatorInstance) {
        this.instances[instance.id] = instance
        for (const func of this.appendListeners) func(instance.id)
    }

    delete(instance: InstanceinatorInstance) {
        delete this.instances[instance.id]
        for (const func of this.deleteListeners) func(instance.id)
    }
}

declare global {
    var instanceinator: Instanceinator
    namespace NodeJS {
        interface Global {
            instanceinator: Instanceinator
        }
    }
}
