// ✅ SUBSTITUIR ARQUIVO EXISTENTE: components/CastleAudioManager.jsx
import React, { useEffect, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { useAudioStore } from "../../stores/audioStore"
import { useNavigationStore } from "../../stores/navigationStore"

export const CastleAudioManager = React.memo(({ isReady }) => {
  const { updateSpatialAudio, activateSection, isExperienceStarted } =
    useAudioStore()
  const { currentSection } = useNavigationStore()
  const [spatialAudioActive, setSpatialAudioActive] = useState(false)

  // Ativar seção quando muda
  useEffect(() => {
    if (isReady && isExperienceStarted()) {
      activateSection(currentSection)
    }
  }, [currentSection, isReady, activateSection, isExperienceStarted])

  // ✅ Controlar quando ativar áudio espacial
  useEffect(() => {
    if (isReady && isExperienceStarted()) {
      // Delay para permitir que ambiente se estabeleça primeiro
      const timeoutId = setTimeout(() => {
        console.log("[CastleAudioManager] Activating spatial audio...")
        setSpatialAudioActive(true)
      }, 1000) // ✅ 1 segundo após experience started

      return () => clearTimeout(timeoutId)
    } else {
      setSpatialAudioActive(false)
    }
  }, [isReady, isExperienceStarted])

  // Frame loop para áudio espacial (só quando ativo)
  useFrame(({ camera }) => {
    if (!spatialAudioActive) return

    const cameraPosition = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    }

    updateSpatialAudio(cameraPosition)
  })

  return null
})

CastleAudioManager.displayName = "CastleAudioManager"
