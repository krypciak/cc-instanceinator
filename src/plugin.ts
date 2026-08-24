import type { PluginClass } from 'ultimate-crosscode-typedefs/modloader/mod'
import type { Mod1 } from './types'
import { Instanceinator } from './instanceinator'
import { injectInstance, InstanceinatorInstance } from './instance'
import { injectTiling } from './tiler'
import { injectFocus } from './focus'
import { registerOpts } from './options'
import { initClasses } from './custom-classes'
import { injectTitleScreenHide } from './title-screen-hide'
import { injectPerformance } from './performance'
import { injectFixesPrestart, injectFixesPostload } from './fixes/all'
import { setModMetadata } from './mod-metadata'

import './class-id-to-class'

export let poststartReached = false

export default class CCInstanceinator implements PluginClass {
    constructor(mod: Mod1) {
        setModMetadata(mod)

        global.instanceinator = window.instanceinator = new Instanceinator()
    }

    postload() {
        injectFixesPostload()
    }

    async prestart() {
        registerOpts()
        initClasses()
        injectInstance()
        injectTiling()
        injectFocus()
        injectTitleScreenHide()
        injectPerformance()
        injectFixesPrestart()

        new InstanceinatorInstance({ ig, sc, modmanager: window.modmanager, nax: window.nax }, { name: 'base' })
    }

    poststart() {
        poststartReached = true
    }
}
