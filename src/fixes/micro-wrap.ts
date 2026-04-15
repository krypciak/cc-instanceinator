import { InstanceinatorInstance } from '../instance'

const microStack: number[] = []
function microBegin(depth: number, inst: InstanceinatorInstance = instanceinator.instances[instanceinator.id]) {
    Promise.resolve().then(() => {
        microStack.push(instanceinator.id)
        inst.apply()

        if (depth > 0) microBegin(--depth, inst)
    })
}
function microEnd(depth: number) {
    Promise.resolve().then(() => {
        const inst = instanceinator.instances[microStack.pop()!]
        inst.apply()

        if (depth > 0) microEnd(--depth)
    })
}

export function microWrap<T>(func: () => T, depth: number = 1, inst?: InstanceinatorInstance) {
    microBegin(depth, inst)
    const ret = func()
    microEnd(depth)
    return ret
}
