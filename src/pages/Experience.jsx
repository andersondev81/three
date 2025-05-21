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

  // Hooks
  const isMobile = useMobileDetection()
  const canvasConfig = getCanvasConfig(isMobile)

  // refs
  const cameraRef = useRef(null)

  // Stores
  const { currentSection, setCurrentSection } = useNavigationStore()
  const { setCameraRef } = useCameraStore()
  const { startAmbient, stopAmbient } = useAudioStore()

  // Sections change handler
  const handleSectionChange = useCallback(
    (index, sectionName) => {
      setCurrentSection(sectionName, index)
    },
    [setCurrentSection]
  )

  // Clean up function
  useEffect(() => {
    // Cam Store
    if (cameraRef.current) {
      setCameraRef(cameraRef)
    }

    // glbal section change handler
    window.onSectionChange = handleSectionChange

    // start ambient audio
    if (initiallyReady && !isReady) {
      setIsReady(true)

      // start ambient audio after a short delay
      setTimeout(() => {
        startAmbient()
      }, 100)
    }

    // page visibility change handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // stop audio when the page is hidden
        if (window.audioManager && window.audioManager.pauseAll) {
          window.audioManager.pauseAll()
        }
      } else {
        // resume audio when the page is visible
        if (window.audioManager && window.audioManager.resumeAll) {
          window.audioManager.resumeAll()
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      // clean up event listeners
      window.removeEventListener("sectionChange", handleSectionChange)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      delete window.onSectionChange

      // stop ambient audio whne component unmounts
      stopAmbient()
    }
  }, [
    handleSectionChange,
    initiallyReady,
    isReady,
    setCameraRef,
    startAmbient,
    stopAmbient,
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

      {/* Interface do Usuário */}
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
