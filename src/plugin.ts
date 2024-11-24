import { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import type {} from 'crossnode/crossnode.d.ts'
import { Mod1 } from './types'

export default class CCInstanceinator implements PluginClass {
    static dir: string
    static mod: Mod1

    instanceId: number = 0
    instances: Record<number, Instance> = {}

    classes!: {
        System: ig.SystemConstructor
        CrossCode: sc.CrossCodeConstructor
    }

    constructor(mod: Mod1) {
        CCInstanceinator.dir = mod.baseDirectory
        CCInstanceinator.mod = mod
        CCInstanceinator.mod.isCCL3 = mod.findAllAssets ? true : false
        CCInstanceinator.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')

        global.inst = window.inst = this
    }

    async prestart() {
        this.classes = {
            System: ig.System.extend({
                startRunLoop() {},
            }),
            CrossCode: sc.CrossCode.extend({
                init() {
                    this.parent()
                    this.events = new ig.EventManager()
                    this.renderer = new ig.Renderer2d()
                    this.physics = new ig.Physics()
                },
            }),
        }

        sc.TitleScreenGui.inject({
            init(...args) {
                this.parent(...args)
                if (true) {
                    this.introGui.timeLine = [{ time: 0, end: true }]
                    // @ts-expect-error
                    this.bgGui.parallax.addLoadListener({
                        onLoadableComplete: () => {
                            let { timeLine } = this.bgGui
                            // @ts-expect-error
                            let idx = timeLine.findIndex(item => item.time > 0)
                            if (idx < 0) idx = timeLine.length
                            timeLine.splice(idx, 0, { time: 0, goto: 'INTRO_SKIP_NOSOUND' })
                        },
                    })
                    this.removeChildGui(this.startGui)
                    // @ts-expect-error
                    this.startGui = {
                        show: () => {
                            ig.interact.removeEntry(this.screenInteract)
                            this.buttons.show()
                        },
                        hide: () => {},
                    }
                }
            },
        })

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
            run() {
                for (const task of this.scheduledTasks) task()
                this.scheduledTasks = []

                this.parent()
            },
        })
        ig.Loader.inject({
            init(gameClass) {
                this.parent(gameClass)
                this.instanceId = inst.instanceId
            },
            finalize() {
                if (this.instanceId != inst.instanceId) {
                    inst.instances[this.instanceId].ig.game.scheduledTasks.push(() => {
                        this.finalize()
                    })
                } else {
                    this.parent()
                }
            },
        })
        let counter = 0
        ig.System.inject({
            run() {
                const instances = Object.values(inst.instances).sort((a, b) => a.id - b.id)
                if (instances.length == 0) return this.parent()

                if (instances.length == 6) {
                    counter++
                    let nextInst = instances[instances.findIndex(a => a.id == inst.instanceId) + 1]
                    if (!nextInst) nextInst = instances[0]

                    nextInst.apply()
                }

                this.parent()
            },
            setCanvasSize(width, height, hideBorder) {
                this.parent(width, height, hideBorder)
                this.canvas.style.width = '100%'
                this.canvas.style.height = '100%'
            },
        })
        sc.OptionModel.inject({
            _setDisplaySize(call = false) {
                this.parent()

                if (call) return
                for (const instId of Object.keys(inst.instances).map(Number)) {
                    if (instId == inst.instanceId) continue
                    const instance = inst.instances[instId]
                    instance.ig.game.scheduledTasks.push(() => {
                        sc.options?._setDisplaySize(true)
                    })
                }

                const divs = Object.values(inst.instances).map(i => i.ig.system.inputDom)

                function fitRectangles() {
                    const ws = document.body.clientWidth
                    const hs = document.body.clientHeight

                    let bestWi = 0
                    let bestGrid = [0, 0]

                    const aspectRatioRev = 320 / 568
                    for (let nx = 1; nx <= Math.ceil(Math.sqrt(divs.length)) + 1; nx++) {
                        const ny = Math.ceil(divs.length / nx)
                        const wi = Math.min(ws / nx, hs / ny / aspectRatioRev)

                        if (wi > bestWi) {
                            bestWi = wi
                            bestGrid = [nx, ny]
                        }
                    }

                    return {
                        grid: bestGrid,
                        width: bestWi,
                        height: aspectRatioRev * bestWi,
                    }
                }

                const { grid, width, height } = fitRectangles()

                let itemI = 0
                for (let column = 0; column < grid[1]; column++) {
                    for (let row = 0; row < grid[0]; row++) {
                        const item = divs[itemI]
                        if (!item) break
                        item.style.position = 'absolute'
                        item.style.top = `${column * height}px`
                        item.style.left = `${row * width}px`
                        item.style.width = `${width}px`
                        item.style.height = `${height}px`

                        itemI++
                    }
                }
            },
        })
    }

    async poststart() {
        this.instances[0] = Instance.currentReference()

        for (let i = 1; i < 6; i++) {
            this.instances[i] = await Instance.copy(this.instances[0])
            this.instances[i].apply()
        }
    }
}

