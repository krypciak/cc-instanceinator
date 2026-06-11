import { runTasks } from './inst-util'
import { InstanceinatorInstance } from './instance'

export function retile() {
    let displayInsts: InstanceinatorInstance[] = []
    const nonDisplayInsts: InstanceinatorInstance[] = []
    for (const inst of Object.values(instanceinator.instances)) {
        if (!inst.ig.system?.inputDom) continue

        if (inst.display && inst.ig?.system) displayInsts.push(inst)
        else nonDisplayInsts.push(inst)
    }

    for (const inst of nonDisplayInsts) {
        const div = inst.ig.system.inputDom
        div.style.display = 'none'
    }
    if (displayInsts.length == 0) return
    // if (displayInsts.length <= 1) {
    //     if (displayInsts.length == 1) {
    //         const inst = displayInsts[0]
    //         const div = inst.ig.system.inputDom
    //         div.style.position = 'static'
    //         callSetDisplaySize()
    //     }
    //     return
    // }

    function callSetDisplaySize() {
        runTasks(displayInsts, () => {
            if (!sc.options) return
            sc.options._setDisplaySize()
        })
    }

    displayInsts = displayInsts.sort((a, b) => {
        if (a.tilingOrder == b.tilingOrder) return a.id - b.id
        return (a.tilingOrder ?? 0) - (b.tilingOrder ?? 0)
    })

    const ws = document.documentElement.clientWidth
    const hs = document.documentElement.clientHeight
    function fitRectangles() {
        let bestWi = 0
        let bestGrid = { width: 0, height: 0 }

        const aspectRatioRev = 320 / 568
        for (let nx = 1; nx <= Math.ceil(displayInsts.length); nx++) {
            const ny = Math.ceil(displayInsts.length / nx)
            const wi = Math.min(ws / nx, hs / ny / aspectRatioRev)

            if (wi > bestWi) {
                bestWi = wi
                bestGrid = { width: nx, height: ny }
            }
        }

        return {
            grid: bestGrid,
            width: Math.floor(bestWi),
            height: Math.floor(aspectRatioRev * bestWi),
        }
    }

    const { grid, width, height } = fitRectangles()
    const offsetX = (ws - grid.width * width) / 2
    const offsetY = (hs - grid.height * height) / 2

    function setDivPositions() {
        let itemI = 0
        for (let column = 0; column < grid.height; column++) {
            for (let row = 0; row < grid.width; row++) {
                if (itemI >= displayInsts.length) return
                const inst = displayInsts[itemI++]
                const div = inst.ig.system.inputDom

                div.style.position = 'absolute'
                div.style.left = `${row * width + offsetX}px`
                div.style.top = `${column * height + offsetY}px`
                div.style.width = `${width}px`
                div.style.height = `${height}px`

                inst.ig.system.screenWidth = width
                inst.ig.system.screenHeight = height
            }
        }
    }
    setDivPositions()

    callSetDisplaySize()
}

export function injectTiling() {
    ig.System.inject({
        setCanvasSize(width, height, hideBorder) {
            if (Object.values(instanceinator.instances).length <= 1) return this.parent(width, height, hideBorder)
            this.canvas.style.width = '100%'
            this.canvas.style.height = '100%'
            this.canvas.className = 'borderHidden'
        },
    })
    $(window).on('resize', () => {
        retile()
    })
}
