interface StartLoader extends sc.StartLoader {
    readyCallback?: () => void
}
interface StartLoaderConstructor extends ImpactClass<StartLoader> {
    new (gameClass: sc.CrossCodeConstructor): StartLoader
}

export let classes: ReturnType<typeof initClasses>
export function initClasses() {
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
    const GameModel: sc.GameModelConstructor = sc.GameModel.extend({
        init() {
            this.parent()
            this.leaConfig = new sc.PlayerConfig('Lea')
        },
    })
    const Weather: ig.WeatherConstructor = ig.Weather.extend({
        init() {
            this.parent()
            this.currentWeather = new ig.WeatherInstance('NONE')
            this.clouds = new ig.Clouds()
            this.fog = new ig.Fog()
            this.rain = new ig.Rain()
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
        GameModel,
        Weather,
    }
    instanceinator.classes = classes = classes1
    return classes1
}
