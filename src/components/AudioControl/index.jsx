import React from "react"
import { useAudio } from "../../contexts/AudioContext"
import ToogleMusic from "../animations/ToogleMusic"

const AudioControl = () => {
  const { isAudioOn, toggleAudio } = useAudio()

  return (
    <div className="flex items-center  px-3 py-2 rounded-lg">
      <span className="text-sm text-[#ff3473]">Music:</span>
      <div
        onClick={toggleAudio}
        className="flex items-center cursor-pointer hover:scale-105 transition-transform"
      >
        <ToogleMusic isActive={isAudioOn} />
      </div>
    </div>
  )
}

export default AudioControl
