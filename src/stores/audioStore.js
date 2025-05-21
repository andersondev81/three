import { create } from "zustand"

export const useAudioStore = create((set, get) => ({
  // state
  ambientPlaying: false,
  muted: false,
  sounds: {},

  // Configurações de som padrão
  soundConfig: {
    ambient: {
      path: "/sounds/templeambiance.mp3",
      loop: true,
      volume: 0.3,
    },
    interactions: {
      transition: { path: "/sounds/camerawoosh.MP3", volume: 0.4 },
      mirror: { path: "/sounds/daingcoachmirror.MP3", volume: 0.3 },
      orb: { path: "/sounds/orb.mp3", volume: 0.2 },
      fountain: { path: "/sounds/fountain.mp3", volume: 0.2 },
      pole: { path: "/sounds/templeambiance.mp3", volume: 0.2 },
      coins: { path: "/sounds/coins.mp3", volume: 0.3 },
      scroll: { path: "/sounds/roadmapscroll.mp3", volume: 0.3 },
      paper: { path: "/sounds/paper.mp3", volume: 0.3 },
      atm: { path: "/sounds/atmambiance.mp3", volume: 0.3 },
    },
    sections: {
      about: { path: "/sounds/orb.mp3", volume: 0.2 },
      aidatingcoach: { path: "/sounds/daingcoachmirror.MP3", volume: 0.3 },
      token: {
        paths: ["/sounds/atmambiance.mp3", "/sounds/coins.mp3"],
        volume: 0.3,
      },
      roadmap: {
        paths: ["/sounds/roadmapscroll.mp3", "/sounds/paper.mp3"],
        volume: 0.3,
      },
    },
  },

  // Métodos de gerenciamento de som
  registerSound: (soundId, audioElement) =>
    set(state => ({
      sounds: {
        ...state.sounds,
        [soundId]: {
          audio: audioElement,
          isPlaying: false,
          path: audioElement.src,
        },
      },
    })),

  playSound: (soundId, options = {}) => {
    const state = get()
    if (state.muted) return null

    // Verificar som na store ou buscar na configuração
    let sound = state.sounds[soundId]
    const soundConfig =
      state.soundConfig.interactions[soundId] ||
      state.soundConfig.sections[soundId]

    // Se som não existir na store, tentar criar
    if (!sound && soundConfig) {
      const paths = Array.isArray(soundConfig.paths)
        ? soundConfig.paths
        : [soundConfig.path]

      // Criar elemento de áudio
      const audioElement = new Audio(paths[0])
      sound = { audio: audioElement, isPlaying: false }
    }

    if (!sound) return null

    try {
      // Configurar volume
      const baseVolume = soundConfig?.volume || 0.5
      sound.audio.volume =
        options.volume !== undefined ? options.volume : baseVolume

      // Configurar loop
      sound.audio.loop = options.loop || soundConfig?.loop || false

      // Reproduzir
      sound.audio.play()

      // Atualizar estado
      set(state => ({
        sounds: {
          ...state.sounds,
          [soundId]: {
            ...sound,
            isPlaying: true,
          },
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

    const ambientConfig = state.soundConfig.ambient
    if (ambientConfig) {
      const audio = new Audio(ambientConfig.path)
      audio.loop = ambientConfig.loop
      audio.volume = ambientConfig.volume

      state.registerSound("ambient", audio)
      state.playSound("ambient")
    }

    set({ ambientPlaying: true })
  },

  stopAmbient: () => {
    const state = get()
    if (state.sounds.ambient) {
      state.stopSound("ambient")
    }
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

  // Gerenciar sons de seção
  stopSectionSounds: section => {
    const sectionConfig = get().soundConfig.sections[section]
    if (sectionConfig && sectionConfig.paths) {
      sectionConfig.paths.forEach(path => {
        const soundId = Object.keys(get().sounds).find(
          id => get().sounds[id].path === path
        )
        if (soundId) {
          get().stopSound(soundId)
        }
      })
    }
  },
}))
