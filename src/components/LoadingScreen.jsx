import React from "react"
import CupidLoad from "../assets/animations/CupidLoad"
import ToogleLanguage from "../assets/animations/ToogleMusic"
import { useUIAudio } from "../hooks/useAudio" // ✅ OPCIONAL: Usar o hook

export const LoadingScreen = ({ progress }) => {
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

export const StartScreen = ({ onStart, isAudioOn, toggleAudio }) => {
  // ✅ OPCIONAL: Usar hook para som de clique
  const { playClick } = useUIAudio()

  const handleStart = () => {
    playClick() // ✅ Som de clique antes de iniciar
    onStart()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <button
          onClick={handleStart} // ✅ Usando handler com som
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

const LoadingScreens = ({
  hasStarted,
  onStart,
  isAudioOn,
  toggleAudio,
  isLoaded,
  progress,
  isLoading,
}) => {
  if (isLoading) {
    return <LoadingScreen progress={progress} />
  }

  if (!hasStarted) {
    return (
      <StartScreen
        onStart={onStart}
        isAudioOn={isAudioOn}
        toggleAudio={toggleAudio}
      />
    )
  }

  return null
}

export default LoadingScreens
