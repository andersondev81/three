import { Perf } from "r3f-perf"
import gsap from "gsap"
import React, {
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react"
import {
  useGLTF,
  Environment,
  Sparkles,
  useMask,
  Html,
} from "@react-three/drei"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import FountainParticles from "../components/FountainParticles"
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

/**
 * Mobile detection hook - detects if device is mobile based on userAgent and screen size
 * @returns {boolean} true if device is mobile
 */
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

/**
 * Canvas configuration based on device type
 * @param {boolean} isMobile - Flag indicating if device is mobile
 * @returns {Object} Canvas configuration
 */
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

/**
 * Hook for camera animation between sections
 * @param {string|number} section - Current section
 * @param {React.RefObject} cameraRef - Reference to camera
 */
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

      // Adjust speed based on section
      if (section === 0 || section === "intro") {
        // Speed for introduction
        animationRef.current.progress += delta * 0.6 // Slower
      } else {
        // Normal speed for other sections
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
    // Function to preload all resources (textures, videos, audio)
    const preloadResources = async () => {
      try {
        // 1. Preload critical textures
        await preloadTextures()

        // 3. Preload videos
        await preloadVideos()

        // 4. Check 3D models
        await preloadModels()

        // 5. Preload audio files
        await preloadAudio()

        // 6. Notify that we're ready to start
        if (!hasNotifiedRef.current) {
          console.log("✅ Notifying App that it's ready to start")
          if (window.onExperienceLoaded) {
            window.onExperienceLoaded()
            hasNotifiedRef.current = true
          }
        }
      } catch (error) {
        console.error("Error during resource loading:", error)

        // Even with errors, notify as "ready" to avoid UI freezes
        if (!hasNotifiedRef.current) {
          console.log("⚠️ Notifying App despite loading errors")
          if (window.onExperienceLoaded) {
            window.onExperienceLoaded()
            hasNotifiedRef.current = true
          }
        }
      }
    }

    // Function to preload textures
    const preloadTextures = async () => {
      // Complete list of critical textures from Castle and other components
      const texturePaths = [
        // Environment maps
        "/images/bg1.jpg",
        "/images/studio.jpg",
        "/images/clouds.jpg",

        // Castle textures
        "/texture/castleColor.avif",
        "/texture/castleRoughnessV1.avif",
        "/texture/castleMetallicV1.avif",
        "/texture/castleHeart_Base_colorAO.avif",
        "/texture/castleLights_Emissive.avif",
        "/texture/GodsWallColor.avif",
        "/texture/castleGodsWall_Roughness.avif",
        "/texture/WallsColor.avif",
        "/texture/Walls_Roughness.avif",
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

        // Flower textures
        "/texture/FlowersColor.avif",
        "/texture/Flowers_Normal.avif",
        "/texture/Flowers_Alpha.avif",

        // Orb textures
        "/texture/Orb_AlphaV1.avif",
        "/texture/Orb_Alpha.avif",
        "/texture/OrbBake_Emissive.avif",

        // Pole textures
        "/texture/PoleColor.avif",
        "/texture/Pole_Metallic.avif",
        "/texture/Pole_Roughness.avif",
        "/texture/heartColor.avif",
        "/texture/HeartPoleEmissive.avif",
      ]

      // Create texture loader
      const textureLoader = new THREE.TextureLoader()

      // Function to load a texture with timeout
      const loadTextureWithTimeout = path => {
        return new Promise((resolve, reject) => {
          // 10 second timeout for each texture
          const timeoutId = setTimeout(() => {
            console.warn(`Timeout loading texture: ${path}`)
            resolve(null) // Resolve with null instead of rejecting
          }, 10000)

          textureLoader.load(
            path,
            texture => {
              clearTimeout(timeoutId)
              resolve(texture)
            },
            undefined, // progress callback
            error => {
              clearTimeout(timeoutId)
              console.error(`Error loading texture ${path}:`, error)
              resolve(null) // Resolve with null instead of rejecting
            }
          )
        })
      }

      // Load all textures with timeout
      console.log("🔄 Starting critical texture loading...")
      const texturePromises = texturePaths.map(path =>
        loadTextureWithTimeout(path)
      )
      const textures = await Promise.all(texturePromises)

      // Check results
      const loadedCount = textures.filter(t => t !== null).length
      console.log(`✅ Loaded ${loadedCount} of ${texturePaths.length} textures`)
    }

    // Function to preload videos
    const preloadVideos = async () => {
      const videoPaths = ["/video/tunnel.mp4", "/video/water.mp4"]

      const loadVideoWithTimeout = path => {
        return new Promise((resolve, reject) => {
          const video = document.createElement("video")
          video.preload = "auto"
          video.muted = true
          video.playsInline = true // Important for iOS

          const timeoutId = setTimeout(() => {
            console.warn(`Timeout loading video: ${path}`)
            resolve(null)
          }, 15000)

          video.oncanplaythrough = () => {
            clearTimeout(timeoutId)
            resolve(video)
          }

          video.onerror = error => {
            clearTimeout(timeoutId)
            console.error(`Error loading video ${path}:`, error)
            resolve(null)
          }

          video.src = path
          video.load()
        })
      }

      console.log("🔄 Starting critical video loading...")
      const videoPromises = videoPaths.map(path => loadVideoWithTimeout(path))
      const videos = await Promise.all(videoPromises)

      const loadedCount = videos.filter(v => v !== null).length
      console.log(`✅ Loaded ${loadedCount} of ${videoPaths.length} videos`)
    }

    // Function to preload 3D models
    const preloadModels = async () => {
      try {
        const modelPaths = [
          "/models/Castle.glb",
          "/models/Flower.glb",
          "/models/Orbit.glb",
          "/models/Pole.glb",
        ]

        console.log("🔄 Checking 3D models...")

        // Check if files exist using fetch
        const checkPromises = modelPaths.map(async path => {
          try {
            const response = await fetch(path, { method: "HEAD" })
            if (response.ok) {
              console.log(`✅ Model verified: ${path}`)
              return path
            } else {
              console.warn(`⚠️ Model not found: ${path}`)
              return null
            }
          } catch (error) {
            console.warn(`⚠️ Error checking model ${path}:`, error)
            return null
          }
        })

        await Promise.all(checkPromises)
      } catch (error) {
        console.warn("⚠️ Error checking models:", error)
        // Don't fail execution, just log the warning
      }
    }

    // Function to preload audio files
    const preloadAudio = async () => {
      try {
        // List of audio files to preload - ADJUST PATHS BASED ON YOUR PROJECT STRUCTURE
        const audioPaths = [
          // Specific element sounds
          "/sounds/atmambiance.mp3",
          "/sounds/camerawoosh.MP3",
          "/sounds/daingcoachmirror.MP3",
          "/sounds/fountain.mp3",
          "/sounds/orb.mp3",
          "/sounds/roadmapscroll.mp3",
          "/sounds/templeambiance.mp3",
        ]

        // On mobile, limit the number of audio files to preload to save bandwidth
        const pathsToLoad = isMobile
          ? audioPaths.slice(0, 5) // Load only the most important sounds on mobile
          : audioPaths

        console.log("🔄 Starting audio files loading...")

        const loadAudioWithTimeout = path => {
          return new Promise(resolve => {
            // Skip audio preloading on some mobile browsers that don't support it well
            if (isMobile && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
              // Just verify file exists but don't preload on iOS
              console.log(`⏩ Skipping audio preload on iOS: ${path}`)
              resolve(null)
              return
            }

            const audio = new Audio()

            // Shorter timeout on mobile to avoid blocking the UI
            const timeout = isMobile ? 8000 : 15000

            const timeoutId = setTimeout(() => {
              console.warn(`Timeout loading audio: ${path}`)
              resolve(null)
            }, timeout)

            audio.addEventListener(
              "canplaythrough",
              () => {
                clearTimeout(timeoutId)
                console.log(`✅ Audio loaded: ${path}`)
                resolve(audio)
              },
              { once: true }
            )

            audio.addEventListener(
              "error",
              error => {
                clearTimeout(timeoutId)
                console.error(`Error loading audio ${path}:`, error)
                resolve(null)
              },
              { once: true }
            )

            audio.preload = "auto"
            audio.src = path
            audio.load()
          })
        }

        // Verify which files exist before attempting to load them
        const checkPromises = pathsToLoad.map(async path => {
          try {
            const response = await fetch(path, { method: "HEAD" })
            if (response.ok) {
              return path
            } else {
              console.warn(`⚠️ Audio file not found: ${path}`)
              return null
            }
          } catch (error) {
            console.warn(`⚠️ Error checking audio ${path}:`, error)
            return null
          }
        })

        // Filter valid paths
        const validPaths = (await Promise.all(checkPromises)).filter(
          path => path !== null
        )

        // Load audio files that exist
        const audioPromises = validPaths.map(path => loadAudioWithTimeout(path))
        const audios = await Promise.all(audioPromises)

        // Count successfully loaded files
        const loadedCount = audios.filter(a => a !== null).length
        console.log(
          `✅ Loaded ${loadedCount} of ${validPaths.length} audio files`
        )

        // Cache preloaded audio for future use
        if (window.audioCache === undefined) {
          window.audioCache = {}
        }

        // Store loaded audio in cache with filenames as keys
        validPaths.forEach((path, index) => {
          if (audios[index] !== null) {
            const filename = path.split("/").pop().split(".")[0]
            window.audioCache[filename] = audios[index]
          }
        })

        // Update AudioManager to use preloaded audio if available
        if (window.audioManager) {
          console.log("✅ Updating AudioManager with preloaded audio files")

          // Add method to use preloaded audio files if not already available
          if (!window.audioManager.getPreloadedAudio) {
            window.audioManager.getPreloadedAudio = function (soundName) {
              if (window.audioCache && window.audioCache[soundName]) {
                // Return a clone of the cached audio to allow simultaneous playback
                return window.audioCache[soundName].cloneNode()
              }
              return null
            }
          }

          // Patch the play method to check cache first if not already patched
          const originalPlay = window.audioManager.play
          if (originalPlay && !window.audioManager._patched) {
            window.audioManager._patched = true
            window.audioManager.play = function (soundName, options) {
              // Try to get preloaded audio first
              const preloadedAudio = this.getPreloadedAudio(soundName)
              if (preloadedAudio) {
                // Configure the audio
                if (options) {
                  if (options.volume !== undefined)
                    preloadedAudio.volume = options.volume
                  if (options.loop !== undefined)
                    preloadedAudio.loop = options.loop
                }
                // Play it
                preloadedAudio
                  .play()
                  .catch(e => console.error("Audio play error:", e))
                return preloadedAudio
              }

              // Fall back to original method if preloaded audio not available
              return originalPlay.call(this, soundName, options)
            }
          }
        }
      } catch (error) {
        console.warn("⚠️ Error during audio preloading:", error)
        // Don't fail execution, just log the warning
      }
    }

    // Start preloading
    preloadResources()
  }, [isMobile])

  return null
})

