import type {} from 'ccmodmanager/types/gui/gui'

export class InstanceinatorInstance {
    id: number

    constructor(
        public ig: typeof window.ig,
        public sc: typeof window.sc,
        public modmanager?: typeof window.modmanager,
        public name: string = 'default',
        public display: boolean = true,
        public forceDraw: boolean = false
    ) {
        this.id = instanceinator.idCounter
        instanceinator.idCounter++

        if (!display && !forceDraw) this.ig.perf.draw = false
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

    private lastDrawTime: number = 0
    private frameAvgCount: number = 60
    private lastFramesAvg: number = 0
    private lastFrames: number[] = []

    drawLabels() {
        let y = 0
        if (instanceinator.displayId) {
            const text = new ig.TextBlock(
                sc.fontsystem.font,
                `#${instanceinator.id} ${instanceinator.instances[instanceinator.id].name}`,
                {}
            )
            text.draw(ig.system.width - text.size.x - 5, y)
            y += text.size.y
        }
        if (instanceinator.displayFps) {
            const time = Date.now()
            const timeDiff = time - this.lastDrawTime
            this.lastFramesAvg += timeDiff / this.frameAvgCount
            if (this.lastFrames.length >= this.frameAvgCount) {
                this.lastFramesAvg -= this.lastFrames[0] / this.frameAvgCount
                this.lastFrames.splice(0, 1)
            }
            this.lastFrames.push(timeDiff)
            const fps = 1000 / this.lastFramesAvg

            const text = new ig.TextBlock(sc.fontsystem.font, `${fps.round(0)} fps`, {})

            text.draw(ig.system.width - text.size.x - 5, y)
            y += text.size.y
            this.lastDrawTime = time
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
            this.parent()
        },
        update() {
            for (const task of this.scheduledTasks) task()
            this.scheduledTasks = []

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

    /* fix modmanager crashes */
    if (window.modmanager) {
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
}
function cursorFix() {
    const sheet = [...document.styleSheets].find(sheet => sheet.href!.endsWith('game/page/game-base.css'))
    if (!sheet) return
    for (const rule of sheet.cssRules) {
        if ('selectorText' in rule && typeof rule.selectorText == 'string' && rule.selectorText.startsWith('#game')) {
            rule.selectorText = rule.selectorText.replace(/#game/, '[id^="game"]')
        }
    }
}
