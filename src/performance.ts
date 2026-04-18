declare global {
    namespace ig {
        interface ScreenBlur {
            initBuffers(this: this): void
        }
        interface Light {
            initBuffers(this: this): void
        }
    }
}
export function injectPerformance() {
    ig.ScreenBlur.inject({
        initBuffers() {
            if (this.buffer) return

            let canvas = ig.$new('canvas')
            /* big performance improvement */
            canvas.width = ig.system.contextWidth // ig.system.realWidth
            canvas.height = ig.system.contextHeight // ig.system.realHeight
            this.buffer = canvas
            this.context = ig.system.getBufferContext(canvas)
            // this.context.scale(ig.system.contextScale, ig.system.contextScale)

            canvas = ig.$new('canvas')
            canvas.width = ig.system.contextWidth // ig.system.realWidth
            canvas.height = ig.system.contextHeight // ig.system.realHeight
            this.backBuffer = canvas
            this.backContext = ig.system.getBufferContext(canvas)
            // this.backContext.scale(ig.system.contextScale, ig.system.contextScale)
        },
        init() {
            if (instanceinator.id == 0) return this.parent()

            ig.GameAddon.prototype.init.call(this, 'ScreenBlur')
            this.timer = new ig.WeightTimer(true, 1, ig.TIMER_MODE.BLINK)

            if (ig.perf.draw) this.initBuffers()

            this.firstDraw = true
        },
        onPostDraw() {
            if (instanceinator.id == 0) return this.parent()

            let alpha = this._getAlpha()
            if (alpha < 1 || this.zooms.length) {
                const sw = ig.system.contextWidth // ig.system.realWidth
                const sh = ig.system.contextHeight // ig.system.realHeight
                const dw = ig.system.contextWidth
                const dh = ig.system.contextHeight
                const shouldDrawBack = alpha < 1 && this.repeatTimer <= 0
                if (shouldDrawBack) {
                    this.repeatTimer = this.repeatTimer + this.repeatCycle
                    this.backContext.globalAlpha = this.firstDraw ? 1 : alpha
                    this.backContext.drawImage(this.buffer, 0, 0, sw, sh, 0, 0, dw, dh)
                    this.backContext.globalAlpha = 1
                    this.firstDraw = false
                }
                ig.system.context = this.systemContext
                ig.system.canvas = this.systemBuffer
                alpha < 1 && ig.system.context.drawImage(this.backBuffer, 0, 0, sw, sh, 0, 0, dw, dh)
                if (!shouldDrawBack) {
                    ig.system.context.globalAlpha = alpha
                    ig.system.context.drawImage(this.buffer, 0, 0, sw, sh, 0, 0, dw, dh)
                    ig.system.context.globalAlpha = 1
                }
                for (const zoom of this.zooms) zoom.draw(this.buffer, sw, sh, dw, dh)
            }
        },
    })

    ig.Light.inject({
        initBuffers() {
            if (this.lightCanvas) return
            this.lightCanvas = ig.$new('canvas')
            this.lightCanvas.width = ig.system.contextWidth + 1
            this.lightCanvas.height = ig.system.contextHeight + 1
            this.lightContext = ig.system.getBufferContext(this.lightCanvas)
        },
        init() {
            if (instanceinator.id == 0) return this.parent()
            ig.GameAddon.prototype.init.call(this, 'Light')
            if (ig.perf.draw) this.initBuffers()
        },
    })
}

export function initBuffersOnDrawEnable() {
    ig.screenBlur?.initBuffers()
    ig.light?.initBuffers()
}
