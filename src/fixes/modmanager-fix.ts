import { runTask, } from '../inst-util'
import { microWrap } from './micro-wrap'

export function modmanagerFix() {
    function replace<T extends ig.Class, E extends unknown[], R>(
        this: T & { parent(this: T, ...args: E): R },
        ...args: E
    ): R {
        return runTask(instanceinator.instances[this._instanceId], () => this.parent(...args))
    }
    /* fix modmanager crashes */
    modmanager.gui.MenuList.inject({
        reloadEntries: replace,
    })
    modmanager.gui.Menu.inject({
        showModInstallDialog: replace,
    })
    modmanager.gui.ListEntry.inject({
        updateIcon: replace,
        tryEnableMod(mod) {
            return microWrap(() => this.parent(mod))
        },
    })
    modmanager.gui.MultiPageButtonBoxGui.inject({
        closeMenu: replace,
        refreshPage: replace,
    })
}
