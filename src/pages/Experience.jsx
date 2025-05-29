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
import MirrorIframe from "../components/models/MirrorIframe"
import Orb from "../components/models/Orb"
import { CAMERA_CONFIG } from "../utils/cameraConfig"
import { EffectsTree } from "../components/helpers/EffectsTree"
import EnvMapLoader from "../components/helpers/EnvMapLoader"
import AudioControl from "../components/AudioControl"

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

const ResourcePreloader = React.memo(() => {
  const hasNotifiedRef = useRef(false)
  const isMobile = useMobileDetection()

  useEffect(() => {
    const preloadResources = async () => {
      try {
        await preloadTextures()
        await preloadHDRs()
        await preloadVideos()
        await preloadModels()
        await preloadAudio()

        if (!hasNotifiedRef.current) {
          if (window.onExperienceLoaded) {
            window.onExperienceLoaded()
            hasNotifiedRef.current = true
          }
        }
      } catch (error) {
        if (!hasNotifiedRef.current) {
          if (window.onExperienceLoaded) {
            window.onExperienceLoaded()
            hasNotifiedRef.current = true
          }
        }
      }
    }

    const preloadTextures = async () => {
      const texturePaths = [
        "/images/bg1.jpg",
        "/images/studio.jpg",
        "/images/clouds.jpg",
        "/texture/castleColor.avif",
        "/texture/castleRoughnessV1.avif",
        "/texture/castleMetallicV1.avif",
        "/texture/castleHeart_Base_colorAO.avif",
        "/texture/castleLights_Emissive.avif",
        "/texture/GodsWallColor.avif",
        "/texture/castleGodsWall_Roughness.avif",
        "/texture/WallsColor.avif",
        "/texture/floor_Roughness.avif",
        "/texture/PilarsColor.avif",
        "/texture/castlePilars_Roughness.avif",
        "/texture/castlePilars_Metallic.avif",
        "/texture/castlePilars_Emissive.avif",
        "/texture/floorAO.avif",
        "/texture/floorHeart_Metallic.avif",
        "/texture/floorHeartColor.avif",
        "/texture/floorHeart_Roughness.avif",
        "/texture/floorHeart_Emissive.avif",
        "/texture/wingsColor_.avif",
        "/texture/wingsRoughness.avif",
        "/texture/godsColorAO.avif",
        "/texture/hoofGlassColorBAO.avif",
        "/texture/hoofGlassEmissiveV2.avif",
        "/texture/atmBake1.avif",
        "/texture/atmMetallicV1.avif",
        "/texture/atmEmissive.avif",
        "/texture/ScrollColorV1.avif",
        "/texture/FlowersColor.avif",
        "/texture/Flowers_Normal.avif",
        "/texture/Flowers_Alpha.avif",
        "/texture/Orb_AlphaV1.avif",
        "/texture/Orb_Alpha.avif",
        "/texture/OrbBake_Emissive.avif",
        "/texture/PoleColor.avif",
        "/texture/Pole_Metallic.avif",
        "/texture/Pole_Roughness.avif",
        "/texture/heartColor.avif",
        "/texture/HeartPoleEmissive.avif",
      ]

      const textureLoader = new THREE.TextureLoader()

      const loadTextureWithTimeout = path => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            resolve(null)
          }, 10000)

          textureLoader.load(
            path,
            texture => {
              clearTimeout(timeoutId)
              resolve(texture)
            },
            undefined,
            error => {
              clearTimeout(timeoutId)
              resolve(null)
            }
          )
        })
      }

      const texturePromises = texturePaths.map(path =>
        loadTextureWithTimeout(path)
      )
      await Promise.all(texturePromises)
    }

    const preloadHDRs = async () => {
      try {
        const hdrs = ["/images/CloudsBG.hdr"]

        const checkPromises = hdrs.map(async path => {
          try {
            const response = await fetch(path, { method: "HEAD" })
            if (response.ok) {
              return path
            } else {
              return null
            }
          } catch (error) {
            return null
          }
        })

        await Promise.all(checkPromises)
      } catch (error) {}
    }

    const preloadVideos = async () => {
      const videoPaths = ["/video/tunnel.mp4", "/video/water.mp4"]

      const loadVideoWithTimeout = path => {
        return new Promise((resolve, reject) => {
          const video = document.createElement("video")
          video.preload = "auto"
          video.muted = true
          video.playsInline = true

          const timeoutId = setTimeout(() => {
            resolve(null)
          }, 15000)

          video.oncanplaythrough = () => {
            clearTimeout(timeoutId)
            resolve(video)
          }

          video.onerror = error => {
            clearTimeout(timeoutId)
            resolve(null)
          }

          video.src = path
          video.load()
        })
      }

      const videoPromises = videoPaths.map(path => loadVideoWithTimeout(path))
      await Promise.all(videoPromises)
    }

    const preloadModels = async () => {
      try {
        const modelPaths = [
          "/models/Castle.glb",
          "/models/Flower.glb",
          "/models/Orbit.glb",
          "/models/Pole.glb",
        ]

        const checkPromises = modelPaths.map(async path => {
          try {
            const response = await fetch(path, { method: "HEAD" })
            if (response.ok) {
              return path
            } else {
              return null
            }
          } catch (error) {
            return null
          }
        })

        await Promise.all(checkPromises)
      } catch (error) {}
    }

    const preloadAudio = async () => {
      try {
        const audioPaths = [
          "/sounds/atmambiance.mp3",
          "/sounds/camerawoosh.MP3",
          "/sounds/daingcoachmirror.MP3",
          "/sounds/fountain.mp3",
          "/sounds/orb.mp3",
          "/sounds/roadmapscroll.mp3",
          "/sounds/templeambiance.mp3",
        ]

        const pathsToLoad = isMobile ? audioPaths.slice(0, 5) : audioPaths

        const loadAudioWithTimeout = path => {
          return new Promise(resolve => {
            if (isMobile && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
              resolve(null)
              return
            }

            const audio = new Audio()

            const timeout = isMobile ? 8000 : 15000

            const timeoutId = setTimeout(() => {
              resolve(null)
            }, timeout)

            audio.addEventListener(
              "canplaythrough",
              () => {
                clearTimeout(timeoutId)
                resolve(audio)
              },
              { once: true }
            )

            audio.addEventListener(
              "error",
              error => {
                clearTimeout(timeoutId)
                resolve(null)
              },
              { once: true }
            )

            audio.preload = "auto"
            audio.src = path
            audio.load()
          })
        }

        const checkPromises = pathsToLoad.map(async path => {
          try {
            const response = await fetch(path, { method: "HEAD" })
            if (response.ok) {
              return path
            } else {
              return null
            }
          } catch (error) {
            return null
          }
        })

        const validPaths = (await Promise.all(checkPromises)).filter(
          path => path !== null
        )

        const audioPromises = validPaths.map(path => loadAudioWithTimeout(path))
        await Promise.all(audioPromises)

        if (window.audioCache === undefined) {
          window.audioCache = {}
        }

        validPaths.forEach((path, index) => {
          if (audios[index] !== null) {
            const filename = path.split("/").pop().split(".")[0]
            window.audioCache[filename] = audios[index]
          }
        })

        if (window.audioManager) {
          if (!window.audioManager.getPreloadedAudio) {
            window.audioManager.getPreloadedAudio = function (soundName) {
              if (window.audioCache && window.audioCache[soundName]) {
                return window.audioCache[soundName].cloneNode()
              }
              return null
            }
          }

          const originalPlay = window.audioManager.play
          if (originalPlay && !window.audioManager._patched) {
            window.audioManager._patched = true
            window.audioManager.play = function (soundName, options) {
              const preloadedAudio = this.getPreloadedAudio(soundName)
              if (preloadedAudio) {
                if (options) {
                  if (options.volume !== undefined)
                    preloadedAudio.volume = options.volume
                  if (options.loop !== undefined)
                    preloadedAudio.loop = options.loop
                }
                preloadedAudio.play().catch(e => {})
                return preloadedAudio
              }

              return originalPlay.call(this, soundName, options)
            }
          }
        }
      } catch (error) {}
    }

    preloadResources()
  }, [isMobile])

  return null
})

