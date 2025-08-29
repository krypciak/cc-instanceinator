import { runTask } from './inst-util'

export function injectFixes() {
    cacheableFix()
    imageAtlasFix()
    modmanagerFix()
    cursorFix()
    dialogFix()
    musicFix()
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
    ig.ImageAtlas.inject({
        fillFragments() {
            if (instanceinator.id != 0) return
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
    /* fix modmanager crashes */
    modmanager.gui.MenuList.inject({
        reloadEntries() {
            const parent = this.parent
            instanceinator.instances[this._instanceId].ig.game.scheduledTasks.push(() => {
                parent.call(this)
            })
        },
    })
    modmanager.gui.Menu.inject({
        hideMenu(afterMenu, nextSubmenu) {
            const backup = window.setTimeout
            // @ts-expect-error
            window.setTimeout = (func: () => void, interval) => {
                backup(() => {
                    instanceinator.instances[this._instanceId].ig.game.scheduledTasks.push(() => {
                        func()
                    })
                }, interval)
            }
            this.parent(afterMenu, nextSubmenu)
            window.setTimeout = backup
        },
        showModInstallDialog() {
            const parent = this.parent
            instanceinator.instances[this._instanceId].ig.game.scheduledTasks.push(() => {
                parent.call(this)
            })
        },
    })
    modmanager.gui.ListEntry.inject({
        updateIcon(config) {
            const parent = this.parent
            instanceinator.instances[this._instanceId].ig.game.scheduledTasks.push(() => {
                parent.call(this, config)
            })
        },
    })
    modmanager.gui.MultiPageButtonBoxGui.inject({
        closeMenu() {
            const parent = this.parent
            instanceinator.instances[this._instanceId].ig.game.scheduledTasks.push(() => {
                parent.call(this)
            })
        },
        refreshPage() {
            const parent = this.parent
            instanceinator.instances[this._instanceId].ig.game.scheduledTasks.push(() => {
                parent.call(this)
            })
        },
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

function dialogFix() {
    const backup = sc.Dialogs.showChoiceDialog
    sc.Dialogs.showChoiceDialog = (...args) => {
        // @ts-expect-error
        const id = sc.Dialogs.id
        if (id === undefined || id == instanceinator.id) return backup(...args)

        instanceinator.instances[id].ig.game.scheduledTasks.push(() => {
            sc.Model.notifyObserver(modmanager.gui.menu, modmanager.gui.MENU_MESSAGES.UPDATE_ENTRIES)
            backup(...args)
        })

        // @ts-expect-error
        sc.Dialogs.id = undefined
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
