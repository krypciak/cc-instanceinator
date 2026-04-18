import type { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import ccmod from '../ccmod.json'
import type {} from 'crossnode/crossnode.d.ts'
import type { Mod1 } from './types'
import { Instanceinator } from './instanceinator'
import { injectInstance, InstanceinatorInstance } from './instance'
import { injectTiling } from './tiler'
import { injectFocus } from './focus'
import { registerOpts } from './options'
import { initClasses } from './custom-classes'
import { injectTitleScreenHide } from './title-screen-hide'
import { injectPerformance } from './performance'

import './class-id-to-class'

export let poststartReached = false

export default class CCInstanceinator implements PluginClass {
    static dir: string
    static mod: Mod1
    static manifset: typeof import('../ccmod.json') = ccmod

    constructor(mod: Mod1) {
        CCInstanceinator.dir = mod.baseDirectory
        CCInstanceinator.mod = mod
        CCInstanceinator.mod.isCCL3 = mod.findAllAssets ? true : false
        CCInstanceinator.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')
        if (!CCInstanceinator.mod.isCCL3) Object.assign(mod, { id: CCInstanceinator.mod.name })

        global.instanceinator = window.instanceinator = new Instanceinator()
    }

    async prestart() {
        registerOpts()
        initClasses()
        injectInstance()
        injectTiling()
        injectFocus()
        injectTitleScreenHide()
        injectPerformance()

        if (window.crossnode?.options.test) {
            import('./tests')
        }

        const baseInst = new InstanceinatorInstance(
            { ig, sc, modmanager: window.modmanager, nax: window.nax },
            { name: 'base' }
        )
        instanceinator.append(baseInst)
    }

    poststart() {
        poststartReached = true
    }
}
