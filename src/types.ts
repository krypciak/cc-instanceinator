import 'ultimate-crosscode-typedefs'
import type { Mod } from 'ultimate-crosscode-typedefs/modloader/mod'
import type {} from 'cc-map-screenshot/src/plugin'
import type {} from 'crossnode/crossnode.d.ts'

export type Mod1 = Mod & {
    findAllAssets?(): void /* only there for ccl2, used to set isCCL3 */
} & (
        | {
              isCCL3: true
              id: string
              findAllAssets(): void
          }
        | {
              isCCL3: false
              name: string
              filemanager: {
                  findFiles(dir: string, exts: string[]): Promise<string[]>
              }
              getAsset(path: string): string
              runtimeAssets: Record<string, string>
          }
    )
