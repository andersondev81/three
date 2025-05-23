// ✅ SUBSTITUIR ARQUIVO EXISTENTE: components/AudioBridge.jsx
import { useEffect, useRef } from "react"
import { useAudioStore } from "../../stores/audioStore"

export function AudioBridge() {
  const audioStore = useAudioStore()
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // Inicializar o sistema de áudio
    audioStore.initialize()

    // Forçar registro dos sons que os componentes precisam
    const criticalSounds = ["scroll", "mirror", "atm", "coins", "paper"]
    criticalSounds.forEach(soundId => {
      if (!audioStore.sounds[soundId]) {
        // Tentar registrar mesmo que não esteja na config principal
        const paths = {
          scroll: "/sounds/roadmapscroll.mp3",
          mirror: "/sounds/daingcoachmirror.MP3",
          atm: "/sounds/atmambiance.mp3",
          coins: "/sounds/coins.mp3",
          paper: "/sounds/paper.mp3",
        }

        if (paths[soundId]) {
          audioStore.registerSound(soundId, paths[soundId], {
            loop: soundId !== "coins" && soundId !== "paper",
            volume: 0.3,
          })
        }
      }
    })

    // Criar ponte global com compatibilidade TOTAL
    window.audioManager = {
      // Propriedades para compatibilidade
      get sounds() {
        const currentSounds = useAudioStore.getState().sounds
        const compatibleSounds = {}

        // Transformar para estrutura compatível
        Object.entries(currentSounds).forEach(([soundId, sound]) => {
          compatibleSounds[soundId] = {
            // Propriedades originais
            audio: sound.audio,
            isPlaying: sound.isPlaying,
            path: sound.path,
            volume: sound.volume,
            loop: sound.loop,

            // ✅ MÉTODOS que os componentes esperam
            stop: () => audioStore.stopSound(soundId),
            pause: () => audioStore.pauseSound(soundId),
            play: options => audioStore.playSound(soundId, options),
          }
        })

        return compatibleSounds
      },

      // Métodos principais
      play: (soundId, options) => audioStore.playSound(soundId, options),
      stop: soundId => audioStore.stopSound(soundId),
      pause: soundId => audioStore.pauseSound(soundId),

      // Controles de volume
      setVolume: volume => audioStore.setVolume(volume),
      setMuted: muted => audioStore.setMuted(muted),
      toggleMute: () => audioStore.toggleMute(),

      // Ambiente
      startAmbient: () => audioStore.startAmbient(),
      stopAmbient: () => audioStore.stopAmbient(),

      // Gerenciamento em lote
      stopAll: () => audioStore.stopAllSounds(),
      pauseAll: () => audioStore.pauseAllSounds(),

      // Seções e transições
      activateSection: section => audioStore.activateSection(section),
      stopSectionSounds: section => audioStore.stopSectionSounds(section),
      playTransition: (from, to) => audioStore.playTransition(from, to),

      // Áudio espacial
      updateSpatialAudio: position => audioStore.updateSpatialAudio(position),

      // Utilitários
      preloadAll: () => audioStore.preloadAll(),
      setUserInteracted: () => audioStore.setUserInteracted(),

      // Getters
      get isMuted() {
        return useAudioStore.getState().muted
      },
      get volume() {
        return useAudioStore.getState().volume
      },
      get canPlay() {
        return audioStore.canPlay()
      },
      get isExperienceStarted() {
        return audioStore.isExperienceStarted()
      },

      // Métodos de compatibilidade (aliases simples)
      startSound: (id, options) => audioStore.playSound(id, options),
      stopSound: id => audioStore.stopSound(id),
      pauseSound: id => audioStore.pauseSound(id),
      transitionBetweenSections: (from, to) =>
        audioStore.playTransition(from, to),
      playTransitionSound: section => {
        audioStore.playSound("transition")
        setTimeout(() => audioStore.activateSection(section), 300)
      },

      // ✅ COMPATIBILIDADE EXTRA para métodos diretos
      playSound: (soundId, options) => audioStore.playSound(soundId, options),
      resumeSound: soundId => audioStore.playSound(soundId),

      // Métodos vazios para compatibilidade (funcionalidades removidas/consolidadas)
      fadeOut: () => {},
      crossFade: () => {},
      setElementPosition: () => {},
      updateElementSound: () => {},
      pauseCategory: () => {},
      pauseAllExcept: () => {},
    }

    // Configurar watchers do sistema global
    setupGlobalWatchers(audioStore)

    // Cleanup
    return () => {
      audioStore.cleanup()
      delete window.audioManager
      initializedRef.current = false
    }
  }, [])

  return null
}

function setupGlobalWatchers(audioStore) {
  // Watcher para isExperienceStarted
  let _isExperienceStarted = false

  if (!window.hasOwnProperty("isExperienceStarted")) {
    window.isExperienceStarted = false
  }

  const originalDescriptor = Object.getOwnPropertyDescriptor(
    window,
    "isExperienceStarted"
  )

  if (!originalDescriptor || originalDescriptor.configurable) {
    Object.defineProperty(window, "isExperienceStarted", {
      configurable: true,
      enumerable: true,
      get: () => _isExperienceStarted,
      set: value => {
        const wasStarted = _isExperienceStarted
        _isExperienceStarted = value

        if (value === true && !wasStarted) {
          // ✅ PONTO ÚNICO DE INICIALIZAÇÃO DO ÁUDIO
          console.log(
            "[AudioSystem] Experience started - initializing audio..."
          )

          // Marcar interação do usuário
          audioStore.setUserInteracted()

          // Iniciar ambiente após delay apropriado
          setTimeout(() => {
            if (window.isExperienceStarted && !audioStore.muted) {
              console.log("[AudioSystem] Starting ambient audio...")
              audioStore.startAmbient()
            }
          }, 500) // ✅ Delay único de 500ms
        }
      },
    })
  }

  // Watcher para visibilidade da página
  const handleVisibilityChange = () => {
    if (document.hidden) {
      audioStore.pauseAllSounds()
    } else if (audioStore.canPlay()) {
      setTimeout(() => {
        if (!audioStore.muted) {
          audioStore.startAmbient()
        }
      }, 100)
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange)

  // Watcher para navegação global
  if (window.globalNavigation) {
    const originalNavigateTo = window.globalNavigation.navigateTo

    window.globalNavigation.navigateTo = sectionName => {
      audioStore.playTransition(null, sectionName)

      if (originalNavigateTo) {
        originalNavigateTo(sectionName)
      }
    }
  }

  // Event listener para comando de retorno
  const handleReturnCommand = () => {
    audioStore.stopAllSpatialSounds()
  }

  document.addEventListener("returnToCastle", handleReturnCommand)

  // Função de limpeza
  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    document.removeEventListener("returnToCastle", handleReturnCommand)
  }
}
