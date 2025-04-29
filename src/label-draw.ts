export interface LabelDrawClass {
    draw(y: number): number
}

export class IdLabelDrawClass implements LabelDrawClass {
    draw(y: number) {
        if (!instanceinator.displayId) return y
        const text = new ig.TextBlock(
            sc.fontsystem.font,
            `#${instanceinator.id} ${instanceinator.instances[instanceinator.id].name}`,
            {}
        )
        text.draw(ig.system.width - text.size.x - 5, y)
        y += text.size.y
        return y
    }
}

export class FpsLabelDrawClass implements LabelDrawClass {
    private lastDrawTime: number = 0
    private frameAvgCount: number = 60
    private lastFramesAvg: number = 0
    private lastFrames: number[] = []

    draw(y: number) {
        if (!instanceinator.displayFps) return y
        const time = Date.now()
        const timeDiff = time - this.lastDrawTime
        this.lastFramesAvg += timeDiff / this.frameAvgCount
        if (this.lastFrames.length >= this.frameAvgCount) {
            this.lastFramesAvg -= this.lastFrames[0] / this.frameAvgCount
            this.lastFrames.splice(0, 1)
        }
        this.lastFrames.push(timeDiff)
        const fps = 1000 / this.lastFramesAvg

        const text = new ig.TextBlock(sc.fontsystem.font, `${fps.round(0)} fps`, {})

        text.draw(ig.system.width - text.size.x - 5, y)
        y += text.size.y
        this.lastDrawTime = time
        return y
    }
}
