import CCInstanceInator from './plugin'

const modId = CCInstanceInator.mod.id

ig.System.inject({
    run() {
        if (crossnode.currentTestId != test1.id) return this.parent()
        const instances = Object.values(instanceinator.instances).sort((a, b) => a.id - b.id)

        if (test1.startSwapping) {
            let nextInst = instances[instances.findIndex(a => a.id == instanceinator.id) + 1]
            if (!nextInst) nextInst = instances[0]

            nextInst.apply()
        }

        this.parent()
    },
})

crossnode.registerTest({
    name: 'initialize master + 1 children',
    modId,
    skipFrameWait: true,
    async setup() {
        instanceinator.resetInstanceIdCounter()
        for (let i = 1; i < 2; i++) {
            const instance = await instanceinator.copy(instanceinator.instances[0], { name: 'child' })
            instance.apply()
        }
    },
    update(_frame) {
        this.finish(true)
    },
    cleanup() {
        instanceinator.instances[0].apply()
        for (const instance of Object.values(instanceinator.instances)) {
            if (instance.id == 0) continue
            instanceinator.delete(instance)
        }
    },
})

const test1 = crossnode.registerTest<{
    frameCountRecord: Record<number, number>
    instanceCount: number
    startSwapping: boolean
}>({
    name: 'swap update master + 5 children',
    modId,
    skipFrameWait: true,

    frameCountRecord: {},
    instanceCount: 4,
    startSwapping: false,
    async setup() {
        instanceinator.resetInstanceIdCounter()
        for (let i = 1; i < this.instanceCount; i++) {
            await instanceinator.copy(instanceinator.instances[0], { name: 'child' })
        }
        this.startSwapping = true
    },
    update(frame) {
        this.frameCountRecord[instanceinator.id] ??= 0
        this.frameCountRecord[instanceinator.id]++

        const multi = 6
        if (frame + 1 >= this.instanceCount * multi) {
            for (let i = 0; i < this.instanceCount; i++) {
                if (this.frameCountRecord[i] != multi)
                    return this.finish(
                        false,
                        `Mismatch at instance ${i}. Full object: ${JSON.stringify(this.frameCountRecord)}`
                    )
            }

            this.finish(true)
        }
    },
    cleanup() {
        instanceinator.instances[0].apply()
        for (const instance of Object.values(instanceinator.instances)) {
            if (instance.id == 0) continue
            instanceinator.delete(instance)
        }
    },
})
