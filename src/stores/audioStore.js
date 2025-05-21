import create from "zustand"

export const useAudioStore = create((set, get) => ({
  // state
  ambientPlaying: false,
  muted: false,
  sounds: {},

  // action
  registerSound: (soundId, audioElement) =>
    set(state => ({
      sounds: {
        ...state.sounds,
        [soundId]: { audio: audioElement, isPlaying: false },
      },
    })),

  playSound: (soundId, options = {}) => {
    const state = get()
    if (state.muted) return null

    const sound = state.sounds[soundId]
    if (!sound) return null

    try {
      if (options.volume !== undefined) sound.audio.volume = options.volume
      if (options.loop !== undefined) sound.audio.loop = options.loop

      sound.audio.play()

      set(state => ({
        sounds: {
          ...state.sounds,
          [soundId]: { ...sound, isPlaying: true },
        },
      }))

      return sound.audio
    } catch (error) {
      console.error(`Error playing sound ${soundId}:`, error)
      return null
    }
  },

  stopSound: soundId => {
    const sound = get().sounds[soundId]
    if (!sound) return

    try {
      sound.audio.pause()
      sound.audio.currentTime = 0

      set(state => ({
        sounds: {
          ...state.sounds,
          [soundId]: { ...sound, isPlaying: false },
        },
      }))
    } catch (error) {
      console.error(`Error stopping sound ${soundId}:`, error)
    }
  },

  startAmbient: () => {
    const state = get()
    if (state.ambientPlaying || state.muted) return

    set({ ambientPlaying: true })
  },

  stopAmbient: () => {
    set({ ambientPlaying: false })
  },

  setMuted: muted => {
    set({ muted })
    if (muted) get().stopAllSounds()
  },

  stopAllSounds: () => {
    const { sounds } = get()
    Object.keys(sounds).forEach(soundId => {
      try {
        const sound = sounds[soundId]
        if (sound.isPlaying) {
          sound.audio.pause()
          sound.audio.currentTime = 0
        }
      } catch (error) {
        console.error(`Error stopping sound ${soundId}:`, error)
      }
    })

    // Update the state to reflect that all sounds are stopped
    set(state => ({
      sounds: Object.keys(state.sounds).reduce((acc, soundId) => {
        acc[soundId] = { ...state.sounds[soundId], isPlaying: false }
        return acc
      }, {}),
    }))
  },
}))
