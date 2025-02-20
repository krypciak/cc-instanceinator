declare global {
    namespace ig {
        interface Input {
            isMouseOutOfInputDom: boolean
        }
    }
}
export function injectFocus() {
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
            this.parent(event)
        },
    })
}
