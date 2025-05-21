import { useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { useAudioStore } from "../stores/audioStore"

export function useAudioSpatial(audioSources = {}) {
  const { playSound, stopSound } = useAudioStore()

  useFrame(({ camera }) => {
    // Atualiza o som espacial baseado na posição da câmera
    Object.entries(audioSources).forEach(([soundId, sourceConfig]) => {
      const { position, maxDistance, volumeScale = 0.2 } = sourceConfig

      // Calcular distância
      const dx = camera.position.x - position.x
      const dy = camera.position.y - position.y
      const dz = camera.position.z - position.z
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

      // Verificar se está dentro do alcance
      if (distance < maxDistance) {
        // Calcular atenuação do volume com uma curva cúbica
        const attenuation = 1 - Math.pow(distance / maxDistance, 3)
        const volume = Math.max(0, volumeScale * attenuation)

        // Tocar o som se o volume for significativo
        if (volume > 0.05) {
          playSound(soundId, { volume })
        } else {
          stopSound(soundId)
        }
      } else {
        // Fora do alcance, parar o som
        stopSound(soundId)
      }
    })
  })

  // Parar todos os sons quando o componente for desmontado
  useEffect(() => {
    return () => {
      Object.keys(audioSources).forEach(soundId => {
        stopSound(soundId)
      })
    }
  }, [])
}
