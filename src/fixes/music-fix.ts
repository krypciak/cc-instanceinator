import { runTask, runTasks } from '../inst-util'
import { InstanceinatorInstance } from '../instance'
import { ValueLock } from './value-lock'

function shouldMuteMusic(inst: InstanceinatorInstance | undefined) {
    return !inst?.ig?.music || instanceinator.musicInstanceId != inst.id
}

function updateTrackVolume(clazz: ig.Class, track: ig.Track | undefined | null) {
    if (!track) return
    const inst = instanceinator.instances[clazz._instanceId]
    const shouldMute = shouldMuteMusic(inst)
    track.volumeLock.updateLock(shouldMute)
}

export function updateMusicInstanceId() {
    const id = instanceinator.musicInstanceId
    if (!instanceinator.instances[id]) console.warn(`setMusicInstanceId: instance with id: ${id} doesn't exist!`)
    runTasks(Object.values(instanceinator.instances), () => {
        for (const track of ig.music?.trackStack ?? []) updateTrackVolume(ig.music, track.track)
    })
}

declare global {
    namespace ig {
        interface TrackWebAudio {
            volumeLock: ValueLock<number>
        }
    }
}

export function musicFixPostload() {
    ig.TrackWebAudio.inject({
        init(...args) {
            this.volumeLock = new ValueLock(
                0,
                () => Math.sqrt(this._volume / this.baseVolume),
                vol => this.setVolume(vol)
            )
            this.parent(...args)
        },
        setVolume(volume) {
            if (this.volumeLock?.isLocked()) this.volumeLock.setBackup(volume)
            else return this.parent(volume)
        },
    })
}

export function musicFixPrestart() {
    ig.Music.inject({
        _intervalStep() {
            const inst = instanceinator.instances[this._instanceId]
            if (!inst) {
                clearInterval(this._interval)
                return
            }
            if (shouldMuteMusic(inst)) return
            return runTask(inst, () => this.parent())
        },
    })

    ig.BgmTrack.inject({
        copy() {
            const newCopy = this.parent()
            if (newCopy.track) {
                newCopy.track.volumeLock = this.track?.volumeLock.copy()
            }
            return newCopy
        },
    })
    ig.Music.inject({
        inbetween(track, volume, fadeIn, volumeMultiplier) {
            this.parent(track, volume, fadeIn, volumeMultiplier)
            updateTrackVolume(this, track)
        },
        _checkCurrentTrackEquality() {
            updateTrackVolume(this, this.currentTrack?.track)
            return this.parent()
        },
        _playTopSong() {
            this.parent()
            updateTrackVolume(this, this.currentTrack?.track)
        },
        onWindowFocusGained() {
            this.parent()
            updateTrackVolume(this, this.inBetweenTrack?.track)
            updateTrackVolume(this, this.currentTrack?.track)
        },
    })

    ig.EVENT_STEP.PLAY_BGM.inject({
        start(data, eventCall) {
            this.track = this.track.copy()
            return this.parent(data, eventCall)
        },
    })
    ig.EVENT_STEP.PUSH_BGM.inject({
        start(data, eventCall) {
            this.track = this.track.copy()
            return this.parent(data, eventCall)
        },
    })
    ig.EVENT_STEP.PLAY_IN_BETWEEN_BGM.inject({
        start(data, eventCall) {
            this.track = this.track.copy()
            return this.parent(data, eventCall)
        },
    })
    ig.EVENT_STEP.SHOW_GET_MSG.inject({
        start(data, eventCall) {
            this.track = this.track.copy()
            return this.parent(data, eventCall)
        },
    })
    ig.Music.inject({
        _pushNextTrack(track, stopOnEnd, mode) {
            if (track && track._instanceId != this._instanceId)
                console.warn(
                    `cc-instanceinator: ig.Music#_pushNextTrack`,
                    `track._instanceId (${track._instanceId}) != this._instanceId (${this._instanceId}), music might malfunction!`
                )
            return this.parent(track, stopOnEnd, mode)
        },
    })
}
