import { useState, useEffect, useRef } from "react"
import { useProgress } from "@react-three/drei"
import LoadingScreens from "./pages/LoadingScreen"
import ExperienceWrapper from "./components/ExperienceWrapper"
import { AudioProvider } from "./contexts/AudioContext"

function App() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const resourcesLoadedRef = useRef(false)
  const progressRef = useRef(0)

  const { progress, active } = useProgress()

  useEffect(() => {
    if (typeof progress === "number") {
      progressRef.current = progress
    }
  }, [progress])

  // ✅ SISTEMA DE EVENTOS CENTRALIZADO - substitui window.onExperienceLoaded
  useEffect(() => {
    const handleExperienceLoaded = event => {
      console.log(
        "📦 [App] Evento experienceLoaded recebido:",
        event.detail || "sem detalhes"
      )

      if (!resourcesLoadedRef.current) {
        resourcesLoadedRef.current = true
        console.log("📦 [App] Marcando recursos como carregados...")

        setTimeout(() => {
          setIsLoaded(true)
          setIsLoading(false)
          console.log(
            "📦 [App] Estados atualizados: isLoaded=true, isLoading=false"
          )
        }, 500)
      } else {
        console.log(
          "📦 [App] Recursos já estavam carregados - ignorando evento duplicado"
        )
      }
    }

    // Escutar evento personalizado
    document.addEventListener("experienceLoaded", handleExperienceLoaded)

    // Cleanup
    return () => {
      document.removeEventListener("experienceLoaded", handleExperienceLoaded)
    }
  }, [])

  useEffect(() => {
    window.isExperienceStarted = false
    window.isAudioEnabled = isAudioOn
    window.shouldStartAnimations = false

    // ❌ REMOVIDO: window.onExperienceLoaded - agora usa sistema de eventos
    // Manter compatibilidade temporária se algum código ainda usar
    window.onExperienceLoaded = function () {
      console.log(
        "⚠️ [App] window.onExperienceLoaded chamado - redirecionando para evento"
      )
      document.dispatchEvent(
        new CustomEvent("experienceLoaded", {
          detail: { source: "legacy-callback" },
        })
      )
    }

    return () => {
      window.isExperienceStarted = false
      window.isAudioEnabled = false
      window.shouldStartAnimations = false
      window.onExperienceLoaded = null
    }
  }, [])

  // Fallback com timeout (mantido para robustez)
  useEffect(() => {
    if (progress === 100 && !active && !resourcesLoadedRef.current) {
      console.log(
        "📦 [App] Fallback timeout ativado - progress 100% sem recursos carregados"
      )

      const timeoutId = setTimeout(() => {
        if (!resourcesLoadedRef.current) {
          console.log("📦 [App] Fallback executado - forçando carregamento")

          // Disparar evento ao invés de chamada direta
          document.dispatchEvent(
            new CustomEvent("experienceLoaded", {
              detail: { source: "fallback-timeout" },
            })
          )
        }
      }, 3000)

      return () => clearTimeout(timeoutId)
    }
  }, [progress, active])

  const handleStart = () => {
    console.log("🚀 [App] Experiência iniciada pelo usuário")
    setHasStarted(true)
    window.isExperienceStarted = true

    setTimeout(() => {
      window.shouldStartAnimations = true
      const startEvent = new CustomEvent("startAnimations")
      window.dispatchEvent(startEvent)
    }, 200)
  }

  const toggleAudio = () => {
    setIsAudioOn(prev => !prev)
    window.isAudioEnabled = !window.isAudioEnabled
  }

  return (
    <AudioProvider>
      <div className="relative w-full h-screen bg-black">
        <LoadingScreens
          hasStarted={hasStarted}
          onStart={handleStart}
          isAudioOn={isAudioOn}
          toggleAudio={toggleAudio}
          isLoaded={isLoaded}
          progress={progress}
          isLoading={isLoading}
        />

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
    </AudioProvider>
  )
}

export default App
