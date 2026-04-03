import { runTask } from './inst-util'
import { InstanceinatorInstance, type InstanceinatorInstanceConfig } from './instance'
import type {} from 'nax-ccuilib/src/ui/quick-menu/quick-menu-extension'

const ObjectKeysT: <K extends string | number | symbol, V>(object: Record<K, V>) => K[] = Object.keys as any

type SetFunc = (name: string, to?: any) => void

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
    igset('extensions', new instanceinator.classes.ExtensionManager())
    igset('lang')
    igset('globalSettings')
    igset('terrain')
    igset('soundManager')

    /* cc-variable-charge-time */
    igset('onChargeTimingsOptionChange')

    ig.EntityPool = { ...s.ig.EntityPool }
    ig.EntityPool.drainAllPools()

    ig.ScreenBufferPool = { ...s.ig.ScreenBufferPool, handleList: [], freeBuffers: [] }

    gameAddons.push(...s.ig.game.addons.preUpdate.filter(a => !('classId' in a)))

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
        if (scAny[name] instanceof ig.GameAddon) {
            gameAddons.push(scAny[name])
        }
    }

    scset('skilltree')
    scset('version')

    /* memory leak fixes */
    sc.TeleportCentralMap = { ...s.sc.TeleportCentralMap, fields: {} }

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
        new instanceinator.classes.System(
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
    igset('gui', new instanceinator.classes.Gui())
    igset('guiImage', new ig.GuiImage())
    igset('light', new ig.Light())
    igset('weather', new instanceinator.classes.Weather())
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
}

function afterApplySc(
    sc: typeof window.sc,
    scset: SetFunc,
    scToInit: string[],
    s: InstanceinatorInstance,
    gameAddons: any[]
) {
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
    scset('model', new instanceinator.classes.GameModel())
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
    sc.playerSkins.skins = s.sc.playerSkins.skins
    sc.playerSkins.itemToSkin = s.sc.playerSkins.itemToSkin
    scset('bounceSwitchGroups', new sc.BounceSwitchGroups())
    scset('inputForcer', new sc.InputForcer())
    scset('savePreset')
    scset('quests', new instanceinator.classes.QuestModel())
    scset('commonEvents', new instanceinator.classes.CommonEvents())
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

export interface InstanceinatorCopyInstanceConfig {
    preLoad?: (inst: InstanceinatorInstance) => void
    cacheKey?: string
    hideTitleScreen?: boolean
    noAppend?: boolean
}

export async function copyInstance(
    s: InstanceinatorInstance,
    config: InstanceinatorInstanceConfig,
    { preLoad, cacheKey, hideTitleScreen, noAppend }: InstanceinatorCopyInstanceConfig = {}
): Promise<InstanceinatorInstance> {
    console.time('instance copy' + config.name)

    let ns: InstanceinatorInstance
    if (cacheKey && (instanceinator.cachedInstances[cacheKey] ?? []).length > 0) {
        ns = await instanceinator.cachedInstances[cacheKey].shift()!
        ns.setConfig(config)
        ns.display = !!config.display
    } else {
        const origIg = instanceinator.id

        const gameAddons: any[] = []
        const { ig, igset, igToInit } = initIg(s, gameAddons)
        const { sc, scset, scToInit } = initSc(s, gameAddons)
        const { modmanager } = initModManager(s)
        const { nax } = initNax(s)

        ns = new InstanceinatorInstance({ ig, sc, modmanager, nax }, config)
        ns.ig.hideTitleScreen = hideTitleScreen

        let promise!: Promise<void>
        let loader!: InstanceType<typeof instanceinator.classes.StartLoader>

        runTask(ns, () => {
            afterApplyIg(ig, igset, igToInit, s, ns)
            afterApplySc(sc, scset, scToInit, s, gameAddons)

            ns.display = !!config.display

            ig.initGameAddons = () => gameAddons

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
    if (!noAppend) instanceinator.append(ns)

    console.timeEnd('instance copy' + config.name)

    return ns
}
