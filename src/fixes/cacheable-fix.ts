declare global {
    namespace ig {
        interface Cacheable {
            instanceUnique?: boolean
        }
    }
}

export function cacheableFix() {
    let cleaningCache = false
    const orig = ig.cleanCache
    ig.cleanCache = function (...args) {
        cleaningCache = true
        orig(...args)
        cleaningCache = false
    }

    let ignoreCacheStaticInstantiate = false
    function createCacheStaticInstantiate<T extends ig.Cacheable>(onCachedFound: (clazz: T) => T) {
        function cacheStaticInstantiate(this: ig.Cacheable, ...args: any[]) {
            if (ignoreCacheStaticInstantiate) return null
            ignoreCacheStaticInstantiate = false

            const con = this.constructor as any
            if (!con.cache) {
                con.cache = {}
                const cacheType = con.prototype.cacheType
                if (!cacheType) throw Error('ig.Cacheable without CacheType!')
                if (ig.cacheList[cacheType] != void 0) throw Error('Duplicated cacheType: ' + cacheType)
                ig.cacheList[cacheType] = con.cache
            }
            let cacheKey = this.getCacheKey.call(this, ...args)

            /* changed here */
            if (this.instanceUnique) cacheKey = `${cacheKey}_inst_${instanceinator.id}`

            if (cacheKey) {
                this.cacheKey = cacheKey
                const cached = con.cache[cacheKey]
                if (cached) {
                    ignoreCacheStaticInstantiate = true
                    const obj = onCachedFound(cached)
                    ignoreCacheStaticInstantiate = false
                    obj.increaseRef()
                    return obj
                }
            }
            return null
        }
        return cacheStaticInstantiate
    }

    ig.Cacheable.inject({
        staticInstantiate: createCacheStaticInstantiate(cached => {
            cached.onInstanceReused?.()
            cached.increaseRef()
            return cached
        }),
        init() {
            if (this.cacheKey) this.constructor.cache[this.cacheKey] = this
            this.increaseRef()
        },
        increaseRef() {
            this.referenceCount++
            if (this.cacheKey) this.emptyMapChangeCount = 0
        },
        decreaseRef() {
            this.referenceCount--
            if (this.referenceCount < 0)
                throw Error("Call to decreaseRef() results in negative count! Key: '" + this.cacheKey + "'")

            if (this.referenceCount == 0 && (!this.cacheKey || cleaningCache)) {
                this.onCacheCleared?.()
                if (this.cacheKey) this.constructor.cache[this.cacheKey] = null
            }
        },
    })

    ig.WeatherInstance.inject({ instanceUnique: true })
    ig.EnvParticleSpawner.inject({ instanceUnique: true })
    ig.TrackWebAudio.inject({ instanceUnique: true })

    sc.PlayerConfig.inject({
        staticInstantiate: createCacheStaticInstantiate((cached: sc.PlayerConfig) => {
            if (cached._instanceId == instanceinator.id) return cached

            const elementConfigs: sc.PlayerConfig['elementConfigs'] = {} as any
            for (const elementStr of Object.keys(sc.ELEMENT) as (keyof typeof sc.ELEMENT)[]) {
                const element = sc.ELEMENT[elementStr]
                const subConfig = new sc.PlayerSubConfig(elementStr, {})
                subConfig.actions = cached.elementConfigs[element].actions
                subConfig.preSkillInit()
                elementConfigs[element] = subConfig
            }
            return new Proxy(cached, {
                get(target, p, receiver) {
                    const key = p as keyof sc.PlayerConfig
                    if (key != 'elementConfigs') return Reflect.get(target, p, receiver)
                    return elementConfigs
                },
            })
        }),
    })
}
