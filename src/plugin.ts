import { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import type {} from 'crossnode/crossnode.d.ts'
import { Mod1 } from './types'
import { injectInstance, InstanceinatorInstance } from './instance'
import { injectTiling, retile } from './tiler'
import { injectFocus } from './focus'
import { injectCacheableFix } from './cachable-fix'

import './class-id-to-class'
import { copyInstance } from './instance-copy'

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
        instanceinator.append(new InstanceinatorInstance(ig, sc, window.modmanager, 'base', true))
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

class Instanceinator {
    id: number = 0
    instances: Record<number, InstanceinatorInstance> = {}
    currentInstanceFocus: number = 0
    idCounter: number = 0
    displayId: boolean = false
    displayFps: boolean = false

    appendListeners: ((id: number) => void)[] = []
    deleteListeners: ((id: number) => void)[] = []

    resetInstanceIdCounter() {
        if (Object.keys(instanceinator.instances).length != 1)
            throw new Error('instanceinator.instances need to be empty when calling resetInstanceIdCounter!')
        this.idCounter = 1
    }

    append(instance: InstanceinatorInstance) {
        this.instances[instance.id] = instance
        for (const func of this.appendListeners) func(instance.id)
        this.retile()
    }

    delete(instance: InstanceinatorInstance) {
        if (!instanceinator.instances[instance.id]) return
        if (instance.id == 0) throw new Error('Cannot delete base instance with id 0!')

        const div = instance.ig.system?.inputDom
        if (div) document.body.removeChild(div)

        delete this.instances[instance.id]
        for (const func of this.deleteListeners) func(instance.id)
        this.retile()
    }

    retile = retile

    copy = copyInstance
}
