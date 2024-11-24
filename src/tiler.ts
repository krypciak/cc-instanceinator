declare global {
    namespace sc {
        interface OptionModel {
            _setDisplaySize(schedule?: boolean): void
        }
    }
}
export function injectTiling() {
    ig.System.inject({
        setCanvasSize(_width, _height, _hideBorder) {
            // if (Object.keys(inst.instances).length <= 1) return this.parent(width, height, hideBorder)
            this.canvas.style.width = '100%'
            this.canvas.style.height = '100%'
            this.canvas.className = 'borderHidden'
        },
    })

    sc.OptionModel.inject({
        _setDisplaySize(schedule = true) {
            if (Object.keys(inst.instances).length <= 1) return this.parent()

            if (!schedule) return this.parent()

            for (const instId of Object.keys(inst.instances).map(Number)) {
                const instance = inst.instances[instId]
                instance.ig.game.scheduledTasks.push(() => {
                    sc.options?._setDisplaySize(false)
                })
            }

            const insts = Object.values(inst.instances).sort((a, b) => a.id - b.id)

            const ws = document.body.clientWidth
            const hs = document.body.clientHeight
            function fitRectangles() {
                let bestWi = 0
                let bestGrid = [0, 0]

                const aspectRatioRev = 320 / 568
                for (let nx = 1; nx <= Math.ceil(insts.length); nx++) {
                    const ny = Math.ceil(insts.length / nx)
                    const wi = Math.min(ws / nx, hs / ny / aspectRatioRev)

                    if (wi > bestWi) {
                        bestWi = wi
                        bestGrid = [nx, ny]
                    }
                }

                return {
                    grid: bestGrid,
                    width: Math.floor(bestWi),
                    height: Math.floor(aspectRatioRev * bestWi),
                }
            }

            const { grid, width, height } = fitRectangles()
            const offsetX = (ws - grid[0] * width) / 2
            const offsetY = (hs - grid[1] * height) / 2

            let itemI = 0
            for (let column = 0; column < grid[1]; column++) {
                for (let row = 0; row < grid[0]; row++) {
                    const instance = insts[itemI]
                    if (!instance) break
                    const item = instance.ig.system.inputDom
                    item.style.position = 'absolute'
                    item.style.left = `${row * width + offsetX}px`
                    item.style.top = `${column * height + offsetY}px`
                    item.style.width = `${width}px`
                    item.style.height = `${height}px`

                    instance.ig.system.screenWidth = width
                    instance.ig.system.screenHeight = height

                    itemI++
                }
            }
        },
    })
    ig.Input.inject({
        init() {
            this.instanceId = inst.instanceId
        },
        mousemove(event) {
            if (this.instanceId == inst.instanceId) {
                this.parent(event)
            }
        },
    })
}
