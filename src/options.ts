import type { Options } from 'ccmodmanager/types/mod-options'
import CCInstanceinator from './plugin'

export let Opts: ReturnType<typeof modmanager.registerAndGetModOptions<ReturnType<typeof registerOpts>>>

export function registerOpts() {
    const opts = {
        general: {
            settings: {
                title: 'General',
                tabIcon: 'general',
            },
            headers: {
                general: {
                    displayId: {
                        type: 'CHECKBOX',
                        init: false,
                        name: 'Display id',
                        description: 'Display instance id',
                        changeEvent() {
                            instanceinator.displayId = Opts.displayId
                        },
                    },
                    displayFps: {
                        type: 'CHECKBOX',
                        init: false,
                        name: 'Display fps',
                        description: 'Display instance fps',
                        changeEvent() {
                            instanceinator.displayFps = Opts.displayFps
                        },
                    },
                },
            },
        },
    } as const satisfies Options

    Opts = modmanager.registerAndGetModOptions(
        {
            modId: CCInstanceinator.manifset.id,
            title: CCInstanceinator.manifset.title,
        },
        opts
    )
    instanceinator.displayFps = Opts.displayFps
    instanceinator.displayId = Opts.displayId
    return opts
}