/**
 * Scene Controller Component
 * Manages camera and debug tools
 */
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

/**
 * Primary Content of the scene - main elements
 */
const PrimaryContent = React.memo(
  ({ activeSection, onSectionChange, isReady }) => {
    const groundParams = useRef({
      height: 5,
      radius: 110,
      scale: 100,
    })

    const [forceUpdate, setForceUpdate] = useState(0)

    // Start animations when scene is ready
    useEffect(() => {
      if (isReady && typeof gsap !== "undefined") {
        console.log("Starting Environment Animation")

        gsap.to(groundParams.current, {
          radius: 13,
          scale: 22,
          duration: 2,
          delay: 0,
          ease: "sine.inOut",
          onUpdate: () => {
            setForceUpdate(prev => prev + 1)
          },
          onComplete: () => {
            console.log("Animation completed!")
          },
        })
      }
    }, [isReady])

    return (
      <>
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
        <Castle activeSection={activeSection} scale={[2, 1.6, 2]} />
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

/**
 * Secondary Content of the scene - clouds and lighting
 */
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
            // Reduce cloud count on mobile for better performance
            isMobile
              ? [
                  // Basic clouds for mobile - fewer and simpler
                  { position: [-0.1, 0, 4.3], fade: 20 },
                  {
                    position: [0, 0, 4.5],
                    segments: 15, // Reduced segments
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
                  // Limited far clouds
                  {
                    position: [0, 0, 5.6],
                    density: 0.7, // Lower density
                    segments: 20, // Fewer segments
                    bounds: [10, 1, 6],
                  },
                ]
              : [
                  // Full cloud set for desktop
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
                ]
          }
        />
      </group>
    </>
  )
})

