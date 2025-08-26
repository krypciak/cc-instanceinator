import { runTask } from './inst-util'
import { InstanceinatorInstance } from './instance'

const ObjectKeysT: <K extends string | number | symbol, V>(object: Record<K, V>) => K[] = Object.keys as any

type SetFunc = (name: string, to?: any) => void

interface StartLoader extends sc.StartLoader {
    readyCallback?: () => void
}
interface StartLoaderConstructor extends ImpactClass<StartLoader> {
    new (gameClass: sc.CrossCodeConstructor): StartLoader
}

let classes: ReturnType<typeof initClasses>
function initClasses() {
    const System: ig.SystemConstructor = ig.System.extend({
        init(...args) {
            const backup = HTMLCanvasElement.prototype.getContext
            HTMLCanvasElement.prototype.getContext = function (
                this: HTMLCanvasElement,
                type: '2d',
                options: undefined
            ) {
                if (options) throw new Error()
                return backup.call(this, type, { alpha: false, desynchronized: true })
            } as any
            this.parent(...args)
            HTMLCanvasElement.prototype.getContext = backup
        },
        startRunLoop() {},
    })
    const CrossCode: sc.CrossCodeConstructor = sc.CrossCode.extend({
        init() {
            this.addons = {
                all: [],
                levelLoadStart: [],
                levelLoaded: [],
                teleport: [],
                preUpdate: [],
                postUpdate: [],
                deferredUpdate: [],
                preDraw: [],
                midDraw: [],
                postDraw: [],
                varsChanged: [],
                reset: [],
                windowFocusChanged: [],
            }
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
    const CommonEvents: sc.CommonEventsConstructor = sc.CommonEvents.extend({
        _loadCommonEvents() {
            const orig = instanceinator.instances[0].sc.commonEvents
            this.events = orig.events
            this.eventsByType = orig.eventsByType
        },
    })
    const QuestModel: sc.QuestModelConstructor = sc.QuestModel.extend({
        _loadStaticQuests() {
            this.staticQuests = instanceinator.instances[0].sc.quests.staticQuests
        },
    })
    const StartLoader: StartLoaderConstructor = sc.StartLoader.extend({
        onEnd() {
            this.parent()
            this.readyCallback!()
        },
    })

    const classes1 = {
        System,
        CrossCode,
        Gui,
        CommonEvents,
        QuestModel,
        StartLoader,
    }
    classes = classes1
    return classes1
}

function initIg(s: InstanceinatorInstance, gameAddons: any[]) {
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

    return { ig, igset, igToInit }
}

function initSc(s: InstanceinatorInstance, gameAddons: any[]) {
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

    return { sc, scset, scToInit }
}

function initModManager(s: InstanceinatorInstance) {
    const gui: typeof window.modmanager.gui = {} as any
    gui.menu = null as any
    gui.optionsMenu = null as any
    for (const key of ObjectKeysT(s.modmanager.gui)) {
        if (gui[key] !== undefined) continue
        gui[key] = s.modmanager.gui[key] as any
    }

    const modmanager: typeof window.modmanager = {
        registerAndGetModOptions: s.modmanager.registerAndGetModOptions,
        openModOptionsMenu: s.modmanager.openModOptionsMenu,
        optionConfigs: s.modmanager.optionConfigs,
        options: s.modmanager.options,
        gui,
    }
    return { modmanager }
}

function createDomElements(id: number) {
    const canvasId = `canvas${id}`
    const gameId = `game${id}`
    const divE = document.createElement('div')
    divE.id = gameId

    const canvasE = document.createElement('canvas')
    canvasE.id = canvasId

    divE.appendChild(canvasE)

    document.body.appendChild(divE)

    return {
        canvasId: `canvas${id}`,
        gameId: `game${id}`,
        canvasE,
        divE,
    }
}

function afterApplyIg(
    ig: any,
    igset: SetFunc,
    igToInit: string[],
    s: InstanceinatorInstance,
    ns: InstanceinatorInstance
) {
    const { canvasId, gameId } = createDomElements(ns.id)

    igset('classIdToClass')
    igset(
        'system',
        new classes.System(
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
    igset('storage')
    igset('bgm', new ig.Bgm())
    igset('camera', new ig.Camera())
    igset('rumble', new ig.Rumble())
    igset('slowMotion', new ig.SlowMotion())
    igset('gui', new classes.Gui())
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

    igset('langEdit')

    igToInit.erase('game')
    igToInit.erase('mainLoader')
    igToInit.erase('vars')
    for (const k of igToInit) igset(k)
}

function afterApplySc(sc: any, scset: SetFunc, scToInit: string[], gameAddons: any[]) {
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
    scset('newgame')
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
    scset('quests', new classes.QuestModel())
    scset('commonEvents', new classes.CommonEvents())
    scset('voiceActing')
    scset('credits', new sc.CreditsManager())
    scset('arena', new sc.Arena())
    scset('gamesense')
    scset('betaControls', new sc.BetaControls())

    scset('control', new sc.Control())
    scset('inventory', new sc.Inventory())
    scset('keyBinderGui', new sc.KeyBinderGui())

    scToInit.erase('gui')
    for (const k of scToInit) scset(k)
}

export async function copyInstance(
    s: InstanceinatorInstance,
    name?: string,
    display?: boolean,
    forceDraw?: boolean,
    preLoad?: (inst: InstanceinatorInstance) => void
): Promise<InstanceinatorInstance> {
    if (!classes) initClasses()

    const gameAddons: any[] = []
    const { ig, igset, igToInit } = initIg(s, gameAddons)
    const { sc, scset, scToInit } = initSc(s, gameAddons)
    const { modmanager } = initModManager(s)

    const ns = new InstanceinatorInstance(ig, sc, modmanager, name, display, forceDraw)
    let promise!: Promise<void>
    let loader!: InstanceType<typeof classes.StartLoader>

    runTask(ns, () => {
        afterApplyIg(ig, igset, igToInit, s, ns)
        afterApplySc(sc, scset, scToInit, gameAddons)

        ns.display = !!display

        ig.initGameAddons = () => gameAddons

        if (preLoad) preLoad(ns)

        ig.ready = true
        loader = new classes.StartLoader(classes.CrossCode)
        ig.mainLoader = loader

        promise = new Promise<void>(res => {
            loader.readyCallback = res
        })
        loader.load()
    })

    await promise

    loader.readyCallback = undefined

    instanceinator.append(ns)
    return ns
}
