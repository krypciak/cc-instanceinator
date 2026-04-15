export function nwjsFullscreenFix() {
    const nwGui = window.require('nw.gui')
    let win: any
    function queryNwGui(): boolean {
        win ??= nwGui.Window.get()
        return win.isFullscreen
    }

    let isFullscreenCache = queryNwGui()
    let lastChecked = Date.now()
    function isFullscreenCached() {
        const now = Date.now()
        if (lastChecked + 500 < now) {
            isFullscreenCache = queryNwGui()
        }
        lastChecked = now
        return isFullscreenCache
    }

    sc.OptionModel.inject({
        _setFullscreen() {
            if (ig.platform == ig.PLATFORM_TYPES.DESKTOP) {
                const newValue = this.values.fullscreen
                localStorage.setItem('IG_FULLSCREEN', `${newValue}`)

                const oldValue = isFullscreenCached()
                if (oldValue != newValue && instanceinator.instances[instanceinator.id]) {
                    if (newValue) {
                        win.enterFullscreen()
                    } else {
                        win.leaveFullscreen()
                    }
                }
            }
        },
    })
}
