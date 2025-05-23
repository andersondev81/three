import React, { useState, useEffect, useRef, useCallback } from "react"
import { Canvas } from "@react-three/fiber"
import { useMobileDetection } from "../hooks/useMobileDetection"
import { useNavigationStore } from "../stores/navigationStore"
import { useCameraStore } from "../stores/cameraStore"
import { useAudioStore } from "../stores/audioStore"
import { useResourcesStore } from "../stores/resourcesStore"
import { SceneController } from "../features/camera/SceneController"
import { CastleUi } from "../assets/models/CastleUi"
import PrimaryContent from "../features/castle/PrimaryContent"
import SecondaryContent from "../features/castle/SecondaryContent"
import TertiaryContent from "../features/castle/TertiaryContent"
import { NavigationBridge } from "../features/navigation/NavigationBridge"
import { AudioBridge } from "../features/audio/AudioBridge"
import { CastleAudioManager } from "../features/audio/CastleAudioManager"

const getCanvasConfig = isMobile => ({
  dpr: isMobile ? 1 : 1.5,
  gl: {
    antialias: false,
    powerPreference: isMobile ? "low-power" : "high-performance",
    alpha: false,
    depth: true,
    stencil: true,
  },
  performance: { min: 0.1 },
  camera: {
    fov: 50,
    near: 0.1,
    far: 1000,
  },
  shadows: !isMobile,
})

const SceneContent = React.memo(({ isReady }) => {
  const { currentSection, setCurrentSection } = useNavigationStore()

  const handleSectionChange = useCallback(
    (index, sectionName) => {
      setCurrentSection(sectionName, index)
    },
    [setCurrentSection]
  )

  return (
    <>
      <CastleAudioManager isReady={isReady} />
      <PrimaryContent
        activeSection={currentSection}
        onSectionChange={handleSectionChange}
        isReady={isReady}
      />
      <SecondaryContent isReady={isReady} />
      <TertiaryContent />
    </>
  )
})

const Experience = ({ initiallyReady = false }) => {
  const [isReady, setIsReady] = useState(initiallyReady)
  const audioInitializedRef = useRef(false)

  // Hooks
  const isMobile = useMobileDetection()
  const canvasConfig = getCanvasConfig(isMobile)

  // refs
  const cameraRef = useRef(null)

  // Stores
  const { currentSection, setCurrentSection } = useNavigationStore()
  const { setCameraRef } = useCameraStore()
  const { startAmbient, stopAmbient, setUserInteracted } = useAudioStore()

  // Sections change handler
  const handleSectionChange = useCallback(
    (index, sectionName) => {
      setCurrentSection(sectionName, index)
    },
    [setCurrentSection]
  )

  // Audio initialization with better error handling
  const initializeAudio = useCallback(() => {
    if (audioInitializedRef.current) return

    audioInitializedRef.current = true

    // Set user interacted flag
    setUserInteracted()

    // Start ambient audio after a delay to ensure clean state
    setTimeout(() => {
      if (window.isAudioEnabled !== false) {
        startAmbient()
      }
    }, 200)
  }, [setUserInteracted, startAmbient])

  // Clean up function
  useEffect(() => {
    // Camera Store
    if (cameraRef.current) {
      setCameraRef(cameraRef)
    }

    // Global section change handler
    window.onSectionChange = handleSectionChange

    // Initialize audio when ready
    if (initiallyReady && !isReady) {
      setIsReady(true)
      initializeAudio()
    }

    // Add user interaction listeners for audio initialization
    const handleUserInteraction = () => {
      initializeAudio()
      // Remove listeners after first interaction
      document.removeEventListener("click", handleUserInteraction)
      document.removeEventListener("touchstart", handleUserInteraction)
      document.removeEventListener("keydown", handleUserInteraction)
    }

    document.addEventListener("click", handleUserInteraction, { passive: true })
    document.addEventListener("touchstart", handleUserInteraction, {
      passive: true,
    })
    document.addEventListener("keydown", handleUserInteraction, {
      passive: true,
    })

    return () => {
      // Clean up event listeners
      document.removeEventListener("click", handleUserInteraction)
      document.removeEventListener("touchstart", handleUserInteraction)
      document.removeEventListener("keydown", handleUserInteraction)

      window.removeEventListener("sectionChange", handleSectionChange)
      delete window.onSectionChange

      // Stop ambient audio when component unmounts
      stopAmbient()

      // Reset audio initialization flag
      audioInitializedRef.current = false
    }
  }, [
    handleSectionChange,
    initiallyReady,
    isReady,
    setCameraRef,
    stopAmbient,
    initializeAudio,
  ])

  return (
    <div className="relative w-full h-screen">
      <NavigationBridge />
      <AudioBridge />

      <div className="absolute inset-0 z-0">
        <Canvas {...canvasConfig} className="w-full h-full">
          <SceneController section={currentSection} cameraRef={cameraRef} />
          <SceneContent isReady={isReady} />
        </Canvas>
      </div>

      {/* User Interface */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="w-full h-full">
          <CastleUi
            section={currentSection}
            onSectionChange={handleSectionChange}
            cameraRef={cameraRef.current}
            className="pointer-events-auto"
          />
        </div>
      </div>
    </div>
  )
}

export default Experience
