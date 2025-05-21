import create from "zustand"
import * as THREE from "three"

export const useCameraStore = create((set, get) => ({
  // State
  cameraRef: null,
  controls: null,
  blockAllMovement: false,
  cameraConfig: {
    default: {
      large: [
        -0.6191818190771635, 1.0420789531859995, 192.27433517944273,
        -0.21830679207380707, 1.042078953185994, 0.860456882413919,
      ],
      small: [
        -0.6191818190771635, 1.0420789531859995, 192.27433517944273,
        -0.21830679207380707, 1.042078953185994, 1.042078953185994,
      ],
    },
    sections: {
      // Manter sua configuração de câmera existente
      // ...
    },
  },

  // Actions
  setCameraRef: ref => set({ cameraRef: ref }),
  setControls: controls => set({ controls: controls }),
  blockMovement: block => set({ blockAllMovement: block }),

  moveCamera: (position, target, animated = true) => {
    const { controls } = get()
    if (!controls || !controls.current) return false

    try {
      controls.current.setLookAt(
        position[0],
        position[1],
        position[2],
        target[0],
        target[1],
        target[2],
        animated
      )
      return true
    } catch (error) {
      console.error("Camera movement error:", error)
      return false
    }
  },

  getCameraPosition: () => {
    const { controls } = get()
    if (!controls || !controls.current) return null

    try {
      const position = controls.current.getPosition()
      return position instanceof THREE.Vector3
        ? [position.x, position.y, position.z]
        : position
    } catch (error) {
      console.error("Error getting camera position:", error)
      return null
    }
  },

  getCameraTarget: () => {
    const { controls } = get()
    if (!controls || !controls.current) return null

    try {
      const target = controls.current.getTarget()
      return target instanceof THREE.Vector3
        ? [target.x, target.y, target.z]
        : target
    } catch (error) {
      console.error("Error getting camera target:", error)
      return null
    }
  },
}))
