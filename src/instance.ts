type SetFunc = (name: string, to?: any) => void

export class InstanceinatorInstance {
    private static instanceIdCounter = 0

    public static resetInstanceIdCounter() {
        if (Object.keys(instanceinator.instances).length != 1)
            throw new Error('instanceinator.instances need to be empty when calling resetInstanceIdCounter!')
        this.instanceIdCounter = 1
    }

    static currentReference(name?: string, display?: boolean): InstanceinatorInstance {
        const nc = new InstanceinatorInstance(ig, sc, name, display)
        if (!display) nc.ig.system.inputDom.style.display = 'none'
        return nc
    }

    public static displayInstanceId: boolean = false

    private static createDomElements(id: number, display?: boolean) {
        const canvasId = `canvas${id}`
        const gameId = `game${id}`
        const divE = document.createElement('div')
        divE.id = gameId

        const canvasE = document.createElement('canvas')
        canvasE.id = canvasId

        divE.appendChild(canvasE)

        document.body.appendChild(divE)
        if (!display) {
            divE.style.display = 'none'
        }

        return {
            canvasId: `canvas${id}`,
            gameId: `game${id}`,
            canvasE,
            divE,
        }
    }

    private static classes: ReturnType<typeof this.initClasses>
    private static initClasses() {
        const System: ig.SystemConstructor = ig.System.extend({
            startRunLoop() {},
        })
        const CrossCode: sc.CrossCodeConstructor = sc.CrossCode.extend({
            init() {
                this.parent()
                this.events = new ig.EventManager()
                this.renderer = new ig.Renderer2d()
                this.physics = new ig.Physics()
            },
        })
        const Gui: ig.GuiConstructor = ig.Gui.extend({
            init() {
                this.parent()
                this.renderer = new (ig.classIdToClass[this.renderer.classId] as unknown as ig.GuiRendererConstructor)()
            },
        })
        const classes = {
            System,
            CrossCode,
            Gui,
        }
        this.classes = classes
        return classes
    }

    static async copy(s: InstanceinatorInstance, name?: string, display?: boolean): Promise<InstanceinatorInstance> {
        if (!InstanceinatorInstance.classes) InstanceinatorInstance.initClasses()

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

        const prevInst = instanceinator.instances[instanceinator.instanceId]

        const ns = new InstanceinatorInstance(ig, sc, name, display)
        ns.apply()

        const { canvasId, gameId } = this.createDomElements(ns.id, display)

        igset('classIdToClass')
        igset(
            'system',
            new InstanceinatorInstance.classes.System(
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
        igset('imageAtlas')
        // igset('imageAtlas', new ig.ImageAtlas())
        igset('spritePool', new ig.SpritePool())

        /* addons */
        igset('gamepad')
        igset('storage', new ig.Storage())
        igset('bgm', new ig.Bgm())
        igset('camera', new ig.Camera())
        igset('rumble', new ig.Rumble())
        igset('slowMotion', new ig.SlowMotion())
        igset('gui', new InstanceinatorInstance.classes.Gui())
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

        igToInit.erase('game')
        igToInit.erase('mainLoader')
        igToInit.erase('vars')
        for (const k of igToInit) igset(k)

        scToInit.erase('gui')
        for (const k of scToInit) scset(k)

        ig.initGameAddons = () => gameAddons
        // igset('game', new sc.CrossCode())
        // ig.initGameAddons = undefined
        // ig.system.setDelegate(ig.game)
        //

        ig.ready = true
        ig.mainLoader = new sc.StartLoader(InstanceinatorInstance.classes.CrossCode)
        ig.mainLoader.load()

        prevInst.apply()

        await new Promise<void>(res => {
            const id = setInterval(() => {
                if (ig.ready) {
                    res()
                    clearInterval(id)
                }
            }, 100)
        })

        // revertAfterTo.apply()
        return ns
    }

    id: number

    private constructor(
        public ig: typeof window.ig,
        public sc: typeof window.sc,
        public name: string = 'default',
        public display: boolean = true
    ) {
        this.id = InstanceinatorInstance.instanceIdCounter
        InstanceinatorInstance.instanceIdCounter++
    }

    apply() {
        // @ts-expect-error
        global.ig = window.ig = this.ig
        // @ts-expect-error
        global.sc = window.sc = this.sc
        instanceinator.instanceId = this.id
    }

    drawLabel() {
        if (!InstanceinatorInstance.displayInstanceId /*|| getDisplayInstances().length <= 1*/) return
        const text = new ig.TextBlock(
            sc.fontsystem.font,
            `#${instanceinator.instanceId} ${instanceinator.instances[instanceinator.instanceId].name}`,
            {}
        )
        text.draw(ig.system.width - text.size.x - 5, 0)
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
            instanceinator.instances[instanceinator.instanceId]?.drawLabel()
        },
    })

    ig.Loader.inject({
        finalize() {
            if (this._instanceId != instanceinator.instanceId) {
                instanceinator.instances[this._instanceId].ig.game.scheduledTasks.push(() => {
                    this.finalize()
                })
            } else {
                this.parent()
            }
        },
        draw() {
            if (this._instanceId != instanceinator.instanceId) return
            this.parent()
        },
    })

    cursorFix()
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
