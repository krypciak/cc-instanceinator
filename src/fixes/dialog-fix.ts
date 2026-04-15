import { runTask } from '../inst-util'
import { microWrap } from './micro-wrap'

export function dialogFix() {
    const originalShowChoiceDialog = sc.Dialogs.showChoiceDialog
    sc.Dialogs.showChoiceDialog = (text, icon, options, callback, disableSubmitSound) => {
        const id = instanceinator.id
        return originalShowChoiceDialog(
            text,
            icon,
            options,
            function (...args) {
                const inst = instanceinator.instances[id]
                return runTask(inst, () => microWrap(() => callback(...args), 2, inst))
            },
            disableSubmitSound
        )
    }
}
