import type {} from 'ccmodmanager/types/gui/gui'
import { IdLabelDrawClass } from './label-draw'

export class InstanceinatorInstance {
    id: number
    labelDrawClasses: IdLabelDrawClass[]

    constructor(
        public ig: typeof window.ig,
        public sc: typeof window.sc,
        public modmanager: typeof window.modmanager,
        public name: string = 'default',
        private _display: boolean = true,
        public forceDraw: boolean = false
    ) {
        this.id = instanceinator.idCounter
        instanceinator.idCounter++

        if (!this.display && !forceDraw) this.ig.perf.draw = false

        this.labelDrawClasses = instanceinator.labelDrawClasses.map(clazz => new clazz(this))
    }

    set display(value: boolean) {
        this._display = value

        const displayType = value ? 'initial' : 'none'
        this.ig.system.inputDom.style.display = displayType

        if (value) {
            this.ig.music.resume(0.5)
        } else {
            this.ig.music.pause(0.5)
        }
    }
    get display() {
        return this._display
    }

    apply() {
        // @ts-expect-error
        global.ig = window.ig = this.ig
        // @ts-expect-error
        global.sc = window.sc = this.sc
        // @ts-expect-error
        global.modmanager = window.modmanager = this.modmanager
        instanceinator.id = this.id
    }

    drawLabels() {
        let y = 0
        for (const clazz of this.labelDrawClasses) {
            y = clazz.draw(y)
        }
    }

    setCanvasScale(scale: number) {
        this.sc.options.values['pixel-size'] = scale - 1
        this.ig.system.resize(ig.system.width, ig.system.height, scale)
    }
}

declare global {
    namespace ig {
        interface Game {
            scheduledTasks: (() => void)[]
            nextScheduledTasks: (() => void)[]
        }
    }
}
export function injectInstance() {
    sc.StartLoader.inject({
        draw() {
            if (ig.ready) {
                clearInterval(this._intervalId)
            } else {
                this.parent()
            }
        },
    })

    ig.Game.inject({
        init() {
            this.scheduledTasks = []
            this.nextScheduledTasks = []
            this.parent()
        },
        update() {
            for (const task of this.scheduledTasks) task()
            this.scheduledTasks = this.nextScheduledTasks
            this.nextScheduledTasks = []

            this.parent()
        },
        draw() {
            this.parent()
            const inst = instanceinator.instances[instanceinator.id]
            if (!inst) return
            inst.drawLabels()
        },
    })

    ig.Loader.inject({
        finalize() {
            if (this._instanceId != instanceinator.id) {
                instanceinator.instances[this._instanceId].ig.game.scheduledTasks.push(() => {
                    this.finalize()
                })
            } else {
                this.parent()
            }
        },
        draw() {
            if (this._instanceId != instanceinator.id) return
            this.parent()
        },
    })

    cursorFix()
    modmanagerFix()
    dialogFix()
    musicFix()
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
