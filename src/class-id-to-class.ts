export {}
declare global {
    namespace ig {
        var classIdToClass: Record<number, ig.ClassConstructor>
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
                return ret as any
            }

            Object.defineProperty(window.console, 'error', { value: orig })
        }
        return orig
    },
})
