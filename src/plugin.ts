import { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import type {} from 'crossnode/crossnode.d.ts'
import { Mod1 } from './types'

export default class CCSession implements PluginClass {
    static dir: string
    static mod: Mod1

    constructor(mod: Mod1) {
        CCSession.dir = mod.baseDirectory
        CCSession.mod = mod
        CCSession.mod.isCCL3 = mod.findAllAssets ? true : false
        CCSession.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')
    }

    ref!: Session
    copy!: Session

    async prestart() {
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

        ig.System.inject({
            run() {
                if (!ig.system.delegate) return
                this.parent()
            },
        })
        let counter = 0
        const self = this
        ig.System.inject({
            run() {
                if (self.ref && self.copy) {
                    counter++
                    if (counter % 8 == 0) {
                        if (sessionId == 0) {
                            console.log('copy')
                            self.copy.apply()
                        } else {
                            console.log('ref')
                            self.ref.apply()
                        }
                    }
                }

                this.parent()
            },
        })
    }

    async poststart() {
        this.ref = Session.currentReference()

        this.copy = await Session.copy(this.ref)
        this.copy.apply()
    }
}

declare global {
    var sessionId: number
}

type SetFunc = (name: string, to?: any) => void
class Session {
    private static sessionIdCounter = 0

    static currentReference(): Session {
        return new Session(ig, sc)
    }

    static async copy(s: Session): Promise<Session> {
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

        const ns = new Session(ig, sc)
        ns.apply()

        const canvasId = 'canvas1'
        const gameId = 'game1'

        const divE = document.createElement('div')
        divE.id = gameId

        const canvasE = document.createElement('canvas')
        canvasE.id = canvasId
        canvasE.style.position = 'absolute'
        canvasE.style.top = '700'
        canvasE.style.width = '1280'
        canvasE.style.height = '707'

        document.getElementById('game')!.style.position = 'absolute'
        document.getElementById('game')!.style.top = '0'
        document.getElementById('game')!.style.width = '1280'
        document.getElementById('game')!.style.height = '707'

        divE.appendChild(canvasE)

        document.body.appendChild(divE)

        igset(
            'system',
            new ig.System(
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
        ig.mainLoader = new sc.StartLoader(
            sc.CrossCode.extend({
                init() {
                    this.parent()
                    this.events = new ig.EventManager()
                    this.renderer = new ig.Renderer2d()
                    this.physics = new ig.Physics()
                },
            })
        )
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
        this.id = Session.sessionIdCounter
        Session.sessionIdCounter++
    }

    apply() {
        // @ts-expect-error
        global.ig = window.ig = this.ig
        // @ts-expect-error
        global.sc = window.sc = this.sc
        // @ts-expect-error
        global.sessionId = window.sessionId = this.id
    }
}
