import { useState, useEffect, useRef } from "react"
import { useProgress } from "@react-three/drei"
import LoadingScreens from "./components/LoadingScreen"
import ExperienceWrapper from "./components/ExperienceWrapper"
// version
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

  useEffect(() => {
    window.isExperienceStarted = false
    window.isAudioEnabled = isAudioOn
    window.shouldStartAnimations = false

    window.onExperienceLoaded = function () {
      if (!resourcesLoadedRef.current) {
        resourcesLoadedRef.current = true

        setTimeout(() => {
          setIsLoaded(true)
          setIsLoading(false)
        }, 500)
      }
    }

    return () => {
      window.isExperienceStarted = false
      window.isAudioEnabled = false
      window.shouldStartAnimations = false
      window.onExperienceLoaded = null
    }
  }, [])

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
    setIsAudioOn(prev => !prev)
    window.isAudioEnabled = !window.isAudioEnabled
  }

  return (
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
  )
}

export default App
