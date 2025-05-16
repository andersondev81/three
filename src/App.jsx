import { useState, useEffect } from "react"
import Experience from "./pages/Experience"
import { useProgress } from "@react-three/drei"
import CupidLoad from "./assets/animations/CupidLoad"
const LoadingScreen = () => {
  const { progress } = useProgress()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <CupidLoad />
        <p className="text-xl">Load... ({parseInt(progress)}%)</p>
      </div>
    </div>
  )
}

function App() {
  const [isLoaded, setIsLoaded] = useState(false)
  const { progress, active } = useProgress()

  // Quando o progresso chegar a 100% ou não estiver mais ativo, consideramos carregado
  useEffect(() => {
    if (progress === 100 && !active) {
      // Pequeno delay para garantir que tudo esteja pronto
      const timer = setTimeout(() => {
        setIsLoaded(true)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [progress, active])

  // Configurando o callback para quando a Experience estiver carregada
  useEffect(() => {
    window.onExperienceLoaded = () => {
      setIsLoaded(true)
    }

    return () => {
      delete window.onExperienceLoaded
    }
  }, [])

  return (
    <div className="relative w-full h-screen bg-black">
      {!isLoaded && <LoadingScreen />}
      <Experience initiallyReady={isLoaded} />
    </div>
  )
}

export default App
