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

export class ValueAverageOverTime {
    private values: number[] = []
    private avg: number = 0

    constructor(public valueInterval: number) {}

    pushValue(v: number) {
        this.avg += v / this.valueInterval
        if (this.values.length >= this.valueInterval) {
            this.avg -= this.values[0] / this.valueInterval
            this.values.splice(0, 1)
        }
        this.values.push(v)
    }

    getAverage(): number {
        if (this.values.length == this.valueInterval) return this.avg
        return this.avg * (this.valueInterval / this.values.length)
    }
}

export class FpsLabelDrawClass implements LabelDrawClass {
    private avg = new ValueAverageOverTime(60)
    private lastDrawTime: number = 0

    draw(y: number) {
        if (!instanceinator.displayFps) return y
        const time = Date.now()

        let timeDiff = time - this.lastDrawTime
        if (this.lastDrawTime == 0) timeDiff = 0
        this.avg.pushValue(timeDiff)
        const fps = 1000 / this.avg.getAverage()

        const text = new ig.TextBlock(sc.fontsystem.font, `${fps.round(0)} fps`, {})

        text.draw(ig.system.width - text.size.x - 5, y)
        y += text.size.y
        this.lastDrawTime = time
        return y
    }
}
