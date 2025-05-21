import { useEffect, useRef } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"
import { useCameraStore } from "../stores/cameraStore"

export function useCameraAnimation(section, cameraRef) {
  const { camera } = useThree()
  const { blockAllMovement } = useCameraStore()

  const animationRef = useRef({
    progress: 0,
    isActive: false,
    startPosition: new THREE.Vector3(),
    startFov: 50,
    lastTime: 0,
    config: null,
  })

  useEffect(() => {
    if (!camera) return

    // Importar configuração da câmera do seu código atual
    const CAMERA_CONFIG = {
      sections: {
        // Suas configurações de câmera existentes
      },
    }

    const config =
      CAMERA_CONFIG.sections[section] || CAMERA_CONFIG.sections["intro"]
    const ease = t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)

    const setAnimationStart = () => {
      animationRef.current = {
        ...animationRef.current,
        isActive: true,
        startPosition: camera.position.clone(),
        startFov: camera.fov,
        lastTime: performance.now(),
        config,
      }
    }

    const animate = now => {
      if (blockAllMovement || !animationRef.current.isActive) return

      const { startPosition, startFov, config } = animationRef.current
      const delta = Math.min((now - animationRef.current.lastTime) / 1000, 0.1)
      animationRef.current.lastTime = now

      // Ajustar velocidade baseado na seção
      if (section === 0 || section === "intro") {
        animationRef.current.progress += delta * 0.6 // Mais lento
      } else {
        animationRef.current.progress += delta * 1.5
      }

      const t = Math.min(animationRef.current.progress, 1)
      const k = ease(t)

      camera.position.lerpVectors(startPosition, config.position, k)
      camera.fov = THREE.MathUtils.clamp(
        THREE.MathUtils.lerp(startFov, Math.min(config.fov || 50, 55), k),
        35,
        60
      )
      camera.updateProjectionMatrix()

      if (t < 1) {
        requestAnimationFrame(animate)
      } else {
        animationRef.current.isActive = false
        animationRef.current.progress = 0
        camera.fov = Math.min(config.fov || 50, 55)
        camera.updateProjectionMatrix()
      }
    }

    const timeout = setTimeout(() => {
      setAnimationStart()
      requestAnimationFrame(animate)
    }, 50)

    if (cameraRef) {
      cameraRef.current = {
        goToHome: () => {
          setAnimationStart()
          animationRef.current.config = {
            position: new THREE.Vector3(15.9, 6.8, -11.4),
            fov: 50,
            transition: { fovMultiplier: 0, zOffset: 0 },
          }
          requestAnimationFrame(animate)
        },
      }
    }

    return () => {
      clearTimeout(timeout)
      animationRef.current.isActive = false
    }
  }, [section, camera, cameraRef, blockAllMovement])
}
