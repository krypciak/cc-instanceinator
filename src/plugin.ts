import { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import ccmod from '../ccmod.json'
import type {} from 'crossnode/crossnode.d.ts'
import { Mod1 } from './types'
import { injectInstance, InstanceinatorInstance } from './instance'
import { injectTiling, retile } from './tiler'
import { injectFocus } from './focus'
import { copyInstance } from './instance-copy'
import { registerOpts } from './options'
import { FpsLabelDrawClass, IdLabelDrawClass, LabelDrawClass } from './label-draw'

import './class-id-to-class'

export let poststartReached = false

export default class CCInstanceinator implements PluginClass {
    static dir: string
    static mod: Mod1
    static manifset: typeof import('../ccmod.json') = ccmod

    constructor(mod: Mod1) {
        CCInstanceinator.dir = mod.baseDirectory
        CCInstanceinator.mod = mod
        CCInstanceinator.mod.isCCL3 = mod.findAllAssets ? true : false
        CCInstanceinator.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')
        if (!CCInstanceinator.mod.isCCL3) Object.assign(mod, { id: CCInstanceinator.mod.name })

        global.instanceinator = window.instanceinator = new Instanceinator()
    }

    async prestart() {
        registerOpts()
        injectInstance()
        injectTiling()
        injectFocus()

        if (window.crossnode?.options.test) {
            import('./tests')
        }

        const baseInst = new InstanceinatorInstance(ig, sc, window.modmanager, 'base', true)
        instanceinator.append(baseInst)
    }

    poststart() {
        poststartReached = true
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

    labelDrawClasses: (new (instance: InstanceinatorInstance) => LabelDrawClass)[] = [
        IdLabelDrawClass,
        FpsLabelDrawClass,
    ]

    resetInstanceIdCounter() {
        if (Object.keys(instanceinator.instances).length != 1)
            throw new Error('instanceinator.instances need to be empty when calling resetInstanceIdCounter!')
        this.idCounter = 1
    }

    append(instance: InstanceinatorInstance) {
        this.instances[instance.id] = instance
        this.retile()
    }

    delete(instance: InstanceinatorInstance) {
        if (!this.instances[instance.id]) return
        if (instance.id == 0) throw new Error('Cannot delete base instance with id 0!')
        if (instanceinator.id == instance.id)
            throw new Error(`Cannot delete currently applied instance! id: ${instance.id}`)

        this.instances[instance.id].onDelete()

        delete this.instances[instance.id]
        this.retile()
    }

    retile = retile

    copy = copyInstance
}
