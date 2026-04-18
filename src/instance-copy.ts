import { runTask } from './inst-util'
import { InstanceinatorInstance, type InstanceinatorInstanceConfig } from './instance'
import type {} from 'nax-ccuilib/src/ui/quick-menu/quick-menu-extension'

const ObjectKeysT: <K extends string | number | symbol, V>(object: Record<K, V>) => K[] = Object.keys as any

type SetFunc = (name: string, to?: any) => void

function initIgSc(s: InstanceinatorInstance, gameAddons: (() => void)[]) {
    const ig: typeof window.ig = {} as any
    const igAny = ig as any
    const igToInit: string[] = []
    for (const key in s.ig) {
        if (key[0] == key[0].toUpperCase()) {
            igAny[key] = s.ig[key as keyof typeof s.ig]
        } else {
            const val = s.ig[key as keyof typeof s.ig]
            if (typeof val === 'object') {
                if (Array.isArray(val)) {
                    igAny[key] = [...val]
                } else {
                    igToInit.push(key)
                }
            } else {
                igAny[key] = val
            }
        }
    }

    const igset: SetFunc = (name, to) => {
        igAny[name] = to ?? s.ig[name as keyof typeof s.ig]
        igToInit.erase(name)
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
    igset('imageAtlas')
    igset('jsonTemplate')
    igset('database')
    igset('modules')
    igset('langFileList')
    igset('cacheList')
    igset('dataBrowser')
    igset('globalSettings')
    igset('terrain')

    /* cc-variable-charge-time */
    igset('onChargeTimingsOptionChange')

    ig.EntityPool = { ...s.ig.EntityPool }
    ig.EntityPool.drainAllPools()

    ig.ScreenBufferPool = { ...s.ig.ScreenBufferPool, handleList: [], freeBuffers: [] }

    gameAddons.push(...s.ig.game.addons.preUpdate.filter(a => !('classId' in a)).map(a => () => a))

    const sc: typeof window.sc = {} as any
    const scAny = sc as any
    const scToInit: string[] = []
    for (const key in s.sc) {
        if (key[0] == key[0].toUpperCase()) {
            scAny[key] = s.sc[key as keyof typeof s.sc]
        } else {
            const val = s.sc[key as keyof typeof s.sc]
            if (typeof val === 'object') {
                if (Array.isArray(val)) {
                    scAny[key] = [...val]
                } else {
                    scToInit.push(key)
                }
            } else {
                scAny[key] = val
            }
        }
    }
    const scset: SetFunc = (name, to) => {
        scAny[name] = to ?? s.sc[name as keyof typeof s.sc]
        scToInit.erase(name)
    }

    /* memory leak fixes */
    sc.TeleportCentralMap = { ...s.sc.TeleportCentralMap, fields: {} }

    /* poolEntries from ig.GuiStepPool */
    ig.GuiTransform = ig.GuiTransform.extend({})
    ig.GuiDrawable = ig.GuiDrawable.extend({})

    /* nax-ccuilib  */
    sc.QuickRingMenu = sc.QuickRingMenu.extend({})

    return { ig, igset, igToInit, sc, scset, scToInit }
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

function initNax(s: InstanceinatorInstance) {
    if (!s.nax) return { nax: undefined }

    const nax: typeof window.nax = {
        ccuilib: { ...s.nax.ccuilib },
    }
    {
        const orig = s.nax.ccuilib.QuickRingMenuWidgets
        nax.ccuilib.QuickRingMenuWidgets = {
            ...orig,
            observers: [...orig.observers],
            widgets: Object.fromEntries(Object.entries(orig.widgets).filter(([k]) => !k.startsWith('dummy'))),
        }
    }
    return { nax }
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

function getAddonList(s: InstanceinatorInstance): (() => ig.GameAddon)[] {
    const list: (() => ig.GameAddon)[] = []
    list.push(() => (ig.gamepad = s.ig.gamepad))
    list.push(() => (ig.storage = s.ig.storage))
    list.push(() => (ig.bgm = new ig.Bgm()))
    list.push(() => (ig.camera = new ig.Camera()))
    list.push(() => (ig.rumble = new ig.Rumble()))
    list.push(() => (ig.slowMotion = new ig.SlowMotion()))
    list.push(() => (ig.gui = new instanceinator.classes.Gui()))
    list.push(() => (ig.guiImage = new ig.GuiImage()))
    list.push(() => (ig.light = new ig.Light()))
    list.push(() => (ig.weather = new instanceinator.classes.Weather()))
    list.push(() => (ig.navigation = new ig.Navigation()))
    list.push(() => (ig.mapStyle = new ig.MapStyle()))
    list.push(() => (ig.mapImage = new ig.MapImageManager()))
    list.push(() => (ig.overlay = new ig.Overlay()))
    list.push(() => (ig.dreamFx = new ig.DreamFx()))
    list.push(() => (ig.screenBlur = new ig.ScreenBlur()))
    list.push(() => (ig.interact = new ig.InteractManager()))
    list.push(() => (ig.envParticles = new ig.EnvParticles()))
    list.push(() => (ig.mapSounds = new ig.MapSounds()))
    list.push(() => (ig.greenworks = s.ig.greenworks))

    list.push(() => new sc.VersionTracker())
    list.push(() => (sc.globalinput = new sc.GlobalInput()))
    list.push(() => (sc.timers = new sc.TimersModel()))
    list.push(() => (sc.stats = new sc.StatsModel()))
    list.push(() => (sc.trophies = new sc.TrophyManager()))
    list.push(() => (sc.autoControl = new sc.AutoControl()))
    list.push(() => (sc.message = new sc.MessageModel()))
    list.push(() => (sc.options = new sc.OptionModel()))
    list.push(() => (sc.quickmodel = new sc.QuickMenuModel()))
    list.push(() => (sc.map = new sc.MapModel()))
    list.push(() => (sc.lore = new sc.LoreModel()))
    list.push(() => (sc.trade = new sc.TradeModel()))
    list.push(() => (sc.menu = new sc.MenuModel()))
    list.push(() => (sc.model = new instanceinator.classes.GameModel()))

    list.push(() => (sc.detectors = new sc.Detectors()))
    list.push(() => (sc.combat = new sc.Combat()))
    list.push(() => (sc.pvp = new sc.PvpModel()))
    list.push(() => (sc.newgame = s.sc.newgame))
    list.push(() => (sc.enemyBooster = new sc.EnemyBooster()))
    list.push(() => (sc.gameCode = new sc.GameCode()))
    list.push(() => (sc.mapInteract = new sc.MapInteract()))
    list.push(() => (sc.elevatorModel = new sc.ElevatorModel()))
    list.push(() => (sc.skipInteract = new sc.SkipInteract()))
    list.push(() => (sc.npcRunner = new sc.NpcRunnerSpawner()))
    list.push(() => (sc.party = new sc.PartyModel()))
    list.push(() => {
        sc.playerSkins = new sc.PlayerSkinLibrary()
        sc.playerSkins.skins = s.sc.playerSkins.skins
        sc.playerSkins.itemToSkin = s.sc.playerSkins.itemToSkin
        return sc.playerSkins
    })
    list.push(() => (sc.bounceSwitchGroups = new sc.BounceSwitchGroups()))
    list.push(() => (sc.inputForcer = new sc.InputForcer()))
    list.push(() => s.sc.savePreset)
    list.push(() => (sc.quests = new instanceinator.classes.QuestModel()))
    list.push(() => (sc.commonEvents = new instanceinator.classes.CommonEvents()))
    list.push(() => (sc.voiceActing = s.sc.voiceActing))
    list.push(() => (sc.credits = new sc.CreditsManager()))
    list.push(() => {
        sc.arena = new sc.Arena()
        sc.arena.cups = s.sc.arena.cups
        return sc.arena
    })
    list.push(() => (sc.gamesense = s.sc.gamesense))
    list.push(() => (sc.betaControls = new sc.BetaControls()))
    list.push(() => (ig.langEdit = s.ig.langEdit))

    return list
}

function afterApply(
    ig: typeof window.ig,
    igset: SetFunc,
    igToInit: string[],
    sc: typeof window.sc,
    scset: SetFunc,
    scToInit: string[],
    s: InstanceinatorInstance,
    ns: InstanceinatorInstance
) {
    const { canvasId, gameId } = createDomElements(ns.id)

    igset('classIdToClass')
    igset('spritePool', new ig.SpritePool())
    igset('extensions', new instanceinator.classes.ExtensionManager())
    scset('inventory', new sc.Inventory())
    scset('version')
    scset('control', new sc.Control())
    scset('fontsystem', new sc.FontSystem())
    scset('skilltree')
    igset(
        'system',
        new instanceinator.classes.System(
            '#' + canvasId,
            '#' + gameId,
            s.ig.system.fps,
            s.ig.system.width,
            s.ig.system.height,
            s.ig.system.realWidth / s.ig.system.width
        )
    )
    igToInit.erase('vars')
    igset('lang')
    igset('input', new ig.Input())
    igset('soundManager', new instanceinator.classes.SoundManager())
    igset('music', new ig.Music())

    igToInit.erase('game')
    igToInit.erase('mainLoader')

    scToInit.erase('gui')
}

export interface InstanceinatorCopyInstanceConfig {
    preLoad?: (inst: InstanceinatorInstance) => void
    cacheKey?: string
    hideTitleScreen?: boolean
}

const PROFILE = false

export async function copyInstance(
    s: InstanceinatorInstance,
    config: InstanceinatorInstanceConfig,
    { preLoad, cacheKey, hideTitleScreen }: InstanceinatorCopyInstanceConfig = {}
): Promise<InstanceinatorInstance> {
    PROFILE && console.time('instance copy' + config.name)

    let ns: InstanceinatorInstance
    if (cacheKey && (instanceinator.cachedInstances[cacheKey] ?? []).length > 0) {
        ns = await instanceinator.cachedInstances[cacheKey].shift()!
        ns.setConfig(config)
        ns.display = !!config.display
    } else {
        const origIg = instanceinator.id

        const gameAddons: any[] = []
        const { ig, igset, igToInit, sc, scset, scToInit } = initIgSc(s, gameAddons)
        const { modmanager } = initModManager(s)
        const { nax } = initNax(s)

        ns = new InstanceinatorInstance({ ig, sc, modmanager, nax }, config)
        ns.ig.hideTitleScreen = hideTitleScreen

        let promise!: Promise<void>
        let loader!: InstanceType<typeof instanceinator.classes.StartLoader>

        runTask(ns, () => {
            afterApply(ig, igset, igToInit, sc, scset, scToInit, s, ns)

            ns.display = !!config.display

            ig.initGameAddons = () => {
                const addons = getAddonList(s)
                return addons.map(a => a())
            }

            if (preLoad) preLoad(ns)

            ig.ready = true
            loader = new instanceinator.classes.StartLoader(instanceinator.classes.CrossCode)
            ig.mainLoader = loader

            promise = new Promise<void>(res => {
                loader.readyCallback = res
            })
            loader.load()
        })

        await promise

        loader.readyCallback = undefined

        instanceinator.instances[origIg].apply()
    }

    PROFILE && console.timeEnd('instance copy' + config.name)

    return ns
}
