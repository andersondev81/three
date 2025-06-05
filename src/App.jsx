import { useState, useEffect, useRef } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useProgress } from "@react-three/drei"
import LoadingScreens from "./pages/LoadingScreen/LoadingScreen"
import Experience from "./pages/Experience"
import { AudioProvider } from "./contexts/AudioContext"

// ✅ LOADING PAGE COM EXPERIENCE ÚNICO - SEM NAVEGAÇÃO
function LoadingPage() {
  const [step, setStep] = useState("loading") // loading → loaded → started
  const [isAudioOn, setIsAudioOn] = useState(true)
  const hasLoadedRef = useRef(false)
  const hasStartedRef = useRef(false)

  // ✅ useProgress detecta assets do Experience
  const { progress, active, total, loaded } = useProgress()

  console.log(
    `📊 [LoadingPage] Progress: ${Math.round(
      progress
    )}% | Assets: ${loaded}/${total} | Step: ${step}`
  )

  // ✅ PRÉ-CARREGAMENTO DE ASSETS EXTRAS (reduzido para mobile)
  useEffect(() => {
    console.log("🔄 [LoadingPage] Pré-carregando assets extras...")

    // ✅ Detectar mobile para carregar menos assets
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (!isMobile) {
      // ✅ Desktop: carregar tudo
      const videoFiles = ["/video/tunnel.mp4", "/video/water.mp4"]
      videoFiles.forEach(videoSrc => {
        const video = document.createElement("video")
        video.preload = "metadata" // ✅ Menos pesado que "auto"
        video.src = videoSrc
        video.load()
        console.log(`🎥 [LoadingPage] Pré-carregando vídeo: ${videoSrc}`)
      })
    } else {
      console.log("📱 [LoadingPage] Mobile detectado - pulando vídeos pesados")
    }

    // ✅ Áudios (essenciais para todos)
    const audioFiles = ["/audio/fountain.mp3", "/audio/templeambiance.mp3"]
    audioFiles.forEach(audioSrc => {
      const audio = new Audio()
      audio.preload = "metadata" // ✅ Menos pesado
      audio.src = audioSrc
      audio.load()
      console.log(`🎵 [LoadingPage] Pré-carregando áudio: ${audioSrc}`)
    })

    // ✅ Imagens essenciais
    const imageFiles = ["/images/logo.jpeg", "/images/CloudsBG.hdr"]
    imageFiles.forEach(imgSrc => {
      const img = new Image()
      img.src = imgSrc
      console.log(`🖼️ [LoadingPage] Pré-carregando imagem: ${imgSrc}`)
    })

    // ✅ AudioManager
    if (
      window.audioManager &&
      window.audioManager.preloadAll &&
      !window.audioPreloaded
    ) {
      window.audioManager.preloadAll()
      window.audioPreloaded = true
      console.log("🎵 [LoadingPage] AudioManager preloadAll() executado")
    }
  }, [])

  // ✅ LÓGICA DE LOADING REAL
  useEffect(() => {
    if (hasLoadedRef.current) return

    const hasAssets = total > 0
    const isComplete = progress === 100 && !active
    const noAssetsTimeout = !hasAssets && !active

    if (isComplete && hasAssets) {
      console.log(`✅ [LoadingPage] Assets carregados - ${loaded}/${total}`)
      hasLoadedRef.current = true
      setTimeout(() => setStep("loaded"), 500)
    } else if (noAssetsTimeout) {
      const timer = setTimeout(() => {
        if (!hasLoadedRef.current) {
          console.log("📭 [LoadingPage] Assets carregados via timeout")
          hasLoadedRef.current = true
          setStep("loaded")
        }
      }, 6000) // ✅ Timeout menor para mobile

      return () => clearTimeout(timer)
    }
  }, [progress, active, total, loaded])

  // ✅ Configuração global
  useEffect(() => {
    window.isAudioEnabled = isAudioOn
  }, [isAudioOn])

  const handleStart = () => {
    if (hasStartedRef.current) return // ✅ Evitar duplo clique

    console.log("🚀 [LoadingPage] Iniciando Experience na MESMA página!")
    hasStartedRef.current = true

    // ✅ SEM navegação - apenas mudança de estado
    setStep("started")

    // ✅ Marcar flags globais
    window.glbAssetsPreloaded = true
    window.isExperienceStarted = true
    window.shouldStartAnimations = true

    // ✅ Disparar evento de início IMEDIATAMENTE
    console.log("🚀 [LoadingPage] Disparando startAnimations AGORA")
    const startEvent = new CustomEvent("startAnimations")
    window.dispatchEvent(startEvent)
  }

  const toggleAudio = () => {
    setIsAudioOn(prev => !prev)
  }

  const isStarted = step === "started"

  return (
    <div className="relative w-full h-screen bg-black">
      {/* ✅ EXPERIENCE ÚNICO - sempre renderizado, controlado por isStarted */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          isStarted ? "opacity-100 z-10" : "opacity-0 z-0"
        }`}
        style={{ pointerEvents: isStarted ? "auto" : "none" }}
      >
        <Experience initiallyReady={step !== "loading"} isStarted={isStarted} />
      </div>

      {/* ✅ LOADING SCREEN - overlay que some quando started */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          isStarted ? "opacity-0 pointer-events-none z-0" : "opacity-100 z-20"
        }`}
      >
        <LoadingScreens
          hasStarted={isStarted}
          onStart={handleStart}
          isAudioOn={isAudioOn}
          toggleAudio={toggleAudio}
          isLoaded={step === "loaded"}
          progress={Math.round(progress)}
          isLoading={step === "loading"}
        />
      </div>
    </div>
  )
}

// ✅ EXPERIENCE PAGE - rota direta (sem loading)
function ExperiencePage() {
  useEffect(() => {
    console.log("🎮 [ExperiencePage] Acesso direto - sem loading")
    window.glbAssetsPreloaded = true
    window.isExperienceStarted = true
    window.shouldStartAnimations = true
  }, [])

  return <Experience initiallyReady={true} isStarted={true} />
}

// ✅ APP COM ROUTES
function App() {
  return (
    <BrowserRouter>
      <AudioProvider>
        <Routes>
          <Route path="/" element={<LoadingPage />} />
          <Route path="/experience" element={<ExperiencePage />} />
        </Routes>
      </AudioProvider>
    </BrowserRouter>
  )
}

export default App
