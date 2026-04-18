export function storageFix() {
    ig.Storage.inject({
        /* the only change is to capture and save globals to ig.storage.globalData */
        _saveToStorage() {
            let globals: ig.Storage.GlobalsData = {} as any
            for (const listener of this.listeners) {
                // @ts-expect-error
                listener.onStorageGlobalSave?.(globals)
            }

            this.globalData = globals

            let slots: string[] = this.slots.map(slot => slot.getSrc())
            const data: ig.StorageData.SaveFileData = {
                slots,
                autoSlot: this.autoSlot && this.autoSlot.getSrc(),
                globals: this._encrypt(JSON.stringify(globals)),
                lastSlot: this.lastUsedSlot,
            }
            this.data.save(JSON.stringify(data))
            return data
        },
    })
}
