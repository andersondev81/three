// ✅ ATUALIZAR ARQUIVO EXISTENTE: App.jsx
import { useState, useEffect, useRef } from "react"
import { useProgress } from "@react-three/drei"
import LoadingScreens from "./components/LoadingScreen"
import ExperienceWrapper from "./components/ExperienceWrapper"
import { AudioBridge } from "./features/audio/AudioBridge"

function App() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const resourcesLoadedRef = useRef(false)

  const { progress, active } = useProgress()

  // Configurar callbacks globais
  useEffect(() => {
    // Estado inicial
    window.isExperienceStarted = false
    window.isAudioEnabled = isAudioOn
    window.shouldStartAnimations = false

    // Callback para quando a experiência carregar
    window.onExperienceLoaded = function () {
      if (!resourcesLoadedRef.current) {
        resourcesLoadedRef.current = true
        setTimeout(() => {
          setIsLoaded(true)
          setIsLoading(false)
        }, 500)
      }
    }

    // Cleanup
    return () => {
      window.isExperienceStarted = false
      window.isAudioEnabled = false
      window.shouldStartAnimations = false
      window.onExperienceLoaded = null
    }
  }, [isAudioOn])

  // Fallback para carregamento
  useEffect(() => {
    if (progress === 100 && !active && !resourcesLoadedRef.current) {
      const timeoutId = setTimeout(() => {
        if (!resourcesLoadedRef.current) {
          resourcesLoadedRef.current = true
          setIsLoaded(true)
          setIsLoading(false)
        }
      }, 3000)

      return () => clearTimeout(timeoutId)
    }
  }, [progress, active])

  const handleStart = () => {
    setHasStarted(true)
    window.isExperienceStarted = true

    setTimeout(() => {
      window.shouldStartAnimations = true
      const startEvent = new CustomEvent("startAnimations")
      window.dispatchEvent(startEvent)
    }, 200)
  }

  const toggleAudio = () => {
    const newAudioState = !isAudioOn
    setIsAudioOn(newAudioState)
    window.isAudioEnabled = newAudioState

    // Notificar o sistema de áudio sobre a mudança
    if (window.audioManager) {
      window.audioManager.setMuted(!newAudioState)
    }
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Sistema de áudio global */}
      <AudioBridge />

      {/* Telas de carregamento */}
      <LoadingScreens
        hasStarted={hasStarted}
        onStart={handleStart}
        isAudioOn={isAudioOn}
        toggleAudio={toggleAudio}
        isLoaded={isLoaded}
        progress={progress}
        isLoading={isLoading}
      />

      {/* Experiência principal */}
      <div
        className={`absolute inset-0 ${hasStarted ? "visible" : "invisible"}`}
      >
        <ExperienceWrapper
          initiallyReady={isLoaded}
          isStarted={hasStarted}
          animationsEnabled={hasStarted}
        />
      </div>
    </div>
  )
}

export default App
