import type {} from 'crossnode/crossnode.d.ts'
import { InstanceinatorInstance } from './instance'
import { retile } from './tiler'
import { copyInstance, type InstanceinatorCopyInstanceConfig } from './instance-copy'
import { FpsLabelDrawClass, IdLabelDrawClass, type LabelDrawClass } from './label-draw'
import { updateMusicInstanceId } from './fixes/music-fix'
import { classes } from './custom-classes'

declare global {
    var instanceinator: Instanceinator
    namespace NodeJS {
        interface Global {
            instanceinator: Instanceinator
        }
    }
}

export class Instanceinator {
    id: number = 0
    instances: Record<number, InstanceinatorInstance> = {}
    currentInstanceFocus: number = 0
    idCounter: number = 0
    displayId: boolean = false
    displayFps: boolean = false
    cachedInstances: Record<string, Promise<InstanceinatorInstance>[]> = {}

    labelDrawClasses: (new (instance: InstanceinatorInstance) => LabelDrawClass)[] = [
        IdLabelDrawClass,
        FpsLabelDrawClass,
    ]

    resetInstanceIdCounter() {
        if (Object.keys(instanceinator.instances).length != 1)
            throw new Error('instanceinator.instances need to be empty when calling resetInstanceIdCounter!')
        this.idCounter = 1
    }

    private _musicInstanceId: number = 0
    get musicInstanceId() {
        return this._musicInstanceId
    }
    set musicInstanceId(id: number) {
        if (this._musicInstanceId !== id) {
            this._musicInstanceId = id
            updateMusicInstanceId()
        }
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
                        { ...copyConfig, cacheKey: undefined }
                    )
                )
            })
        )
    }

    retile = retile
    copy = copyInstance
    classes!: typeof classes
}
