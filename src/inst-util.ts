import type { InstanceinatorInstance } from './instance'

function scheduleTaskTo<T>(arr: typeof ig.game.scheduledTasks, task: () => Promise<T> | T) {
    return new Promise<T>((resolve, reject) => {
        arr.push(() => {
            try {
                const result = task()
                if (result instanceof Promise) {
                    result.then(resolve, reject)
                } else {
                    resolve(result)
                }
            } catch (e) {
                reject(e)
                throw e
            }
        })
    })
}

export function scheduleTask<T>(inst: InstanceinatorInstance, task: () => Promise<T> | T): Promise<T> {
    return scheduleTaskTo(inst.ig.game.scheduledTasks, task)
}

export function schedulePostTask<T>(inst: InstanceinatorInstance, task: () => Promise<T> | T): Promise<T> {
    return scheduleTaskTo(inst.ig.game.postScheduledTasks, task)
}

export function scheduleNextTask<T>(inst: InstanceinatorInstance, task: () => Promise<T> | T): Promise<T> {
    return scheduleTaskTo(inst.ig.game.nextScheduledTasks, task)
}

export function wrap<T>(func: () => T): T {
    const prevId = instanceinator.id
    const ret = func()
    instanceinator.instances[prevId].apply()
    return ret
}

export function runTask<T>(inst: InstanceinatorInstance, task: () => T): T {
    if (instanceinator.id == inst.id) {
        return task()
    } else {
        return wrap(() => {
            inst.apply()
            return task()
        })
    }
}

export function runTasks<T>(insts: InstanceinatorInstance[], task: (i: number) => T): T[] {
    return wrap(() => {
        return insts.map((inst, i) => {
            inst.apply()
            return task(i)
        })
    })
}

export function wait(inst: InstanceinatorInstance, seconds: number): Promise<void> {
    const start = Date.now()
    const milis = seconds * 1000
    return new Promise<void>(resolve => {
        function loop() {
            scheduleNextTask(inst, () => {
                if (Date.now() - start >= milis) resolve()
                else loop()
            })
        }
        loop()
    })
}

export function filterInstanceObjectsFromArray<T extends object>(classes: T[], instanceIdToRemove: number): T[] {
    return classes.filter(c => !('_instanceId' in c) || c._instanceId != instanceIdToRemove)
}
