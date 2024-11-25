type SetFunc = (name: string, to?: any) => void
export class Instance {
    private static instanceIdCounter = 0

    static currentReference(display?: boolean): Instance {
        return new Instance(ig, sc, display)
    }

    static async copy(s: Instance, display?: boolean): Promise<Instance> {
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

        const ns = new Instance(ig, sc, display)
        ns.apply()

        const canvasId = `canvas${ns.id}`
        const gameId = `game${ns.id}`

        const divE = document.createElement('div')
        divE.id = gameId

        const canvasE = document.createElement('canvas')
        canvasE.id = canvasId

        divE.appendChild(canvasE)

        document.body.appendChild(divE)
        if (!ns.display) {
            divE.style.display = 'none'
        }

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
        public sc: typeof window.sc,
        public display: boolean = true
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

declare global {
    namespace ig {
        interface Loader {
            instanceId: number
        }
        interface Game {
            scheduledTasks: (() => void)[]
        }
        interface Input {
            instanceId: number
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
}
