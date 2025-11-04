import { runTask } from './inst-util'
import { InstanceinatorInstance } from './instance'
import type {} from 'nax-ccuilib/src/ui/quick-menu/quick-menu-extension'

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

            /* fix memory leaks */
            ig.gui.removeGuiElement(window.testGui)
            window.testGui = undefined as any
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
    const ExtensionManager: ig.ExtensionManagerConstructor = ig.ExtensionManager.extend({
        init() {
            this.parent()
        },
        load() {
            const orig = instanceinator.instances[0].ig.extensions
            this.list = orig.list
            this.enabled = orig.enabled
        },
    })

    const classes1 = {
        System,
        CrossCode,
        Gui,
        CommonEvents,
        QuestModel,
        StartLoader,
        ExtensionManager,
    }
    classes = classes1
    return classes1
}

function initIg(s: InstanceinatorInstance, gameAddons: any[]) {
    const ig: typeof window.ig = {} as any
    const igAny = ig as any
    const igToInit: string[] = []
    for (const key in s.ig) {
        if (key[0] == key[0].toUpperCase()) {
            igAny[key] = s.ig[key as keyof typeof s.ig]
        } else {
            const val = s.ig[key as keyof typeof s.ig]
            if (typeof val === 'object') {
                igToInit.push(key)
            } else {
                igAny[key] = val
            }
        }
    }

    const igset: SetFunc = (name, to) => {
        igAny[name] = to ?? s.ig[name as keyof typeof s.ig]
        igToInit.erase(name)
        if (igAny[name] instanceof ig.GameAddon) {
            gameAddons.push(igAny[name])
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
    igset('extensions', new classes.ExtensionManager())
    igset('lang')
    igset('globalSettings')
    igset('terrain')
    igset('soundManager')

    ig.EntityPool = { ...s.ig.EntityPool }
    ig.EntityPool.drainAllPools()

    ig.ScreenBufferPool = { ...s.ig.ScreenBufferPool }
    ig.ScreenBufferPool.handleList = []
    ig.ScreenBufferPool.freeBuffers = []

    return { ig, igset, igToInit }
}

function initSc(s: InstanceinatorInstance, gameAddons: any[]) {
    const sc: typeof window.sc = {} as any
    const scAny = sc as any
    const scToInit: string[] = []
    for (const key in s.sc) {
        if (key[0] == key[0].toUpperCase()) {
            scAny[key] = s.sc[key as keyof typeof s.sc]
        } else {
            const val = s.sc[key as keyof typeof s.sc]
            if (typeof val === 'object') {
                scToInit.push(key)
            } else {
                scAny[key] = val
            }
        }
    }
    const scset: SetFunc = (name, to) => {
        scAny[name] = to ?? s.sc[name as keyof typeof s.sc]
        scToInit.erase(name)
        if (scAny[name] instanceof ig.GameAddon) {
            gameAddons.push(scAny[name])
        }
    }

    scset('skilltree')
    scset('version')

    /* memory leak fixes */
    sc.TeleportCentralMap = { ...s.sc.TeleportCentralMap }
    sc.TeleportCentralMap.fields = {}

    /* poolEntries from ig.GuiStepPool */
    ig.GuiTransform = ig.GuiTransform.extend({})
    ig.GuiDrawable = ig.GuiDrawable.extend({})

    /* nax-ccuilib  */
    sc.QuickRingMenu = sc.QuickRingMenu.extend({})

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
    ig: typeof window.ig,
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
    igset('imageAtlas')
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
    // @ts-expect-error
    igset('navigation', new ig.Navigation())
    igset('mapStyle', new ig.MapStyle())
    // @ts-expect-error
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
}

function afterApplySc(
    sc: typeof window.sc,
    scset: SetFunc,
    scToInit: string[],
    s: InstanceinatorInstance,
    gameAddons: any[]
) {
    // @ts-expect-error
    gameAddons.push(new sc.VersionTracker())
    scset('globalinput', new sc.GlobalInput())
    scset('fontsystem', new sc.FontSystem())
    scset('timers', new sc.TimersModel())
    scset('stats', new sc.StatsModel())
    // @ts-expect-error
    scset('trophies', new sc.TrophyManager())
    scset('autoControl', new sc.AutoControl())
    // @ts-expect-error
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
    // @ts-expect-error
    scset('gameCode', new sc.GameCode())
    scset('mapInteract', new sc.MapInteract())
    scset('elevatorModel', new sc.ElevatorModel())
    // @ts-expect-error
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
    sc.arena.cups = s.sc.arena.cups
    scset('gamesense')
    scset('betaControls', new sc.BetaControls())

    scset('control', new sc.Control())
    scset('inventory', new sc.Inventory())
    scset('keyBinderGui', new sc.KeyBinderGui())

    scToInit.erase('gui')
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
        afterApplySc(sc, scset, scToInit, s, gameAddons)

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