/**
 * Tertiary Content of the scene - additional elements
 */
const TertiaryContent = React.memo(() => <MirrorIframe />)

/**
 * Wrapper for all scene content
 */
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

/**
 * Main Experience Component
 * @param {Object} props - Component props
 * @param {boolean} props.initiallyReady - Flag indicating if the scene is initially ready
 */
const Experience = ({ initiallyReady = false }) => {
  const [currentSection, setCurrentSection] = useState(0)
  const [activeSection, setActiveSection] = useState("intro")
  const [isReady, setIsReady] = useState(initiallyReady)
  const cameraRef = useRef(null)

  const isMobile = useMobileDetection()
  const canvasConfig = getCanvasConfig(isMobile)

  // Section change handler
  const handleSectionChange = useCallback((index, sectionName) => {
    setCurrentSection(index)
    setActiveSection(sectionName)
  }, [])

  // Custom camera position handler
  const handleCustomCameraPosition = useCallback((position, target) => {
    if (cameraRef.current?.camera) {
      cameraRef.current.camera.position.set(...position)
      cameraRef.current.camera.lookAt(...target)
      cameraRef.current.camera.updateProjectionMatrix()
    }
  }, [])

  // Global events setup and audio initialization
  useEffect(() => {
    // Setup global event handlers
    window.customCameraNavigation = handleCustomCameraPosition
    window.onSectionChange = handleSectionChange

    const handleSectionChangeEvent = event => {
      if (event.detail?.sectionIndex !== undefined) {
        handleSectionChange(event.detail.sectionIndex, event.detail.sectionName)
      }
    }

    window.addEventListener("sectionChange", handleSectionChangeEvent)

    // Initialize if already ready
    if (initiallyReady && !isReady) {
      setIsReady(true)

      // Start audio when everything is ready
      if (window.audioManager && window.audioManager.startAmbient) {
        setTimeout(() => {
          window.audioManager.startAmbient()
        }, 100)
      }
    }

    // Handle page visibility changes (pause audio and animations when page is hidden)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause audio and heavy animations
        if (window.audioManager && window.audioManager.pauseAll) {
          window.audioManager.pauseAll()
        }
      } else {
        // Page is visible again, resume audio
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

      // Stop audio when component unmounts
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

      {/* User Interface */}
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
