import React, { useEffect, useRef } from "react"
import Experience from "../pages/Experience"
import { notifyExperienceLoaded } from "../utils/experienceLoadingUtils"

const ExperienceWrapper = ({
  initiallyReady,
  isStarted,
  animationsEnabled,
}) => {
  // ✅ PROTEÇÃO: Evitar múltiplos disparos do mesmo evento
  const hasNotifiedRef = useRef(false)

  useEffect(() => {
    // ✅ DISPARAR EVENTO quando recursos não estão prontos
    if (!initiallyReady && !hasNotifiedRef.current) {
      console.log(
        "📦 [ExperienceWrapper] Recursos não prontos - disparando evento com delay"
      )

      setTimeout(() => {
        // ✅ VERIFICAR NOVAMENTE antes de disparar
        if (!hasNotifiedRef.current) {
          hasNotifiedRef.current = true
          console.log(
            "📦 [ExperienceWrapper] Disparando evento experienceLoaded"
          )

          // ✅ USAR UTIL para disparar evento
          notifyExperienceLoaded("experience-wrapper-timeout", {
            initiallyReady: false,
          })
        } else {
          console.log(
            "📦 [ExperienceWrapper] Evento já foi disparado - ignorando"
          )
        }
      }, 1000)
    } else if (initiallyReady) {
      console.log(
        "📦 [ExperienceWrapper] Recursos já prontos - não precisa disparar evento"
      )
    } else {
      console.log(
        "📦 [ExperienceWrapper] Evento já foi disparado anteriormente - não precisa disparar novamente"
      )
    }

    // Lógica de animações (mantida igual)
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

      if (window.audioManager && window.audioManager.startAmbient) {
        window.audioManager.startAmbient()
      }
    }

    return () => {
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
