declare global {
    namespace ig {
        var hideTitleScreen: boolean | undefined
    }
}

export function injectTitleScreenHide() {
    sc.TitleScreenGui.inject({
        init() {
            this.parent()
            if (!ig.hideTitleScreen) return
            /* dont show title screen, instead show a black screen */
            this.introGui.timeLine = [
                { time: 1e10, gui: 'baseBG', state: 'DEFAULT' },
                { time: 0, end: true },
            ]
        },
    })
}
