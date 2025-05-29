import React from "react"
import AudioControl from "../../components/AudioControl"

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

      <div className="fixed bottom-4 right-4">
        <AudioControl />
      </div>
    </div>
  )
}

export default StartScreen