declare global {
    var inst: CCInstanceinator
    namespace NodeJS {
        interface Global {
            inst: CCInstanceinator
        }
    }

    namespace ig {
        interface Loader {
            instanceId: number
        }
        interface Game {
            scheduledTasks: (() => void)[]
        }
    }
    namespace sc {
        interface OptionModel {
            _setDisplaySize(call?: boolean): void
        }
    }
}

type SetFunc = (name: string, to?: any) => void
export class Instance {
    private static instanceIdCounter = 0

    static currentReference(): Instance {
        return new Instance(ig, sc)
    }

    static async copy(s: Instance): Promise<Instance> {
        const ig: any = {}
        const igToInit: string[] = []
        for (const key in s.ig) {
            if (key[0] == key[0].toUpperCase()) {
                ig[key] = s.ig[key as keyof typeof s.ig]
            } else {
                const val = s.ig[key as keyof typeof s.ig]
                if (typeof val === 'object') {
                    igToInit.push(key)
                } else {
                    ig[key] = val
                }
            }
        }

        const gameAddons: any[] = []

        const igset: SetFunc = (name, to) => {
            ig[name] = to ?? s.ig[name as keyof typeof s.ig]
            igToInit.erase(name)
            if (ig[name] instanceof ig.GameAddon) {
                gameAddons.push(ig[name])
            }
        }

        igset('perf', { ...s.ig.perf })
        igset('resources', [])
        igset('dataOS')
        igset('fileForwarding')
        igset('ua')
        igset('loadCollectors', [])
        igset('nwjsVersion')
        igset('tileInfoList')
        igset('dom')
        igset('global')
        // @ts-expect-error
        igset('profile', { ...s.ig.profile })
        igset('jsonTemplate')
        igset('database')
        igset('modules')
        igset('langFileList')
        igset('cacheList')
        igset('dataBrowser')
        igset('extensions')
        igset('lang')
        igset('globalSettings')
        igset('terrain')
        igset('soundManager')

        const sc: any = {}
        const scToInit: string[] = []
        for (const key in s.sc) {
            if (key[0] == key[0].toUpperCase()) {
                sc[key] = s.sc[key as keyof typeof s.sc]
            } else {
                const val = s.sc[key as keyof typeof s.sc]
                if (typeof val === 'object') {
                    scToInit.push(key)
                } else {
                    sc[key] = val
                }
            }
        }

        const scset: SetFunc = (name, to) => {
            sc[name] = to ?? s.sc[name as keyof typeof s.sc]
            scToInit.erase(name)
            if (sc[name] instanceof ig.GameAddon) {
                gameAddons.push(sc[name])
            }
        }

        scset('skilltree')
        scset('version')

        const ns = new Instance(ig, sc)
        ns.apply()

        const canvasId = `canvas${ns.id}`
        const gameId = `game${ns.id}`

        const divE = document.createElement('div')
        divE.id = gameId

        const canvasE = document.createElement('canvas')
        canvasE.id = canvasId

        divE.appendChild(canvasE)

        document.body.appendChild(divE)

        igset(
            'system',
            new inst.classes.System(
                '#' + canvasId,
                '#' + gameId,
                s.ig.system.fps,
                s.ig.system.width,
                s.ig.system.height,
                s.ig.system.realWidth / s.ig.system.width
            )
        )
        igset('input', new ig.Input())
        igset('music', new ig.Music())
        igset('imageAtlas', new ig.ImageAtlas())
        igset('spritePool', new ig.SpritePool())

        /* addons */
        igset('gamepad')
        igset('storage', new ig.Storage())
        igset('bgm', new ig.Bgm())
        igset('camera', new ig.Camera())
        igset('rumble', new ig.Rumble())
        igset('slowMotion', new ig.SlowMotion())
        igset('gui', new ig.Gui())
        igset('guiImage', new ig.GuiImage())
        igset('light', new ig.Light())
        igset('weather', new ig.Weather())
        igset('navigation', new ig.Navigation())
        igset('mapStyle', new ig.MapStyle())
        igset('mapImage', new ig.MapImageManager())
        igset('overlay', new ig.Overlay())
        igset('dreamFx', new ig.DreamFx())
        igset('screenBlur', new ig.ScreenBlur())
        igset('interact', new ig.InteractManager())
        igset('envParticles', new ig.EnvParticles())
        igset('mapSounds', new ig.MapSounds())
        igset('greenworks')
        gameAddons.push(new sc.VersionTracker())
        scset('globalinput', new sc.GlobalInput())
        scset('fontsystem', new sc.FontSystem())
        scset('timers', new sc.TimersModel())
        scset('stats', new sc.StatsModel())
        scset('trophies', new sc.TrophyManager())
        scset('autoControl', new sc.AutoControl())
        scset('message', new sc.MessageModel())
        scset('options', new sc.OptionModel())
        scset('quickmodel', new sc.QuickMenuModel())
        scset('map', new sc.MapModel())
        scset('lore', new sc.LoreModel())
        scset('trade', new sc.TradeModel())
        scset('menu', new sc.MenuModel())
        scset('model', new sc.GameModel())
        scset('detectors', new sc.Detectors())
        scset('combat', new sc.Combat())
        scset('pvp', new sc.PvpModel())
        scset('newgame', new sc.NewGamePlusModel())
        scset('enemyBooster', new sc.EnemyBooster())
        scset('gameCode', new sc.GameCode())
        scset('mapInteract', new sc.MapInteract())
        scset('elevatorModel', new sc.ElevatorModel())
        scset('skipInteract', new sc.SkipInteract())
        scset('npcRunner', new sc.NpcRunnerSpawner())
        scset('party', new sc.PartyModel())
        scset('playerSkins', new sc.PlayerSkinLibrary())
        scset('bounceSwitchGroups', new sc.BounceSwitchGroups())
        scset('inputForcer', new sc.InputForcer())
        scset('savePreset')
        scset('quests', new sc.QuestModel())
        scset('commonEvents', new sc.CommonEvents())
        scset('voiceActing')
        scset('credits', new sc.CreditsManager())
        scset('arena', new sc.Arena())
        scset('gamesense')
        scset('betaControls', new sc.BetaControls())
        igset('langEdit')

        scset('control', new sc.Control())
        scset('inventory', new sc.Inventory())
        scset('keyBinderGui', new sc.KeyBinderGui())

        ig.initGameAddons = () => gameAddons
        // igset('game', new sc.CrossCode())
        // ig.initGameAddons = undefined
        // ig.system.setDelegate(ig.game)
        //

        ig.ready = true
        ig.mainLoader = new sc.StartLoader(inst.classes.CrossCode)
        ig.mainLoader.load()

        await new Promise<void>(res => {
            const id = setInterval(() => {
                if (ig.ready) {
                    res()
                    clearInterval(id)
                }
            }, 100)
        })

        // s.apply()
        return ns
    }

    id: number

    private constructor(
        public ig: typeof window.ig,
        public sc: typeof window.sc
    ) {
        this.id = Instance.instanceIdCounter
        Instance.instanceIdCounter++
    }

    apply() {
        // @ts-expect-error
        global.ig = window.ig = this.ig
        // @ts-expect-error
        global.sc = window.sc = this.sc
        inst.instanceId = this.id
    }
}
