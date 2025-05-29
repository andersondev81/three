import React from "react"
import CupidLoad from "../../components/animations/CupidLoad"
import AudioControl from "../../components/AudioControl"

const LoadingScreen = ({
  isLoading,
  progress,
  hasStarted,
  onStart,
  isAudioOn,
  toggleAudio,
}) => {
  if (hasStarted) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center justify-center h-full">
        <CupidLoad className="mb-16" />
        {isLoading ? (
          <p className="text-white rounded-lg text-xl font-semibold mt-4 transition-all duration-300">
            {Math.round(progress)}%
          </p>
        ) : (
          <button
            onClick={onStart}
            className="px-6 py-3 bg-[#ff3473] text-white rounded-lg text-lg font-semibold hover:bg-[#cc084f] hover:scale-105 transition-all duration-500 ease-out transform opacity-0 animate-fade-in mt-8" /* Adicionado mt-8 */
            aria-label="Start experience"
          >
            Start Experience
          </button>
        )}
      </div>

      {/* Audio Control */}
      <div className="absolute bottom-4 right-4">
        <AudioControl isAudioOn={isAudioOn} toggleAudio={toggleAudio} />
      </div>
    </div>
  )
}

export default LoadingScreen
