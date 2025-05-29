"use client"

import { useState, useEffect } from "react"
import AudioManager from "../utils/AudioManager"

export const AtmOverlay = ({ isVisible, onClose }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setMounted(true), 300)
      return () => clearTimeout(timer)
    } else {
      AudioManager.play("transition")
      setMounted(false)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 pointer-events-auto">
      <div
        className={`relative w-full h-full p-8 overflow-y-auto transition-all duration-500 ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <button
          onClick={onClose}
          className="fixed bottom-8 right-8 px-8 py-4 bg-gray-200 text-gray-700 rounded-full font-bold text-lg hover:bg-gray-300 transition-all duration-300 shadow-lg"
        >
          Return to Castle
        </button>
        <span className="bg-gray-950 w-[}"></span>
      </div>
    </div>
  )
}

export default AtmOverlay
