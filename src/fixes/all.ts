import { audioFix } from './audio-fix'
import { cacheableFix } from './cacheable-fix'
import { cursorFix } from './cursor-fix'
import { dialogFix } from './dialog-fix'
import { imageAtlasFix } from './imageAtlas-fix'
import { modmanagerFix } from './modmanager-fix'
import { musicFix } from './music-fix'
import { nwjsFullscreenFix } from './nwjsFullscreen-fix'
import { optionModelFix } from './optionModel-fix'

export function injectFixes() {
    cacheableFix()
    imageAtlasFix()
    modmanagerFix()
    cursorFix()
    dialogFix()
    musicFix()
    audioFix()
    optionModelFix()
    nwjsFullscreenFix()
}
