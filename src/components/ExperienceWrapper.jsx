import React, { useEffect } from "react"
import Experience from "../pages/Experience"

const ExperienceWrapper = ({
  initiallyReady,
  isStarted,
  animationsEnabled,
}) => {
  useEffect(() => {
    if (!initiallyReady) {
      setTimeout(() => {
        if (
          window.onExperienceLoaded &&
          typeof window.onExperienceLoaded === "function"
        ) {
          window.onExperienceLoaded()
        }
      }, 1000)
    }

    if (!isStarted) {
      if (window.shouldStartAnimations) {
        window.shouldStartAnimations = false
      }
    } else {
      if (animationsEnabled) {
        window.shouldStartAnimations = true
        const startEvent = new CustomEvent("startAnimations")
        window.dispatchEvent(startEvent)
      }

      // ✅ REMOVIDO: Chamada duplicada para startAmbient
      // O AudioBridge já gerencia o início do áudio ambiente
      // if (window.audioManager && window.audioManager.startAmbient) {
      //   window.audioManager.startAmbient()
      // }
    }

    return () => {
      // ✅ MANTIDO: Cleanup é sempre bom
      if (window.audioManager && window.audioManager.stopAmbient) {
        window.audioManager.stopAmbient()
      }
    }
  }, [isStarted, animationsEnabled, initiallyReady])

  return (
    <Experience
      initiallyReady={initiallyReady}
      isStarted={isStarted}
      animationsEnabled={isStarted && animationsEnabled}
    />
  )
}

export default ExperienceWrapper
