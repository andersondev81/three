import { create } from "zustand"
import * as THREE from "three"

// Configurações de câmera separadas para melhor organização
const CAMERA_CONFIG = {
  default: {
    large: {
      position: new THREE.Vector3(-0.62, 1.04, 192.27),
      target: new THREE.Vector3(-0.22, 1.04, 0.86),
    },
    small: {
      position: new THREE.Vector3(-0.62, 1.04, 192.27),
      target: new THREE.Vector3(-0.22, 1.04, 1.04),
    },
  },
  sections: {
    intro: {
      position: new THREE.Vector3(0, 5, 10),
      target: new THREE.Vector3(0, 0, 0),
    },
    nav: {
      position: new THREE.Vector3(-0.1484, 0.9566, 6.592),
      target: new THREE.Vector3(-0.2183, 1.0421, 0.8605),
    },
    about: {
      position: new THREE.Vector3(1.9361, 1.1392, -0.9749),
      target: new THREE.Vector3(0.4694, 1.0222, -0.2669),
    },
    aidatingcoach: {
      position: new THREE.Vector3(-2.3617, 1.4394, -1.1826),
      target: new THREE.Vector3(-0.1656, 1.5435, -0.0765),
    },
    download: {
      position: new THREE.Vector3(1.9361, 1.1392, -0.9749),
      target: new THREE.Vector3(0.4694, 1.0222, -0.2669),
    },
    token: {
      position: new THREE.Vector3(1.8254, 1.2339, 0.929),
      target: new THREE.Vector3(-0.1281, 0.805, -0.0417),
    },
    roadmap: {
      position: new THREE.Vector3(-2.1622, 1.1694, 1.1159),
      target: new THREE.Vector3(0.0271, 1.178, -0.1795),
    },
  },
}

export const useCameraStore = create((set, get) => ({
  // State
  cameraRef: null,
  controls: null,
  blockAllMovement: false,
  isCameraMoving: false,
  cameraConfig: CAMERA_CONFIG,

  // Actions
  setCameraRef: ref => set({ cameraRef: ref }),

  setControls: controls => {
    set({ controls })

    // Configurações adicionais dos controles
    if (controls?.current) {
      controls.current.minPolarAngle = Math.PI * 0.4
      controls.current.maxPolarAngle = Math.PI * 0.55
      controls.current.minDistance = 0
      controls.current.maxDistance = 100
      controls.current.boundaryFriction = 1
      controls.current.boundaryEnclosesCamera = true
      controls.current.dollyToCursor = true
      controls.current.minY = 1
      controls.current.maxY = 15
    }
  },

  setBlockAllMovement: block => {
    const { controls } = get()
    if (controls?.current) {
      controls.current.enabled = !block
    }
    set({ blockAllMovement: block })
  },

  setIsCameraMoving: isMoving => set({ isCameraMoving: isMoving }),

  moveCamera: (position, target, options = {}) => {
    const { controls } = get()
    if (!controls?.current) return false

    const { animated = true, duration = 2000, onComplete, onError } = options

    try {
      set({ isCameraMoving: true })

      controls.current.setLookAt(
        position.x,
        position.y,
        position.z,
        target.x,
        target.y,
        target.z,
        animated,
        duration
      )

      if (animated && duration > 0) {
        const completeHandler = () => {
          controls.current.removeEventListener("controlend", completeHandler)
          set({ isCameraMoving: false })
          onComplete?.()
        }
        controls.current.addEventListener("controlend", completeHandler)
      } else {
        set({ isCameraMoving: false })
        onComplete?.()
      }

      return true
    } catch (error) {
      console.error("Camera movement error:", error)
      set({ isCameraMoving: false })
      onError?.(error)
      return false
    }
  },

  moveToSection: sectionName => {
    const { cameraConfig, moveCamera } = get()
    const config =
      cameraConfig.sections[sectionName] || cameraConfig.default.large

    return moveCamera(config.position, config.target, {
      animated: true,
      duration: 1500,
    })
  },

  getCameraPosition: () => {
    const { controls } = get()
    if (!controls?.current) return null

    try {
      const position = controls.current.getPosition()
      return position instanceof THREE.Vector3
        ? position.clone()
        : new THREE.Vector3(...position)
    } catch (error) {
      console.error("Error getting camera position:", error)
      return null
    }
  },

  getCameraTarget: () => {
    const { controls } = get()
    if (!controls?.current) return null

    try {
      const target = controls.current.getTarget()
      return target instanceof THREE.Vector3
        ? target.clone()
        : new THREE.Vector3(...target)
    } catch (error) {
      console.error("Error getting camera target:", error)
      return null
    }
  },

  resetCamera: () => {
    const { cameraConfig, moveCamera } = get()
    return moveCamera(
      cameraConfig.default.large.position,
      cameraConfig.default.large.target
    )
  },
}))
