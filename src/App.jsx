import { useState, useEffect } from "react"
import Experience from "./pages/Experience"
import { useProgress } from "@react-three/drei"
import CupidLoad from "./assets/animations/CupidLoad"
import ToogleLanguage from "./assets/animations/ToogleMusic"
import { useResourcesStore } from "./stores/resourcesStore"
import { useAudioStore } from "./stores/audioStore"

const StartScreen = ({ onStart, isAudioOn, toggleAudio }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <button
          onClick={onStart}
          className="mt-8 px-6 py-3 bg-[#ff3473] text-white rounded-lg text-lg font-semibold hover:bg-[#cc084f] hover:scale-105 transition-all duration-300 ease-in-out transform"
        >
          Start Experience
        </button>
      </div>

      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-black bg-opacity-50 px-3 py-2 rounded-lg">
        <span className="text-sm text-[#ff3473]">Music:</span>
        <div onClick={toggleAudio} className="flex items-center cursor-pointer">
          <ToogleLanguage isActive={isAudioOn} />
        </div>
      </div>
    </div>
  )
}

const LoadingScreen = ({ progress }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <CupidLoad />
        <p className="text-xl mt-4 transition-all duration-300">
          Loading... ({parseInt(progress)}%)
        </p>
      </div>
    </div>
  )
}

function App() {
  const [hasStarted, setHasStarted] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const { setMuted } = useAudioStore()
  const { isLoading, progress, setLoading } = useResourcesStore()
  const { progress: threeProgress, active } = useProgress()
  const [isAudioOn, setIsAudioOn] = useState(true)
  const handleStart = () => {
    setHasStarted(true)
    setShouldLoad(true)
  }
  const toggleAudio = () => {
    const newState = !isAudioOn
    setIsAudioOn(newState)
    setMuted(!newState) // Atualiza o estado na store de áudio
  }

  useEffect(() => {
    if (shouldLoad && threeProgress === 100 && !active) {
      const timer = setTimeout(() => {
        setLoading(false) // Marca como carregado na store
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [threeProgress, active, shouldLoad, setLoading])

  const showExperience = shouldLoad
  const isFullyLoaded = !isLoading && threeProgress === 100 && !active

  return (
    <div className="relative w-full h-screen bg-black">
      {!hasStarted ? (
        <StartScreen
          onStart={handleStart}
          isAudioOn={isAudioOn}
          toggleAudio={toggleAudio}
        />
      ) : !isFullyLoaded ? (
        <LoadingScreen progress={threeProgress} />
      ) : null}

      {showExperience && <Experience initiallyReady={isFullyLoaded} />}
    </div>
  )
}

export default App
