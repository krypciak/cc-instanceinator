import CCInstanceinator from './plugin'

const modId = CCInstanceinator.mod.id

ig.System.inject({
    run() {
        if (crossnode.currentTestId != test1.id) return this.parent()
        const instances = Object.values(inst.instances).sort((a, b) => a.id - b.id)

        if (test1.startSwapping) {
            let nextInst = instances[instances.findIndex(a => a.id == inst.instanceId) + 1]
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
        inst.Instance.resetInstanceIdCounter()
        inst.instances[0] = inst.Instance.currentReference('master')

        for (let i = 1; i < 2; i++) {
            const instance = await inst.Instance.copy(inst.instances[0], 'child')
            inst.append(instance)
            instance.apply()
        }
    },
    update(_frame) {
        this.finish(true)
    },
    cleanup() {
        inst.instances[0].apply()
        for (const instance of Object.values(inst.instances)) {
            inst.delete(instance)
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
        inst.Instance.resetInstanceIdCounter()
        inst.instances[0] = inst.Instance.currentReference('master')

        for (let i = 1; i < this.instanceCount; i++) {
            const instance = await inst.Instance.copy(inst.instances[0], 'child')
            inst.append(instance)
        }
        this.startSwapping = true
    },
    update(frame) {
        this.frameCountRecord[inst.instanceId] ??= 0
        this.frameCountRecord[inst.instanceId]++

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
    cleanup() {},
})
