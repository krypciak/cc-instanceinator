import type { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import ccmod from '../ccmod.json'
import type {} from 'crossnode/crossnode.d.ts'
import type { Mod1 } from './types'
import { injectInstance, InstanceinatorInstance } from './instance'
import { injectTiling, retile } from './tiler'
import { injectFocus } from './focus'
import { copyInstance, type InstanceinatorCopyInstanceConfig } from './instance-copy'
import { registerOpts } from './options'
import { FpsLabelDrawClass, IdLabelDrawClass, type LabelDrawClass } from './label-draw'
import { setMusicInstanceId } from './fixes/music-fix'
import { classes, initClasses } from './custom-classes'
import { injectTitleScreenHide } from './title-screen-hide'
import { injectPerformance } from './performance'

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
        initClasses()
        injectInstance()
        injectTiling()
        injectFocus()
        injectTitleScreenHide()
        injectPerformance()

        if (window.crossnode?.options.test) {
            import('./tests')
        }

        const baseInst = new InstanceinatorInstance(
            { ig, sc, modmanager: window.modmanager, nax: window.nax },
            { name: 'base' }
        )
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
    musicInstanceId: number = 0
    cachedInstances: Record<string, Promise<InstanceinatorInstance>[]> = {}
    allInstances: Set<InstanceinatorInstance> = new Set()

    labelDrawClasses: (new (instance: InstanceinatorInstance) => LabelDrawClass)[] = [
        IdLabelDrawClass,
        FpsLabelDrawClass,
    ]

    resetInstanceIdCounter() {
        if (instanceinator.allInstances.size != 1)
            throw new Error('instanceinator.instances need to be empty when calling resetInstanceIdCounter!')
        this.idCounter = 1
    }

    append(instance: InstanceinatorInstance) {
        this.instances[instance.id] = instance
        this.retile()
    }

    destroy(instance: InstanceinatorInstance) {
        if (!this.instances[instance.id]) return
        if (instance.id == 0) throw new Error('Cannot delete base instance with id 0!')
        if (instanceinator.id == instance.id)
            throw new Error(`Cannot delete currently applied instance! id: ${instance.id}`)

        this.instances[instance.id].destroy()

        delete this.instances[instance.id]
        this.retile()
    }

    getAllCreatedInstances() {
        return this.allInstances
    }

    getCachedInstanceCount(cacheKey?: string) {
        if (cacheKey) return this.cachedInstances[cacheKey]?.length ?? 0
        return Object.values(this.cachedInstances).reduce((acc, v) => acc + v.length, 0)
    }

    async createCachedInstances(baseInst: InstanceinatorInstance, configs: InstanceinatorCopyInstanceConfig[]) {
        return Promise.all(
            configs.map(async (copyConfig, i) => {
                const cacheKey = copyConfig.cacheKey
                if (!cacheKey) throw new Error('called createCachedInstances without a cacheKey in copyConfig!')
                const arr = (this.cachedInstances[cacheKey] ??= [])
                arr.push(
                    this.copy(
                        baseInst,
                        {
                            name: `cached-${cacheKey}-${Date.now()}-${i}`,
                            display: false,
                        },
                        { ...copyConfig, cacheKey: undefined, noAppend: true }
                    )
                )
            })
        )
    }

    retile = retile
    copy = copyInstance
    setMusicInstanceId = setMusicInstanceId
    classes!: typeof classes
}
