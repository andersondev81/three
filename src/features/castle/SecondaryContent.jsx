import React, { useRef } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { CloudGroup } from "../../assets/models/CloudsGroup"

// Custom hook for mobile detection
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera
      const mobileRegex =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      setIsMobile(mobileRegex.test(userAgent) || window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}

const SecondaryContent = React.memo(({ isReady }) => {
  const cloudGroupRef = useRef()
  const { camera } = useThree()
  const isMobile = useMobileDetection()

  // Adjust clouds based on camera position
  useFrame(() => {
    if (!isReady) return

    const castleCenter = new THREE.Vector3(0, 0, 0)
    const distance = camera.position.distanceTo(castleCenter)

    const minDistance = 5
    const maxDistance = 8
    const minOpacity = 0.7
    const maxOpacity = 1.8

    const t = THREE.MathUtils.clamp(
      (distance - minDistance) / (maxDistance - minDistance),
      0,
      1
    )
    const targetOpacity = THREE.MathUtils.lerp(maxOpacity, minOpacity, t)

    if (cloudGroupRef.current) {
      cloudGroupRef.current.traverse(obj => {
        if (obj.isMesh && obj.material) {
          obj.material.opacity = targetOpacity
          obj.material.transparent = true
          obj.material.depthWrite = false
          obj.material.needsUpdate = true
        }
      })
    }
  })

  return (
    <>
      <ambientLight intensity={3} color="#ffffff" />
      <group ref={cloudGroupRef}>
        <CloudGroup
          commonProps={{
            concentration: 1.2,
            sizeAttenuation: true,
            color: "#ffffff",
            depthWrite: false,
            stencilRef: 1,
            stencilWrite: true,
            stencilFunc: THREE.EqualStencilFunc,
            cloudLightIntensity: 0.5,
            opacity: 1.0,
            transparent: true,
          }}
          clouds={
            isMobile
              ? [
                  { position: [-0.1, 0, 4.3], fade: 20 },
                  {
                    position: [0, 0, 4.5],
                    segments: 15,
                    bounds: [8, 1, 1.2],
                    fade: 5,
                    opacity: 1.3,
                  },
                  {
                    position: [-0.6, -0.15, 5],
                    segments: 8,
                    bounds: [1.5, 1, 1],
                    opacity: 1.5,
                  },
                  {
                    position: [0, 0, 5.6],
                    density: 0.7,
                    segments: 20,
                    bounds: [10, 1, 6],
                  },
                ]
              : [
                  { position: [-0.1, 0, 4.3], fade: 20 },
                  {
                    position: [0, 0, 4.5],
                    segments: 25,
                    bounds: [10, 1, 1.2],
                    fade: 5,
                    opacity: 1.3,
                  },
                  {
                    position: [-0.6, -0.15, 5],
                    segments: 8,
                    bounds: [1.5, 1, 1],
                    opacity: 1.5,
                  },
                  {
                    position: [0, 0, 5.6],
                    density: 1,
                    segments: 30,
                    bounds: [10, 1, 6],
                  },
                  {
                    position: [-2.8, 0, 3.3],
                    density: 1,
                    segments: 35,
                    bounds: [12, 1, 5],
                  },
                  {
                    position: [-3.0, 0, 5.0],
                    density: 1,
                    segments: 30,
                    bounds: [10, 1, 5],
                  },
                  {
                    position: [2.8, 0, 3.3],
                    density: 1,
                    segments: 35,
                    bounds: [12, 1, 5],
                  },
                  {
                    position: [3.0, 0, 5.0],
                    density: 1,
                    segments: 30,
                    bounds: [10, 1, 5],
                  },
                  { position: [0.2, 0, 3.95], rotation: [0, 1.7, 3.3] },
                  { position: [1.6, 0.2, 2.6], rotation: [0, 0.15, 0] },
                  { position: [2.05, 0.15, 2.2], rotation: [0, 1, 0] },
                  { position: [2.65, 0.15, 1.1], rotation: [0, 1.7, 0] },
                  { position: [2.8, 0.1, -0.6], rotation: [0, 1.4, 0] },
                  {
                    position: [6.6, 0, 2],
                    density: 1,
                    segments: 30,
                    bounds: [10, 1, 5],
                    rotation: [0, 3.14, 0],
                  },
                  {
                    position: [6.6, 0, -1.5],
                    density: 1,
                    segments: 30,
                    bounds: [10, 1, 5],
                    rotation: [0, 3.14, 0],
                  },
                  {
                    position: [6.0, 0, -4.8],
                    density: 1,
                    segments: 30,
                    bounds: [10, 1, 5],
                    rotation: [0, 3.14, 0],
                  },
                  { position: [2.9, 0.15, -2.0], rotation: [0, 2, 0] },
                  { position: [1.4, 0.2, -3.35], rotation: [3.14, 0.15, 0] },
                  { position: [-0.1, 0.2, -3.45], rotation: [3.14, 0, 0] },
                  { position: [-1.5, 0.2, -3.35], rotation: [3.14, -0.1, 0] },
                  { position: [-1.75, 0.15, -2.55], rotation: [0, 0.8, 0] },
                  {
                    position: [0, 0, -6.0],
                    density: 1,
                    segments: 30,
                    bounds: [12, 1, 5],
                    rotation: [0, 3.14, 0],
                  },
                  {
                    position: [3, 0, -8.3],
                    density: 1,
                    segments: 20,
                    bounds: [10, 1, 3],
                    rotation: [0, 3.14, 0],
                  },
                  {
                    position: [-3, 0, -8.0],
                    density: 1,
                    segments: 20,
                    bounds: [10, 1, 3],
                    rotation: [0, 3.14, 0],
                  },
                  { position: [-2.55, 0.15, -1], rotation: [0, 1.65, 3.14] },
                  { position: [-2.7, 0.15, 0.1], rotation: [3.14, 1.7, 3.14] },
                  { position: [-2, 0.15, 2.4], rotation: [0, -1.1, 0] },
                  { position: [-1, 0.15, 2.75], rotation: [0, -0.4, 0] },
                  { position: [-0.25, 0, 4.2], rotation: [0, -1.9, 0] },
                  {
                    position: [-6.6, 0, 2.0],
                    density: 1,
                    segments: 30,
                    bounds: [10, 1, 5],
                    rotation: [0, 3.14, 0],
                  },
                  {
                    position: [-6.6, 0, -1.5],
                    density: 1,
                    segments: 30,
                    bounds: [10, 1, 5],
                    rotation: [0, 3.14, 0],
                  },
                  {
                    position: [-6.0, 0, -4.8],
                    density: 1,
                    segments: 30,
                    bounds: [10, 1, 5],
                    rotation: [0, 3.14, 0],
                  },
                ]
          }
        />
      </group>
    </>
  )
})

export default SecondaryContent
