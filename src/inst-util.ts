import type { InstanceinatorInstance } from './instance'

export function scheduleTask<T>(inst: InstanceinatorInstance, task: () => Promise<T> | T): Promise<T> {
    return new Promise<T>(resolve => {
        inst.ig.game.scheduledTasks.push(async () => {
            resolve(await task())
        })
    })
}

export function schedulePostTask<T>(inst: InstanceinatorInstance, task: () => Promise<T> | T): Promise<T> {
    return new Promise<T>(resolve => {
        inst.ig.game.postScheduledTasks.push(async () => {
            resolve(await task())
        })
    })
}

export function scheduleNextTask<T>(inst: InstanceinatorInstance, task: () => Promise<T> | T): Promise<T> {
    return new Promise<T>(resolve => {
        inst.ig.game.nextScheduledTasks.push(async () => {
            resolve(await task())
        })
    })
}

export function scheduleTasks<T>(insts: InstanceinatorInstance[], task: (i: number) => T): Promise<T[]> {
    return wrap(() => {
        return Promise.all(insts.map((inst, i) => scheduleTask(inst, () => task(i))))
    })
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
