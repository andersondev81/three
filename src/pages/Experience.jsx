import { Perf } from "r3f-perf"
import gsap from "gsap"
import React, {
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react"
import { useGLTF, Environment, Sparkles, useMask } from "@react-three/drei"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import * as THREE from "three"

import Castle from "../assets/models/Castle"
import { CastleUi } from "../assets/models/CastleUi"
import { Flower } from "../assets/models/Flower"
import { Pole } from "../assets/models/Pole"
import { Stairs } from "../assets/models/Stairs"
import { CloudGroup } from "../assets/models/CloudsGroup"
import AtmIframe from "../assets/models/AtmIframe"
import MirrorIframe from "../assets/models/MirrorIframe"
import Orb from "../assets/models/Orb"

import { CAMERA_CONFIG } from "../components/cameraConfig"
import { EffectsTree } from "../components/helpers/EffectsTree"
import EnvMapLoader from "../components/helpers/EnvMapLoader"

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
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

// Canvas Configuration
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
    position: [15.9, 6.8, -11.4],
  },
  shadows: !isMobile,
})

// Camera Animation Hook
const useCameraAnimation = (section, cameraRef) => {
  const { camera } = useThree()
  const animationRef = React.useRef({
    progress: 0,
    isActive: false,
    startPosition: new THREE.Vector3(),
    startFov: 50,
    lastTime: 0,
    config: null,
  })

  useEffect(() => {
    if (!camera) return

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
      if (window.blockAllCameraMovement || !animationRef.current.isActive)
        return

      const { startPosition, startFov, config } = animationRef.current
      const delta = Math.min((now - animationRef.current.lastTime) / 1000, 0.1)
      animationRef.current.lastTime = now
      animationRef.current.progress += delta * 1.5

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
  }, [section, camera, cameraRef])
}

// Scene Controller Component
const SceneController = React.memo(({ section, cameraRef }) => {
  const { camera } = useThree()
  useCameraAnimation(section, cameraRef)

  useEffect(() => {
    window.threeCamera = camera

    return () => {
      delete window.threeCamera
    }
  }, [camera])

  return (
    <>
      <EnvMapLoader />
      {process.env.NODE_ENV !== "production" && <Perf position="top-left" />}
    </>
  )
})

// Scene Content Components
const PrimaryContent = React.memo(({ activeSection, onSectionChange }) => {
  const groundParams = useRef({
    height: 5,
    radius: 100,
    scale: 100,
  })

  const [forceUpdate, setForceUpdate] = useState(0)

  useEffect(() => {
    if (typeof gsap !== "undefined") {
      console.log("Start Environment Animation")

      gsap.to(groundParams.current, {
        radius: 10,
        duration: 1,
        delay: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          setForceUpdate(prev => prev + 1)
        },
        onComplete: () => {
          console.log("Animação concluída!")
        },
      })
    }
  }, [])

  return (
    <>
      <Environment
        key={`env-${forceUpdate}`}
        files="/images/CloudsBG1.hdr"
        background
        resolution={256}
        ground={{
          height: groundParams.current.height,
          radius: groundParams.current.radius,
          scale: groundParams.current.scale,
        }}
      />
      <EffectsTree />
      <Castle activeSection={activeSection} scale={[2, 1.6, 2]} />
      <Stairs />
      <Orb />
    </>
  )
})

