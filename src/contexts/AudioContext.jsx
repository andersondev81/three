import React, { createContext, useState, useContext, useEffect } from "react"

const AudioContext = createContext()

export const AudioProvider = ({ children }) => {
  const [isAudioOn, setIsAudioOn] = useState(true)

  useEffect(() => {
    // Sincroniza com o gerenciador global de áudio
    if (window.audioManager) {
      const initialVolume = isAudioOn ? 0.3 : 0
      window.audioManager.setAmbientVolume(initialVolume)
      window.isAudioEnabled = isAudioOn
    }
  }, [isAudioOn])

  const toggleAudio = () => {
    setIsAudioOn(prev => !prev)
    window.isAudioEnabled = !isAudioOn

    setTimeout(() => {
      if (window.audioManager) {
        if (isAudioOn) {
          window.audioManager.killAllAudio()
        } else {
          window.audioManager.reviveAllAudio()
        }
      }
    }, 50)
  }

  return (
    <AudioContext.Provider value={{ isAudioOn, toggleAudio }}>
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider")
  }
  return context
}