const SceneController = React.memo(({ section, cameraRef }) => {
  const { camera } = useThree()
  const [showPerf, setShowPerf] = useState(false)

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

const PrimaryContent = React.memo(
  ({ activeSection, onSectionChange, isReady }) => {
    const groundParams = useRef({
      height: 5,
      radius: 110,
      scale: 100,
    })
    const [forceUpdate, setForceUpdate] = useState(0)
    const isMobile = useMobileDetection()

    useEffect(() => {
      function shouldStartCastleAnimations() {
        return window.shouldStartAnimations === true
      }

      function startAnimations() {
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
          })
        }
      }

      if (isReady && shouldStartCastleAnimations()) {
        startAnimations()
      } else if (isReady) {
        const handleStartAnimations = () => {
          startAnimations()
        }

        window.addEventListener("startAnimations", handleStartAnimations)
        return () => {
          window.removeEventListener("startAnimations", handleStartAnimations)
        }
      }
    }, [isReady])

    return (
      <>
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

const SecondaryContent = React.memo(({ isReady }) => {
  const cloudGroupRef = useRef()
  const { camera } = useThree()
  const isMobile = useMobileDetection()

  useFrame(() => {
    if (!isReady || !window.shouldStartAnimations) return

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

const TertiaryContent = React.memo(() => <MirrorIframe />)

const SceneContent = React.memo(
  ({ activeSection, onSectionChange, isReady }) => {
    return (
      <>
        <ResourcePreloader />
        <PrimaryContent
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          isReady={isReady}
        />
        <SecondaryContent isReady={isReady} />
        <TertiaryContent />
      </>
    )
  }
)

const Experience = ({ initiallyReady = false }) => {
  const [currentSection, setCurrentSection] = useState(0)
  const [activeSection, setActiveSection] = useState("intro")
  const [isReady, setIsReady] = useState(initiallyReady)
  const cameraRef = useRef(null)

  const isMobile = useMobileDetection()
  const canvasConfig = getCanvasConfig(isMobile)

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

  useEffect(() => {
    window.customCameraNavigation = handleCustomCameraPosition
    window.onSectionChange = handleSectionChange

    const handleSectionChangeEvent = event => {
      if (event.detail?.sectionIndex !== undefined) {
        handleSectionChange(event.detail.sectionIndex, event.detail.sectionName)
      }
    }

    window.addEventListener("sectionChange", handleSectionChangeEvent)

    if (initiallyReady && !isReady) {
      setIsReady(true)

      if (window.audioManager && window.audioManager.startAmbient) {
        setTimeout(() => {
          window.audioManager.startAmbient()
        }, 100)
      }
    }

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
      window.removeEventListener("sectionChange", handleSectionChangeEvent)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      delete window.customCameraNavigation
      delete window.onSectionChange

      if (window.audioManager && window.audioManager.stopAmbient) {
        window.audioManager.stopAmbient()
      }
    }
  }, [handleSectionChange, handleCustomCameraPosition, initiallyReady, isReady])

  return (
    <div className="relative w-full h-screen">
      <div className="absolute inset-0 z-0">
        <Canvas {...canvasConfig} className="w-full h-full">
          <SceneController section={currentSection} cameraRef={cameraRef} />
          <SceneContent
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            isReady={isReady}
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
