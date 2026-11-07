import type { Options } from 'ccmodmanager/types/mod-options'
import { modMetadata } from './mod-metadata'

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
                    displayMapName: {
                        type: 'CHECKBOX',
                        init: false,
                        name: 'Display map name',
                        description: 'Display instance current map name (ig.game.mapName)',
                        changeEvent() {
                            instanceinator.displayMapName = Opts.displayMapName
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
            modId: modMetadata.manifest.id,
            title: modMetadata.manifest.title,
        },
        opts
    )
    instanceinator.displayId = Opts.displayId
    instanceinator.displayMapName = Opts.displayMapName
    instanceinator.displayFps = Opts.displayFps
    return opts
}
