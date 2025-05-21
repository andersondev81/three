import { useEffect, useRef } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"
import { CAMERA_CONFIG } from "../components/cameraConfig"

export const useCameraAnimation = (section, cameraRef) => {
  const { camera } = useThree()
  const animationRef = useRef({
    progress: 0,
    isActive: false,
    startPosition: new THREE.Vector3(),
    startFov: 50,
    lastTime: 0,
    config: null,
  })

  useEffect(() => {
    // Verificações de segurança
    if (!camera || !CAMERA_CONFIG.sections) return

    const config =
      CAMERA_CONFIG.sections[section] || CAMERA_CONFIG.sections["intro"]

    // Função de easing para suavizar a animação
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
      // Verificações de segurança adicionais
      if (window.blockAllCameraMovement || !animationRef.current.isActive)
        return
      if (!camera || !config) return

      const {
        startPosition,
        startFov,
        config: animConfig,
      } = animationRef.current
      const delta = Math.min((now - animationRef.current.lastTime) / 1000, 0.1)
      animationRef.current.lastTime = now

      // Ajustar velocidade baseado na seção
      animationRef.current.progress +=
        delta * (section === 0 || section === "intro" ? 0.6 : 1.5)

      const t = Math.min(animationRef.current.progress, 1)
      const k = ease(t)

      // Verificar se a posição de destino existe
      if (animConfig.position) {
        camera.position.lerpVectors(
          startPosition,
          new THREE.Vector3(
            ...(Array.isArray(animConfig.position)
              ? animConfig.position
              : [0, 0, 0])
          ),
          k
        )
      }

      // Ajustar campo de visão
      camera.fov = THREE.MathUtils.clamp(
        THREE.MathUtils.lerp(startFov, Math.min(animConfig.fov || 50, 55), k),
        35,
        60
      )
      camera.updateProjectionMatrix()

      if (t < 1) {
        requestAnimationFrame(animate)
      } else {
        animationRef.current.isActive = false
        animationRef.current.progress = 0
        camera.fov = Math.min(animConfig.fov || 50, 55)
        camera.updateProjectionMatrix()
      }
    }

    const timeout = setTimeout(() => {
      setAnimationStart()
      requestAnimationFrame(animate)
    }, 50)

    // Adicionar método de retorno à home no cameraRef
    if (cameraRef) {
      cameraRef.current = {
        goToHome: () => {
          setAnimationStart()
          animationRef.current.config = {
            position: [15.9, 6.8, -11.4],
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
  }, [section, camera, cameraRef])
}
