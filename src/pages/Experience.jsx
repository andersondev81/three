import { Perf } from "r3f-perf"
import gsap from "gsap"
import React, {
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react"
import { useGLTF, Environment, Sparkles, Html } from "@react-three/drei"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import FountainParticles from "../components/models/FountainParticles"
import Castle from "../components/models/Castle"
import { CastleUi } from "./CastleUi"
import { Flower } from "../components/models/Flower"
import { Pole } from "../components/models/Pole"
import { Stairs } from "../components/models/Stairs"
import { CloudGroup } from "../components/models/CloudsGroup"
import AtmIframe from "../components/models/AtmIframe"
import Orb from "../components/models/Orb"
import { CAMERA_CONFIG } from "../utils/cameraConfig"
import { EffectsTree } from "../components/helpers/EffectsTree"
import EnvMapLoader from "../components/helpers/EnvMapLoader"
import AudioControl from "../components/AudioControl"

// ✅ MOBILE DETECTION
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    return mobileRegex.test(userAgent) || window.innerWidth < 768
  })

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera
      const mobileRegex =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      setIsMobile(mobileRegex.test(userAgent) || window.innerWidth < 768)
    }

    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}

// ✅ CANVAS CONFIG
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

// ✅ CAMERA ANIMATION (mantém igual)
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

      if (section === 0 || section === "intro") {
        animationRef.current.progress += delta * 0.6
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
  }, [section, camera, cameraRef])
}

