// features/navigation/NavigationBridge.jsx
import { useEffect } from "react"
import { useNavigationStore } from "../../stores/navigationStore"
import { useCameraStore } from "../../stores/cameraStore"

export function NavigationBridge() {
  const {
    currentSection,
    setCurrentSection,
    storePosition,
    clearPositions,
    clearPositionForElement,
    setNavigationSource,
    getNavigationSource,
    sectionIndices,
  } = useNavigationStore()

  const { moveCamera, getCameraPosition, getCameraTarget } = useCameraStore()

  useEffect(() => {
    // Criar ponte com o sistema global de navegação
    window.globalNavigation = {
      navigateTo: section => {
        setCurrentSection(section, sectionIndices[section] || 0)
      },
      lastSection: currentSection,
      sectionIndices: sectionIndices,
      reset: function () {
        if (window.resetIframes) {
          window.resetIframes()
        }
      },
      log: function (message) {
        console.log(`[Navigation] ${message}`)
      },
    }

    // Ponte para o sistema de navegação
    window.navigationSystem = {
      storePosition: (elementId, position, target) => {
        storePosition(elementId, position, target)
      },
      clearPositions: () => {
        clearPositions()
      },
      clearPositionForElement: elementId => {
        clearPositionForElement(elementId)
      },
      setNavigationSource: (elementId, source) => {
        setNavigationSource(elementId, source)
      },
      getNavigationSource: elementId => {
        return getNavigationSource(elementId)
      },
      getPosition: elementId => {
        // Implementar baseado na store
      },
      returnToPosition: (elementId, defaultAction) => {
        // Implementar baseado na store
      },
    }

    // Ponte para o sistema de câmera suave
    window.smoothCameraReturn = (position, target) => {
      moveCamera(position, target, true)
    }

    return () => {
      // Limpeza ao desmontar
      delete window.globalNavigation
      delete window.navigationSystem
      delete window.smoothCameraReturn
    }
  }, [
    currentSection,
    setCurrentSection,
    storePosition,
    clearPositions,
    clearPositionForElement,
    setNavigationSource,
    getNavigationSource,
    moveCamera,
    sectionIndices,
  ])

  return null // Este componente não renderiza nada
}

// features/audio/AudioBridge.jsx
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
      },
      resumeAll: () => {
        // Implementar baseado na store
      },
      stopSectionSounds: section => {
        // Implementar baseado na store
      },
      sounds: sounds,
    }

    return () => {
      delete window.audioManager
    }
  }, [playSound, stopSound, startAmbient, stopAmbient, stopAllSounds, sounds])

  return null
}
