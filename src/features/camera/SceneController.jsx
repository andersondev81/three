import React, { useState, useEffect } from "react"
import { Perf } from "r3f-perf"
import { useThree } from "@react-three/fiber"
import { useCameraStore } from "../../stores/cameraStore"
import { useCameraAnimation } from "../../hooks/useCameraAnimation"
import EnvMapLoader from "../../components/helpers/EnvMapLoader"

export const SceneController = React.memo(({ section, cameraRef }) => {
  const { camera } = useThree()
  const [showPerf, setShowPerf] = useState(false)
  const { setControls } = useCameraStore()

  useCameraAnimation(section, cameraRef)

  useEffect(() => {
    const togglePerf = e => {
      if (e.key === "p" || e.key === "P") {
        setShowPerf(prev => !prev)
      }
    }

    window.addEventListener("keydown", togglePerf)
    return () => window.removeEventListener("keydown", togglePerf)
  }, [])

  useEffect(() => {
    window.threeCamera = camera

    return () => {
      delete window.threeCamera
    }
  }, [camera])

  return (
    <>
      <EnvMapLoader />
      {showPerf && process.env.NODE_ENV !== "production" && (
        <Perf position="top-left" />
      )}
    </>
  )
})
