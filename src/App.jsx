import { useState, useEffect, useMemo } from "react"
import { useProgress } from "@react-three/drei"
import LoadingScreens from "./pages/LoadingScreen"
import ExperienceWrapper from "./components/ExperienceWrapper"
import { AudioProvider } from "./contexts/AudioContext"
import {
  onExperienceLoaded,
  notifyExperienceLoaded,
  setupLegacyCompatibility,
  cleanupLegacyCompatibility,
} from "./utils/experienceLoadingUtils"

function App() {
  // ✅ CONSOLIDADO: Um único enum para loading state ao invés de múltiplos booleans
  const [loadingState, setLoadingState] = useState("loading") // 'loading' | 'loaded' | 'started'
  const [isAudioOn, setIsAudioOn] = useState(true)

  const { progress, active } = useProgress()

  // ✅ ESTADOS DERIVADOS: Calculados ao invés de duplicados
  const isLoading = loadingState === "loading"
  const isLoaded = loadingState === "loaded" || loadingState === "started"
  const hasStarted = loadingState === "started"

  // ✅ MEMO: Evita recálculos desnecessários
  const progressValue = useMemo(() => {
    return typeof progress === "number" ? progress : 0
  }, [progress])

  // ✅ SISTEMA DE EVENTOS CENTRALIZADO
  useEffect(() => {
    const handleExperienceLoaded = event => {
      console.log(
        "📦 [App] Evento experienceLoaded recebido:",
        event.detail || "sem detalhes"
      )

      // ✅ TRANSIÇÃO DE ESTADO ÚNICA
      if (loadingState === "loading") {
        console.log("📦 [App] Transicionando loading → loaded")

        setTimeout(() => {
          setLoadingState("loaded")
          console.log("📦 [App] Estado atualizado: loaded")
        }, 500)
      } else {
        console.log(
          "📦 [App] Recursos já carregados - ignorando evento duplicado"
        )
      }
    }

    const cleanup = onExperienceLoaded(handleExperienceLoaded)
    return cleanup
  }, [loadingState]) // ✅ Dependência do estado consolidado

  useEffect(() => {
    window.isExperienceStarted = hasStarted
    window.isAudioEnabled = isAudioOn
    window.shouldStartAnimations = hasStarted

    setupLegacyCompatibility()

    return () => {
      window.isExperienceStarted = false
      window.isAudioEnabled = false
      window.shouldStartAnimations = false
      cleanupLegacyCompatibility()
    }
  }, [hasStarted, isAudioOn]) // ✅ Dependências derivadas

  // ✅ FALLBACK OTIMIZADO: Usa estado consolidado
  useEffect(() => {
    if (progress === 100 && !active && loadingState === "loading") {
      console.log(
        "📦 [App] Fallback timeout ativado - progress 100% ainda em loading"
      )

      const timeoutId = setTimeout(() => {
        if (loadingState === "loading") {
          console.log("📦 [App] Fallback executado - forçando loaded")
          notifyExperienceLoaded("fallback-timeout", { progress, active })
        }
      }, 3000)

      return () => clearTimeout(timeoutId)
    }
  }, [progress, active, loadingState])

  // ✅ HANDLER CONSOLIDADO: Uma única transição de estado
  const handleStart = () => {
    console.log("🚀 [App] Experiência iniciada pelo usuário")
    setLoadingState("started") // ✅ Única mudança de estado

    setTimeout(() => {
      window.shouldStartAnimations = true
      const startEvent = new CustomEvent("startAnimations")
      window.dispatchEvent(startEvent)
    }, 200)
  }

  const toggleAudio = () => {
    setIsAudioOn(prev => !prev)
    window.isAudioEnabled = !isAudioOn
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
          progress={progressValue}
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
