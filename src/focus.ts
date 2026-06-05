import { runTask } from './inst-util'

declare global {
    namespace ig {
        interface Input {
            isMouseOutOfInputDom: boolean
        }
    }
}
export function injectFocus() {
    const replace = function <T, ARGS extends unknown[]>(
        this: ig.Input & { parent(this: ig.Input, ...args: ARGS): T },
        ...args: ARGS
    ): T | undefined {
        const inst = instanceinator.instances[this._instanceId]
        if (!inst?.display) return
        return runTask(inst, () => this.parent(...args))
    }

    ig.Input.inject({
        initMouse() {
            this.parent()

            this.isMouseOutOfInputDom = true
            ig.system.inputDom.addEventListener('mouseenter', () => {
                for (const inst of Object.values(instanceinator.instances)) {
                    if (!inst.ig?.input) return
                    inst.ig.input.isMouseOutOfInputDom = true
                }
                this.isMouseOutOfInputDom = false
            })
        },
        keydown(event) {
            if (event.type == 'keydown' && this.isMouseOutOfInputDom) return
            replace.call(this, event)
        },
        mousemove: replace,
        mousewheel(event) {
            if (this.isMouseOutOfInputDom) return
            replace.call(this, event)
        },
        keyup(event) {
            const key: ig.KEY =
                event.type == 'keyup'
                    ? ((event as KeyboardEvent).keyCode as ig.KEY)
                    : (event as MouseEvent).button == 2
                      ? ig.KEY.MOUSE2
                      : ig.KEY.MOUSE1
            const binding = this.bindings[key]
            if (binding && !this.actions[binding]) return
            replace.call(this, event)
        },
    })
}
