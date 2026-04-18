import { audioFix } from './audio-fix'
import { cacheableFix } from './cacheable-fix'
import { cursorFix } from './cursor-fix'
import { dialogFix } from './dialog-fix'
import { imageAtlasFix } from './imageAtlas-fix'
import { modmanagerFix } from './modmanager-fix'
import { musicFixPrestart, musicFixPostload } from './music-fix'
import { nwjsFullscreenFix } from './nwjsFullscreen-fix'
import { optionModelFix } from './optionModel-fix'

export function injectFixesPostload() {
    musicFixPostload()
}

export function injectFixesPrestart() {
    cacheableFix()
    imageAtlasFix()
    modmanagerFix()
    cursorFix()
    dialogFix()
    audioFix()
    musicFixPrestart()
    optionModelFix()
    nwjsFullscreenFix()
}