const SecondaryContent = React.memo(({ loadedAssets }) => {
  const cloudGroupRef = useRef()
  const { camera } = useThree()

  useFrame(() => {
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
          clouds={[
            //Front clouds
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
            //far front
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
            // right side
            { position: [0.2, 0, 3.95], rotation: [0, 1.7, 3.3] },
            { position: [1.6, 0.2, 2.6], rotation: [0, 0.15, 0] },
            { position: [2.05, 0.15, 2.2], rotation: [0, 1, 0] },
            { position: [2.65, 0.15, 1.1], rotation: [0, 1.7, 0] },
            { position: [2.8, 0.1, -0.6], rotation: [0, 1.4, 0] },
            // far right
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
            // rear side
            { position: [2.9, 0.15, -2.0], rotation: [0, 2, 0] },
            { position: [1.4, 0.2, -3.35], rotation: [3.14, 0.15, 0] },
            { position: [-0.1, 0.2, -3.45], rotation: [3.14, 0, 0] },
            { position: [-1.5, 0.2, -3.35], rotation: [3.14, -0.1, 0] },
            { position: [-1.75, 0.15, -2.55], rotation: [0, 0.8, 0] },
            // far back
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
            //{ position: [3.5, 0, -10.0], density:1, segments: 20, bounds: [8,1,6], rotation: [0, 5.2, 0]  },
            //{ position: [-3.5, 0, -9.0], density:1, segments: 30, bounds: [10,1,6], rotation: [0, 3.14, 0]  },
            //left side
            { position: [-2.55, 0.15, -1], rotation: [0, 1.65, 3.14] },
            { position: [-2.7, 0.15, 0.1], rotation: [3.14, 1.7, 3.14] },
            { position: [-2, 0.15, 2.4], rotation: [0, -1.1, 0] },
            { position: [-1, 0.15, 2.75], rotation: [0, -0.4, 0] },
            { position: [-0.25, 0, 4.2], rotation: [0, -1.9, 0] },
            // far left
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
          ]}
        />
      </group>
    </>
  )
})

const TertiaryContent = React.memo(() => <MirrorIframe />)

// Scene Content Wrapper
const SceneContent = React.memo(({ activeSection, onSectionChange }) => {
  return (
    <>
      <PrimaryContent
        activeSection={activeSection}
        onSectionChange={onSectionChange}
      />
      <SecondaryContent />
      <TertiaryContent />
    </>
  )
})

// Main Experience Component
const Experience = () => {
  const [currentSection, setCurrentSection] = useState(0)
  const [activeSection, setActiveSection] = useState("intro")
  const cameraRef = useRef(null)

  const isMobile = useMobileDetection()
  const canvasConfig = getCanvasConfig(isMobile)

  // Handler para mudança de seção
  const handleSectionChange = useCallback((index, sectionName) => {
    setCurrentSection(index)
    setActiveSection(sectionName)
  }, [])

  // Handler para posicionamento personalizado da câmera
  const handleCustomCameraPosition = useCallback((position, target) => {
    if (cameraRef.current?.camera) {
      cameraRef.current.camera.position.set(...position)
      cameraRef.current.camera.lookAt(...target)
      cameraRef.current.camera.updateProjectionMatrix()
    }
  }, [])

  // Setup de eventos globais
  useEffect(() => {
    window.customCameraNavigation = handleCustomCameraPosition
    window.onSectionChange = handleSectionChange

    const handleSectionChangeEvent = event => {
      if (event.detail?.sectionIndex !== undefined) {
        handleSectionChange(event.detail.sectionIndex, event.detail.sectionName)
      }
    }

    window.addEventListener("sectionChange", handleSectionChangeEvent)

    // Iniciar áudio ambiente se necessário
    if (window.audioManager && window.audioManager.startAmbient) {
      window.audioManager.startAmbient()
    }

    return () => {
      window.removeEventListener("sectionChange", handleSectionChangeEvent)
      delete window.customCameraNavigation
      delete window.onSectionChange

      // Parar áudio quando o componente for desmontado
      if (window.audioManager && window.audioManager.stopAmbient) {
        window.audioManager.stopAmbient()
      }
    }
  }, [handleSectionChange, handleCustomCameraPosition])

  return (
    <div className="relative w-full h-screen">
      <div className="absolute inset-0 z-0">
        <Canvas {...canvasConfig} className="w-full h-full">
          <SceneController section={currentSection} cameraRef={cameraRef} />
          <SceneContent
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
        </Canvas>
      </div>

      {/* Interface do usuário */}
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
