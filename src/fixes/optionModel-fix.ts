export function optionModelFix() {
    function defineModEnabledProperties(optionModel: sc.OptionModel) {
        // @ts-ignore
        const mods = window.inactiveMods.concat(window.activeMods)
        /* simplify decided that it's ok using a completely separate loading stage
         * (the 'modsLoaded' event that's directly after the main loading stage)
         * and defining sc.options.values for mod active status then,
         * so instead of just copying the properties I need to initialize the properties myself */
        for (const mod of mods) {
            const key = `modEnabled-${mod.name}`
            Object.defineProperty(optionModel.values, key, {
                configurable: true,
                get: () => localStorage.getItem(key) !== 'false',
                set: value => {
                    localStorage.setItem(key, Boolean(value).toString())
                },
            })
        }
    }

    sc.OptionModel.inject({
        init() {
            this.parent()
            defineModEnabledProperties(this)
        },
    })
}
