declare global {
    namespace ig {
        interface Input {
            isMouseOutOfInputDom: boolean
        }
    }
}
export function injectFocus() {
    const replace = function (this: any, ...args: any) {
        const inst = instanceinator.instances[this.instanceId]
        if (inst?.display) {
            inst.apply()
            this.parent(...args)
            instanceinator.Instance.revert()
        }
    }
    ig.Input.inject({
        init() {
            if (this.parent) this.parent()
            this.instanceId = instanceinator.instanceId
        },
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
        mousewheel: replace,
        keyup: replace,
    })
}
