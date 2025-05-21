// features/navigation/AudioBridge.jsx
import { useEffect } from "react"
import { useAudioStore } from "../../stores/audioStore"

export function AudioBridge() {
  const {
    playSound,
    stopSound,
    startAmbient,
    stopAmbient,
    stopAllSounds,
    muted,
    sounds,
  } = useAudioStore()

  useEffect(() => {
    // Criar ponte com o sistema global de áudio
    window.audioManager = {
      play: (soundId, options = {}) => {
        return playSound(soundId, options)
      },
      stop: soundId => {
        stopSound(soundId)
      },
      startAmbient: () => {
        startAmbient()
      },
      stopAmbient: () => {
        stopAmbient()
      },
      stopAll: () => {
        stopAllSounds()
      },
      pauseAll: () => {
        // Implementar baseado na store
        console.warn("pauseAll not implemented")
      },
      resumeAll: () => {
        // Implementar baseado na store
        console.warn("resumeAll not implemented")
      },
      stopSectionSounds: section => {
        // Implementar baseado na store
        console.warn("stopSectionSounds not implemented")
      },
      setMuted: isMuted => {
        // Adicionar método para definir estado de mudo
        muted(isMuted)
      },
      sounds: sounds,
    }

    return () => {
      delete window.audioManager
    }
  }, [
    playSound,
    stopSound,
    startAmbient,
    stopAmbient,
    stopAllSounds,
    sounds,
    muted,
  ])

  return null
}
