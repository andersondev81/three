// ✅ SUBSTITUIR ARQUIVO EXISTENTE: stores/audioStore.js
import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import {
  calculateDistance,
  calculateAttenuation,
  AUDIO_CONFIG,
  AUDIO_POSITIONS,
  createThrottle,
  SECTION_AUDIO_CONFIG,
} from "../utils/audioUtils"

export const useAudioStore = create(
  subscribeWithSelector((set, get) => {
    const audioCache = new Map()
    const throttle = createThrottle(16)

    const createAudioElement = path => {
      if (audioCache.has(path)) {
        return audioCache.get(path).cloneNode()
      }

      if (!path) return null

      try {
        const audio = new Audio(path)
        audio.preload = "metadata"
        audioCache.set(path, audio)
        return audio
      } catch (error) {
        console.warn(`Failed to create audio element for ${path}:`, error)
        return null
      }
    }

    const safePlay = async (audio, soundId) => {
      try {
        if (!audio.paused) {
          audio.pause()
          audio.currentTime = 0
        }

        const playPromise = audio.play()
        if (playPromise !== undefined) {
          await playPromise
          return true
        }
        return false
      } catch (error) {
        console.warn(`Failed to play ${soundId}:`, error)
        return false
      }
    }

    const safePause = audio => {
      try {
        if (!audio.paused) {
          audio.pause()
        }
      } catch (error) {}
    }

    const updateSoundState = (soundId, updates) => {
      throttle(`update-${soundId}`, () => {
        set(state => {
          if (!state.sounds[soundId]) return state
          return {
            sounds: {
              ...state.sounds,
              [soundId]: {
                ...state.sounds[soundId],
                ...updates,
              },
            },
          }
        })
      })
    }

    return {
      // Estado básico
      sounds: {},
      muted: false,
      volume: 0.5,
      userInteracted: false,
      ambientPlaying: false,
      canAutoplay: false,
      spatialSoundsActive: new Set(),
      soundCooldowns: new Map(),

      // Inicialização
      initialize: async () => {
        const state = get()
        if (state.initialized) return

        // Registrar todos os sons da configuração automaticamente
        Object.entries(AUDIO_CONFIG).forEach(([soundId, config]) => {
          get().registerSound(soundId, config.path, {
            loop: config.loop,
            volume: config.volume,
          })
        })

        // Garantir que sons específicos dos componentes existam
        const requiredSounds = ["scroll", "mirror", "atm", "coins", "paper"]
        requiredSounds.forEach(soundId => {
          if (!get().sounds[soundId] && AUDIO_CONFIG[soundId]) {
            const config = AUDIO_CONFIG[soundId]
            get().registerSound(soundId, config.path, config)
          }
        })

        // Verificar autoplay
        get().checkAutoplay()

        set({ initialized: true })
      },

      checkAutoplay: () => {
        if (get().canAutoplay) return

        const audio = new Audio()
        audio.volume = 0
        const playPromise = audio.play()

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              set({ canAutoplay: true })
              audio.pause()
            })
            .catch(() => set({ canAutoplay: false }))
        }
      },

      setUserInteracted: () => {
        const state = get()
        if (state.userInteracted) return

        set({ userInteracted: true })
      },

      // Gerenciamento de sons
      registerSound: (soundId, path, options = {}) => {
        const state = get()
        if (state.sounds[soundId]) return

        const audio = createAudioElement(path)
        if (!audio) return

        const config = AUDIO_CONFIG[soundId] || {}
        audio.volume = options.volume ?? config.volume ?? state.volume
        audio.loop = options.loop ?? config.loop ?? false

        set(state => ({
          sounds: {
            ...state.sounds,
            [soundId]: {
              audio,
              isPlaying: false,
              path,
              volume: audio.volume,
              loop: audio.loop,
              config,
            },
          },
        }))
      },

      playSound: async (soundId, options = {}) => {
        // ✅ VERIFICAÇÃO PRINCIPAL: SÓ TOCAR SE EXPERIENCE COMEÇOU
        if (!window.isExperienceStarted) {
          return null
        }

        const state = get()
        if (state.muted || !state.userInteracted) {
          return null
        }

        // Verificar cooldown
        const cooldownEnd = state.soundCooldowns.get(soundId)
        if (cooldownEnd && Date.now() < cooldownEnd) {
          return null
        }

        let sound = state.sounds[soundId]

        // Auto-registrar se não existe
        if (!sound && AUDIO_CONFIG[soundId]) {
          const config = AUDIO_CONFIG[soundId]
          get().registerSound(soundId, config.path, config)
          sound = get().sounds[soundId]
        }

        if (!sound?.audio) {
          return null
        }

        // Verificar se já está tocando com volume similar
        if (sound.isPlaying && sound.audio && !sound.audio.paused) {
          const currentVolume = sound.audio.volume
          const targetVolume = options.volume ?? sound.volume

          if (Math.abs(currentVolume - targetVolume) < 0.1) {
            sound.audio.volume = targetVolume
            return sound.audio
          }
        }

        // Configurar volume e loop
        const config = sound.config || {}
        sound.audio.volume = options.volume ?? config.volume ?? sound.volume
        sound.audio.loop = options.loop ?? config.loop ?? sound.loop

        const success = await safePlay(sound.audio, soundId)
        if (success) {
          updateSoundState(soundId, { isPlaying: true })
          state.soundCooldowns.delete(soundId)
        }

        return success ? sound.audio : null
      },

      stopSound: soundId => {
        const sound = get().sounds[soundId]
        if (!sound?.audio) return

        try {
          safePause(sound.audio)
          sound.audio.currentTime = 0
          updateSoundState(soundId, { isPlaying: false })

          // Cooldown para evitar tocar novamente imediatamente
          const state = get()
          state.soundCooldowns.set(soundId, Date.now() + 500)
        } catch (error) {
          console.warn(`Failed to stop ${soundId}:`, error)
        }
      },

      pauseSound: soundId => {
        const sound = get().sounds[soundId]
        if (!sound?.audio || !sound.isPlaying) return

        safePause(sound.audio)
      },

      // Áudio ambiente
      startAmbient: async () => {
        const state = get()

        // Verificações rigorosas
        if (state.ambientPlaying) {
          console.log("[AudioStore] Ambient already playing, skipping...")
          return
        }

        if (state.muted) {
          console.log("[AudioStore] Audio muted, skipping ambient start")
          return
        }

        if (!state.userInteracted) {
          console.log(
            "[AudioStore] User has not interacted, skipping ambient start"
          )
          return
        }

        if (!window.isExperienceStarted) {
          console.log(
            "[AudioStore] Experience not started, skipping ambient start"
          )
          return
        }

        console.log("[AudioStore] Starting ambient audio...")
        const success = await get().playSound("ambient")
        if (success) {
          set({ ambientPlaying: true })
          console.log("[AudioStore] Ambient audio started successfully")
        } else {
          console.warn("[AudioStore] Failed to start ambient audio")
        }
      },

      stopAmbient: () => {
        get().stopSound("ambient")
        set({ ambientPlaying: false })
      },

      // Controles de volume
      setVolume: value => {
        const volume = Math.max(0, Math.min(1, value))
        const state = get()

        if (Math.abs(state.volume - volume) < 0.01) return

        set({ volume })

        // Atualizar volume de todos os sons
        Object.values(state.sounds).forEach(sound => {
          if (sound.audio && !state.muted) {
            sound.audio.volume = volume
          }
        })
      },

      setMuted: muted => {
        const state = get()
        if (state.muted === muted) return

        set({ muted })

        if (muted) {
          get().stopAllSounds()
        } else if (state.userInteracted) {
          setTimeout(() => {
            if (!get().muted) get().startAmbient()
          }, 100)
        }
      },

      toggleMute: () => {
        const newMuted = !get().muted
        get().setMuted(newMuted)
        return newMuted
      },

      // Áudio espacial consolidado
      updateSpatialAudio: cameraPosition => {
        // ✅ VERIFICAÇÃO PRINCIPAL: SÓ FUNCIONAR SE EXPERIENCE COMEÇOU
        if (!window.isExperienceStarted) {
          return
        }

        const state = get()
        if (!state.userInteracted || state.muted) {
          return
        }

        throttle(
          "spatial-update",
          () => {
            // Verificar novamente dentro do throttle
            if (!window.isExperienceStarted) {
              return
            }

            const currentState = get()
            const activeSounds = new Set()

            Object.entries(AUDIO_CONFIG).forEach(([soundId, config]) => {
              if (!config.position || !config.maxDistance) return

              const distance = calculateDistance(
                cameraPosition,
                config.position
              )
              const isCurrentlyActive =
                currentState.spatialSoundsActive.has(soundId)

              if (distance < config.maxDistance) {
                const attenuation = calculateAttenuation(
                  distance,
                  config.maxDistance
                )
                const targetVolume = config.volume * attenuation

                if (targetVolume > 0.05) {
                  activeSounds.add(soundId)

                  if (!isCurrentlyActive) {
                    get().playSound(soundId, { volume: targetVolume })
                  } else if (
                    currentState.sounds[soundId]?.audio &&
                    currentState.sounds[soundId].isPlaying
                  ) {
                    const currentVolume =
                      currentState.sounds[soundId].audio.volume
                    if (Math.abs(currentVolume - targetVolume) > 0.05) {
                      currentState.sounds[soundId].audio.volume = targetVolume
                    }
                  }
                } else if (isCurrentlyActive && targetVolume < 0.02) {
                  get().stopSound(soundId)
                }
              } else if (isCurrentlyActive) {
                get().stopSound(soundId)
              }
            })

            currentState.spatialSoundsActive.forEach(soundId => {
              if (!activeSounds.has(soundId)) {
                get().stopSound(soundId)
              }
            })

            set({ spatialSoundsActive: activeSounds })
          },
          100
        )
      },

      // Gerenciamento por seção
      activateSection: sectionName => {
        const soundIds = SECTION_AUDIO_CONFIG[sectionName] || []
        get().stopAllSpatialSounds()
      },

      stopSectionSounds: sectionName => {
        const soundIds = SECTION_AUDIO_CONFIG[sectionName] || []
        soundIds.forEach(soundId => {
          if (soundId !== "ambient") {
            get().stopSound(soundId)
          }
        })
      },

      stopAllSpatialSounds: () => {
        const state = get()
        state.spatialSoundsActive.forEach(soundId => {
          if (soundId !== "ambient") {
            get().stopSound(soundId)
          }
        })
        set({ spatialSoundsActive: new Set() })
      },

      stopAllSounds: () => {
        const state = get()
        Object.keys(state.sounds).forEach(soundId => {
          get().stopSound(soundId)
        })
        set({ ambientPlaying: false, spatialSoundsActive: new Set() })
      },

      pauseAllSounds: () => {
        const state = get()
        Object.keys(state.sounds).forEach(soundId => {
          get().pauseSound(soundId)
        })
      },

      // Transições
      playTransition: (fromSection, toSection) => {
        get().playSound("transition")

        if (fromSection) {
          get().stopSectionSounds(fromSection)
        }

        if (toSection) {
          setTimeout(() => {
            get().activateSection(toSection)
          }, 300)
        }
      },

      // Utilitários
      preloadAll: () => {
        const state = get()
        Object.values(state.sounds).forEach(sound => {
          if (sound.audio) {
            sound.audio.load()
          }
        })
      },

      cleanup: () => {
        get().stopAllSounds()
        set({
          sounds: {},
          initialized: false,
          spatialSoundsActive: new Set(),
          soundCooldowns: new Map(),
        })
      },

      // Getters de conveniência
      isPlaying: soundId => get().sounds[soundId]?.isPlaying || false,
      canPlay: () => get().userInteracted && !get().muted,
      isExperienceStarted: () => !!window.isExperienceStarted,
    }
  })
)