// ✅ SCENE CONTROLLER
const SceneController = React.memo(({ section, cameraRef, isStarted }) => {
  const { camera } = useThree()
  const [showPerf, setShowPerf] = useState(false)

  // ✅ CAMERA ANIMATION - SÓ QUANDO STARTED
  useCameraAnimation(section, cameraRef, !isStarted) // ✅ Passa isPaused = !isStarted

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

// ✅ PrimaryContent

const PrimaryContent = React.memo(
  ({ activeSection, onSectionChange, isReady, isStarted }) => {
    const groundParams = useRef({
      height: 5,
      radius: 110,
      scale: 100,
    })
    const [forceUpdate, setForceUpdate] = useState(0)
    const animationStartedRef = useRef(false)

    // ✅ DEBUG DETALHADO DOS PROPS
    console.log(
      `🎬 [PrimaryContent] PROPS RECEBIDOS: isReady=${isReady}, isStarted=${isStarted} (${typeof isStarted})`
    )

    // ✅ CONTROLE SUPER RIGOROSO: só anima quando REALMENTE started
    useEffect(() => {
      console.log(
        `🎬 [PrimaryContent] useEffect triggered - isStarted=${isStarted} (${typeof isStarted})`
      )

      // ✅ RESETAR estado se não estiver started (inclui undefined)
      if (!isStarted) {
        console.log(
          "🛑 [PrimaryContent] NÃO STARTED - parando/resetando animações"
        )

        if (animationStartedRef.current && typeof gsap !== "undefined") {
          gsap.killTweensOf(groundParams.current)
          console.log("🛑 [PrimaryContent] GSAP killTweensOf - animação parada")
        }

        // Reset para valores iniciais
        groundParams.current.radius = 110
        groundParams.current.scale = 100
        groundParams.current.height = 5
        animationStartedRef.current = false
        setForceUpdate(prev => prev + 1)
        return
      }

      // ✅ SÓ INICIA se started E ainda não iniciou
      if (isStarted === true && !animationStartedRef.current) {
        console.log(
          "✅ [PrimaryContent] STARTED = true - INICIANDO animações GSAP"
        )
        animationStartedRef.current = true

        if (typeof gsap !== "undefined") {
          gsap.to(groundParams.current, {
            radius: 13,
            duration: 2,
            scale: 22,
            delay: 0,
            ease: "sine.inOut",
            onUpdate: () => {
              setForceUpdate(prev => prev + 1)
            },
            onComplete: () => {
              console.log("✅ [PrimaryContent] Animação GSAP completa")
            },
          })
        }
      }
    }, [isStarted])

    // ✅ LOG para debug
    console.log(
      `🎬 [PrimaryContent] STATUS: isStarted=${isStarted}, animationStarted=${animationStartedRef.current}, radius=${groundParams.current.radius}`
    )

    return (
      <>
        {/* ✅ Environment carrega imediatamente - importante para useProgress */}
        <Environment
          files="/images/CloudsBG.hdr"
          background
          resolution={256}
          ground={{
            height: groundParams.current.height,
            radius: groundParams.current.radius,
            scale: groundParams.current.scale,
          }}
        />
        <Sparkles
          count={80}
          size={Array.from({ length: 25 }, () => 4 + Math.random() * 2)}
          scale={[10, 3, 10]}
          position={[0, 6, 0]}
          speed={0.01}
          color="#ff00ff"
          opacity={0.1}
        />
        <EffectsTree />
        <FountainParticles
          count={80}
          color="lightpink"
          size={0.03}
          speed={0.65}
          spread={0.3}
          layers-enable={2}
          castShadow={false}
          receiveShadow={false}
        />
        {/* ✅ Todos os modelos carregam imediatamente para serem detectados pelo useProgress */}
        <Castle
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          scale={[2, 1.6, 2]}
        />
        <Flower />
        <Stairs />
        <Orb />
        <Pole
          position={[-0.8, 0, 5.8]}
          scale={[0.6, 0.6, 0.6]}
          onSectionChange={onSectionChange}
        />
      </>
    )
  }
)

// ✅ SECONDARY CONTENT - RENDERIZA SEMPRE, ANIMA QUANDO APROPRIADO

const SecondaryContent = React.memo(() => {
  const cloudGroupRef = useRef()
  const { camera } = useThree()
  const isMobile = useMobileDetection()

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

// ✅ SCENE CONTENT - EVITAR PRELOAD DUPLO E CONTROLAR ANIMAÇÕES
const SceneContent = React.memo(
  ({ activeSection, onSectionChange, isReady, isStarted }) => {
    useEffect(() => {
      // ✅ Só faz preload se não veio de LoadingPage
      if (!window.glbAssetsPreloaded) {
        console.log("🔄 [SceneContent] Forçando preload de assets...")

        useGLTF.preload("/models/Castle.glb")
        useGLTF.preload("/models/Flower.glb")
        useGLTF.preload("/models/stairs.glb")
        useGLTF.preload("/models/Orb.glb")
        useGLTF.preload("/models/Pole.glb")

        window.glbAssetsPreloaded = true
        console.log("✅ [SceneContent] Preload iniciado")
      } else {
        console.log("⏭️ [SceneContent] GLBs já pré-carregados")
      }
    }, [])

    return (
      <>
        <PrimaryContent
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          isReady={isReady}
          isStarted={isStarted} // ✅ PASSAR isStarted
        />
        <SecondaryContent
          isReady={isReady}
          isStarted={isStarted} // ✅ PASSAR isStarted
        />
      </>
    )
  }
)

// ✅ EXPERIENCE PRINCIPAL - VERSÃO LIMPA
const Experience = ({ initiallyReady = false, isStarted = false }) => {
  console.log(`🎮 [Experience] Ready: ${initiallyReady}, Started: ${isStarted}`)

  const [currentSection, setCurrentSection] = useState(0)
  const [activeSection, setActiveSection] = useState("intro")
  const cameraRef = useRef(null)
  const isInitialized = useRef(false)

  const isMobile = useMobileDetection()
  const canvasConfig = getCanvasConfig(isMobile)

  // ✅ HANDLERS ESTÁVEIS
  const handleSectionChange = useCallback((index, sectionName) => {
    setCurrentSection(index)
    setActiveSection(sectionName)
  }, [])

  const handleCustomCameraPosition = useCallback((position, target) => {
    if (cameraRef.current?.camera) {
      cameraRef.current.camera.position.set(...position)
      cameraRef.current.camera.lookAt(...target)
      cameraRef.current.camera.updateProjectionMatrix()
    }
  }, [])

  // ✅ INICIALIZAÇÃO ÚNICA
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    console.log("🎮 [Experience] Inicialização única - precarregando assets")

    window.customCameraNavigation = handleCustomCameraPosition
    window.onSectionChange = handleSectionChange

    const handleSectionChangeEvent = event => {
      if (event.detail?.sectionIndex !== undefined) {
        handleSectionChange(event.detail.sectionIndex, event.detail.sectionName)
      }
    }

    window.addEventListener("sectionChange", handleSectionChangeEvent)

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (window.audioManager && window.audioManager.pauseAll) {
          window.audioManager.pauseAll()
        }
      } else {
        if (window.audioManager && window.audioManager.resumeAll) {
          window.audioManager.resumeAll()
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      console.log("🎮 [Experience] Cleanup único")
      window.removeEventListener("sectionChange", handleSectionChangeEvent)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      delete window.customCameraNavigation
      delete window.onSectionChange
    }
  }, [handleSectionChange, handleCustomCameraPosition])

  // ✅ ÁUDIO - só ativar quando started (SEM DELAYS)
  useEffect(() => {
    if (isStarted) {
      console.log("🎵 [Experience] Iniciando áudio IMEDIATAMENTE...")

      // ✅ SEM setTimeout - direto
      if (window.audioManager && window.audioManager.startAmbient) {
        window.audioManager.startAmbient()
      }

      return () => {
        if (window.audioManager && window.audioManager.stopAmbient) {
          window.audioManager.stopAmbient()
        }
      }
    }
  }, [isStarted])

  return (
    <div className="relative w-full h-screen">
      <div className="absolute inset-0 z-0">
        <Canvas {...canvasConfig} className="w-full h-full">
          <SceneController section={currentSection} cameraRef={cameraRef} />
          <SceneContent
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            isReady={true} // ✅ SEMPRE true para carregar assets
          />
        </Canvas>
      </div>

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

      <div className="fixed bottom-4 right-4 z-20">
        <AudioControl />
      </div>
    </div>
  )
}

export default Experience
