export {}
declare global {
    namespace ig {
        var classIdToClass: Record<number, ig.ClassConstructor>

        interface Class {
            _instanceId: number
        }
    }
}
/* inject into console.error in order to modify ig.Class.extend right after it's initialized
 * (window.console.error is accessed a few lines after ig.Class.extend is initialized) */
const orig = window.console.error
Object.defineProperty(window.console, 'error', {
    get() {
        if (window.ig) {
            ig.classIdToClass = {}
            const origExtend = window.ig.Class.extend
            ig.Class.extend = function (a) {
                const ret = origExtend.call(this, a) as ig.ClassConstructor
                ig.classIdToClass[ret.classId] = ret

                const orig = ret.prototype.init
                ret.prototype.init = function (...args) {
                    this._instanceId = instanceinator.id
                    if (orig) orig.call(this, ...args)
                }

                // const origInject = ret.inject
                // ret.inject = function (a) {
                //     origInject.call(this, a)
                //
                //     let obj: any = {}
                //     Error.captureStackTrace(obj, ret.inject)
                //     let stack: string = obj.stack
                //     stack = stack.substring('Error'.length).trimStart().substring('at'.length).trimStart()
                //     let lastIndex = stack.indexOf('\n')
                //     stack = stack.substring(0, lastIndex == -1 ? stack.length : lastIndex)
                //
                //     if (!stack) stack = obj.stack
                //     console.log('inject', injectCount++, stack)
                // }

                return ret as any
            }

            Object.defineProperty(window.console, 'error', { value: orig })
        }
        return orig
    },
})
