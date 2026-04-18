import { runTasks } from '../inst-util'
import { InstanceinatorInstance } from '../instance'

function shouldMuteMusic(inst: InstanceinatorInstance) {
    return instanceinator.musicInstanceId != inst.id
}

function updateMusicTrackVolume(music: ig.Music, trackRaw: ig.Track | undefined | null) {
    if (!trackRaw) return
    const track = trackRaw as ig.TrackWebAudio
    const inst = instanceinator.instances[music._instanceId]
    const shouldMute = !inst || shouldMuteMusic(inst)
    // console.log('updateMusicTrackVolume', 'ig.music:', music._instanceId, 'instanceinator.id:', instanceinator.id, 'isLocked:', track.isVolumeLocked(), 'shouldMute:', shouldMute)
    if (shouldMute) {
        if (!track.isVolumeLocked()) {
            track.lockVolume(0)
        }
    } else if (track.isVolumeLocked()) {
        track.unlockVolume()
    }
}

export function updateMusicInstanceId() {
    const id = instanceinator.musicInstanceId
    if (!instanceinator.instances[id]) console.warn(`setMusicInstanceId: instance with id: ${id} doesn't exist!`)
    runTasks(Object.values(instanceinator.instances), () => {
        for (const track of ig.music.trackStack) updateLockableVolume(ig.music, track.track, shouldMuteMusic)
    })
}

declare global {
    namespace ig {
        interface TrackWebAudio {
            volumeBackup?: number

            isVolumeLocked(this: this): boolean
            lockVolume(this: this, newVolume?: number): void
            unlockVolume(this: this): void
        }
    }
}

export function musicFix() {
    ig.TrackWebAudio.inject({
        isVolumeLocked() {
            return this.volumeBackup !== undefined
        },
        setVolume(volume) {
            if (this.isVolumeLocked()) this.volumeBackup = volume
            else return this.parent(volume)
        },
        lockVolume(newVolume) {
            if (this.isVolumeLocked())
                throw new Error('called ig.TrackWebAudio#lockVolume when volume is already locked!')
            const oldVolume = Math.sqrt(this._volume / this.baseVolume)
            if (newVolume !== undefined) this.setVolume(newVolume)
            this.volumeBackup = oldVolume
        },
        unlockVolume() {
            const oldVolume = this.volumeBackup!
            if (!this.isVolumeLocked())
                throw new Error("called ig.TrackWebAudio#unlockVolume when volume wasn't locked!")
            this.volumeBackup = undefined
            this.setVolume(oldVolume)
        },
    })
    ig.BgmTrack.inject({
        copy() {
            const newCopy = this.parent()
            if (newCopy.track) {
                ;(newCopy.track as ig.TrackWebAudio).volumeBackup = (this.track as ig.TrackWebAudio)?.volumeBackup
            }
            return newCopy
        },
    })
    ig.Music.inject({
        inbetween(track, volume, fadeIn, volumeMultiplier) {
            this.parent(track, volume, fadeIn, volumeMultiplier)
            updateMusicTrackVolume(this, track)
        },
        _checkCurrentTrackEquality() {
            updateMusicTrackVolume(this, this.currentTrack?.track)
            return this.parent()
        },
        _playTopSong() {
            this.parent()
            updateMusicTrackVolume(this, this.currentTrack?.track)
        },
        onWindowFocusGained() {
            this.parent()
            updateMusicTrackVolume(this, this.inBetweenTrack?.track)
            updateMusicTrackVolume(this, this.currentTrack?.track)
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
