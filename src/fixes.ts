import { runTask } from './inst-util'
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

    ig.Cacheable.inject({
        staticInstantiate(...args) {
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
                    cached.onInstanceReused && cached.onInstanceReused()
                    cached.increaseRef()
                    return cached
                }
            }
            return null
        },

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
                this.onCacheCleared && this.onCacheCleared()
                if (this.cacheKey) this.constructor.cache[this.cacheKey] = null
            }
        },
    })

    ig.WeatherInstance.inject({ instanceUnique: true })
    ig.EnvParticleSpawner.inject({ instanceUnique: true })
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

function musicFix() {
    ig.Music.inject({
        play(track, fadeOut, fadeIn, volume, stopOnEnd) {
            if (instanceinator.instances[instanceinator.id]?.display === false) return
            this.parent(track, fadeOut, fadeIn, volume, stopOnEnd)
        },
    })
}

function audioFix() {
    ig.SoundManager.inject({
        requestPlaySoundHandle(groupName, handle) {
            const inst = instanceinator.instances[instanceinator.id]
            if (!inst.display) return

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
