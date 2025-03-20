import { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import type {} from 'crossnode/crossnode.d.ts'
import { Mod1 } from './types'
import { injectInstance, InstanceinatorInstance } from './instance'
import { injectTiling } from './tiler'
import { injectFocus } from './focus'
import { injectCacheableFix } from './cachable-fix'

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
        injectCacheableFix()
        if (window.crossnode?.options.test) {
            import('./tests')
        }
    }
    async poststart() {
        const baseInst = instanceinator.Instance.currentReference('base', true)
        instanceinator.append(baseInst)
    }
}

class Instanceinator {
    id: number = 0
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
        if (instance.id == 0) throw new Error('Cannot delete base instance with id 0!')
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
