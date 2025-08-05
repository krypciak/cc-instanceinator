import { runTask } from './inst-util'

declare global {
    namespace ig {
        interface Input {
            isMouseOutOfInputDom: boolean
        }
    }
}
export function injectFocus() {
    const replace = function (this: any, ...args: any) {
        const inst = instanceinator.instances[this._instanceId]
        if (inst?.display) {
            runTask(inst, () => {
                this.parent(...args)
            })
        }
    }
    ig.Input.inject({
        initMouse() {
            this.parent()

            this.isMouseOutOfInputDom = true
            ig.system.inputDom.addEventListener('mouseenter', () => {
                for (const inst of Object.values(instanceinator.instances)) {
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
        keyup: replace,
    })
}
