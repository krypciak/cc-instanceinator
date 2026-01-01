import { runTask, runTasks } from './inst-util'
import { InstanceinatorInstance } from './instance'

export function injectFixes() {
    cacheableFix()
    imageAtlasFix()
    modmanagerFix()
    cursorFix()
    dialogFix()
    musicFix()
    audioFix()
    optionModelFix()
    nwjsFullscreenFix()
}

declare global {
    namespace ig {
        interface Cacheable {
            instanceUnique?: boolean
        }
    }
}
function cacheableFix() {
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

function imageAtlasFix() {
    function getPrimaryInstanceId() {
        for (const id in instanceinator.instances) {
            if (instanceinator.instances[id].ig.perf.draw) return id
        }
        return 0
    }

    ig.ImageAtlas.inject({
        fillFragments() {
            if (instanceinator.id != getPrimaryInstanceId()) return
            return this.parent()
        },
    })
    ig.ImageAtlasFragment.inject({
        _fill() {
            const inst = instanceinator.instances[this._instanceId]
            if (!inst) return this.parent()

            return runTask(inst, () => this.parent())
        },
    })
}

function modmanagerFix() {
    function replace<T extends ig.Class, E extends unknown[], R>(
        this: T & { parent(this: T, ...args: E): R },
        ...args: E
    ): R {
        return runTask(instanceinator.instances[this._instanceId], () => {
            return this.parent(...args)
        })
    }
    /* fix modmanager crashes */
    modmanager.gui.MenuList.inject({
        reloadEntries: replace,
    })
    modmanager.gui.Menu.inject({
        showModInstallDialog: replace,
    })
    modmanager.gui.ListEntry.inject({
        updateIcon: replace,
        tryEnableMod(mod) {
            return microWrap(() => this.parent(mod))
        },
    })
    modmanager.gui.MultiPageButtonBoxGui.inject({
        closeMenu: replace,
        refreshPage: replace,
    })
}

function cursorFix() {
    const sheet = [...document.styleSheets].find(sheet => sheet.href?.endsWith('game/page/game-base.css'))
    if (!sheet) return
    for (const rule of sheet.cssRules) {
        if ('selectorText' in rule && typeof rule.selectorText == 'string' && rule.selectorText.startsWith('#game')) {
            rule.selectorText = rule.selectorText.replace(/#game/, '[id^="game"]')
        }
    }
}

const microStack: number[] = []
function microBegin(depth: number, inst: InstanceinatorInstance = instanceinator.instances[instanceinator.id]) {
    Promise.resolve().then(() => {
        microStack.push(instanceinator.id)
        inst.apply()

        if (depth > 0) microBegin(--depth, inst)
    })
}
function microEnd(depth: number) {
    Promise.resolve().then(() => {
        const inst = instanceinator.instances[microStack.pop()!]
        inst.apply()

        if (depth > 0) microEnd(--depth)
    })
}

function microWrap<T>(func: () => T, depth: number = 1, inst?: InstanceinatorInstance) {
    microBegin(depth, inst)
    const ret = func()
    microEnd(depth)
    return ret
}

function dialogFix() {
    const originalShowChoiceDialog = sc.Dialogs.showChoiceDialog
    sc.Dialogs.showChoiceDialog = (text, icon, options, callback, disableSubmitSound) => {
        const id = instanceinator.id
        return originalShowChoiceDialog(
            text,
            icon,
            options,
            function (...args) {
                const inst = instanceinator.instances[id]
                return runTask(inst, () => microWrap(() => callback(...args), 2, inst))
            },
            disableSubmitSound
        )
    }
}

function shouldMuteMusic(inst: InstanceinatorInstance) {
    return instanceinator.musicInstanceId != inst.id // inst.display === false
}

function updateMusicTrackVolume(music: ig.Music, trackRaw: ig.Track | undefined) {
    if (!trackRaw) return
    const track = trackRaw as ig.TrackWebAudio
    const inst = instanceinator.instances[music._instanceId]
    const shouldMute = !inst || shouldMuteMusic(inst)
    // console.log('updateMusicTrackVolume', 'ig.music:', music._instanceId, 'instanceinator.id:', instanceinator.id, 'isLocked:', track.isVolumeLocked(), 'shouldMute:', shouldMute)
    if (shouldMute) {
        if (!track.isVolumeLocked()) {
            track.lockVolume(0)
        }
    } else if (track.isVolumeLocked()) {
        track.unlockVolume()
    }
}

export function setMusicInstanceId(id: number) {
    if (!instanceinator.instances[id]) console.warn(`setMusicInstanceId: instance with id: ${id} doesn't exist!`)
    if (instanceinator.musicInstanceId !== id) {
        instanceinator.musicInstanceId = id
        runTasks(Object.values(instanceinator.instances), () => {
            for (const track of ig.music.trackStack) updateMusicTrackVolume(ig.music, track.track)
        })
    }
}

declare global {
    namespace ig {
        interface TrackWebAudio {
            volumeBackup?: number

            isVolumeLocked(this: this): boolean
            lockVolume(this: this, newVolume?: number): void
            unlockVolume(this: this): void
        }
    }
}

function musicFix() {
    ig.TrackWebAudio.inject({
        isVolumeLocked() {
            return this.volumeBackup !== undefined
        },
        setVolume(volume) {
            if (this.isVolumeLocked()) this.volumeBackup = volume
            else return this.parent(volume)
        },
        lockVolume(newVolume) {
            if (this.isVolumeLocked())
                throw new Error('called ig.TrackWebAudio#lockVolume when volume is already locked!')
            const oldVolume = Math.sqrt(this._volume / this.baseVolume)
            if (newVolume !== undefined) this.setVolume(newVolume)
            this.volumeBackup = oldVolume
        },
        unlockVolume() {
            const oldVolume = this.volumeBackup!
            if (!this.isVolumeLocked())
                throw new Error("called ig.TrackWebAudio#unlockVolume when volume wasn't locked!")
            this.volumeBackup = undefined
            this.setVolume(oldVolume)
        },
    })
    ig.BgmTrack.inject({
        copy() {
            const newCopy = this.parent()
            ;(newCopy.track as ig.TrackWebAudio).volumeBackup = (this.track as ig.TrackWebAudio).volumeBackup
            return newCopy
        },
    })
    ig.Music.inject({
        inbetween(track, volume, fadeIn, volumeMultiplier) {
            this.parent(track, volume, fadeIn, volumeMultiplier)
            updateMusicTrackVolume(this, track)
        },
        _checkCurrentTrackEquality() {
            updateMusicTrackVolume(this, this.currentTrack?.track)
            return this.parent()
        },
        _playTopSong() {
            this.parent()
            updateMusicTrackVolume(this, this.currentTrack?.track)
        },
        onWindowFocusGained() {
            this.parent()
            updateMusicTrackVolume(this, this.inBetweenTrack?.track)
            updateMusicTrackVolume(this, this.currentTrack?.track)
        },
    })
}

function audioFix() {
    ig.SoundManager.inject({
        requestPlaySoundHandle(groupName, handle) {
            const inst = instanceinator.instances[instanceinator.id]
            if (!inst.soundPlayCondition()) return

            return this.parent(groupName, handle)
        },
    })
}

function optionModelFix() {
    function defineModEnabledProperties(optionModel: sc.OptionModel) {
        // @ts-ignore
        const mods = window.inactiveMods.concat(window.activeMods)
        /* simplify decided that it's ok using a completely separate loading stage
         * (the 'modsLoaded' event that's directly after the main loading stage)
         * and defining sc.options.values for mod active status then,
         * so instead of just copying the properties I need to initialize the properties myself */
        for (const mod of mods) {
            const key = `modEnabled-${mod.name}`
            Object.defineProperty(optionModel.values, key, {
                configurable: true,
                get: () => localStorage.getItem(key) !== 'false',
                set: value => {
                    localStorage.setItem(key, Boolean(value).toString())
                },
            })
        }
    }

    sc.OptionModel.inject({
        init() {
            this.parent()
            defineModEnabledProperties(this)
        },
    })
}

function nwjsFullscreenFix() {
    const nwGui = window.require('nw.gui')
    let win: any
    function queryNwGui(): boolean {
        win ??= nwGui.Window.get()
        return win.isFullscreen
    }

    let isFullscreenCache = queryNwGui()
    let lastChecked = Date.now()
    function isFullscreenCached() {
        const now = Date.now()
        if (lastChecked + 10e3 < now) {
            isFullscreenCache = queryNwGui()
        }
        lastChecked = now
        return isFullscreenCache
    }

    sc.OptionModel.inject({
        _setFullscreen() {
            if (ig.platform == ig.PLATFORM_TYPES.DESKTOP) {
                const newValue = this.values.fullscreen
                localStorage.setItem('IG_FULLSCREEN', `${newValue}`)

                const oldValue = isFullscreenCached()
                if (oldValue != newValue) {
                    if (newValue) {
                        win.enterFullscreen()
                    } else {
                        win.leaveFullscreen()
                    }
                }
            }
        },
    })
}
