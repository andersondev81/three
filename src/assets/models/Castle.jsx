import { CameraControls, useGLTF, useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { Select } from "@react-three/postprocessing"
import { button, useControls } from "leva"
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import * as THREE from "three"
import {
  Color,
  DoubleSide,
  LinearFilter,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NearestFilter,
  NormalBlending,
  VideoTexture,
} from "three"
import FountainParticles from "../../components/FountainParticles"
import RotateAxis from "../../components/helpers/RotateAxis"
import AtmIframe from "../models/AtmIframe"
import MirrorIframe from "../models/MirrorIframe"
import ScrollIframe from "../models/ScrolIframe"

import audioManager from "./AudioManager"
const SMALL_SCREEN_THRESHOLD = 768
const TRANSITION_DELAY = 100
window.lastClickedPosition = null

function smoothCameraReturn(position, target) {
  if (!window.controls || !window.controls.current) {
    console.error("No controls available for camera transition")
    return
  }

  // console.log("Smooth transition to position:", position, "target:", target)

  window.controls.current.enabled = true

  setTimeout(() => {
    window.controls.current
      .setLookAt(
        position[0],
        position[1],
        position[2],
        target[0],
        target[1],
        target[2],
        true // true enables animation
      )
      .catch(err => console.error("Camera transition error:", err))
  }, 50)
}
window.lastClickedPositions = {
  mirror: null,
  atm: null,
  scroll: null,
  orb: null,
}

window.smoothCameraReturn = function (position, target) {
  if (!window.controls || !window.controls.current) {
    console.error("No controls available for camera transition")
    return
  }

  // console.log("Smooth transition to position:", position, "target:", target)

  window.controls.current.enabled = true // Important - enable controls first

  setTimeout(() => {
    // Use the exact same method used for section transitions
    window.controls.current
      .setLookAt(
        position[0],
        position[1],
        position[2],
        target[0],
        target[1],
        target[2],
        true // true enables animation
      )
      .catch(err => console.error("Camera transition error:", err))
  }, 50)
}

// Estenda o sistema de navegação para lidar com o Orb também
if (window.navigationSystem) {
  const origClearPositions = window.navigationSystem.clearPositions
  window.navigationSystem.clearPositions = function () {
    // Chame a função original
    if (origClearPositions) origClearPositions()

    // Limpe o array global também
    window.lastClickedPositions = {
      mirror: null,
      atm: null,
      scroll: null,
      orb: null,
    }
    console.log("Cleared all stored positions")
  }

  // Adicione função de limpeza para elementos individuais se ainda não existir
  if (!window.navigationSystem.clearPositionForElement) {
    window.navigationSystem.clearPositionForElement = function (elementId) {
      if (
        window.lastClickedPositions &&
        window.lastClickedPositions[elementId]
      ) {
        delete window.lastClickedPositions[elementId]
        console.log(`Cleared position for ${elementId}`)
      }
    }
  }
}

const NavigationSystem = {
  // Store camera positions for each navigation element
  positions: {},
  // NEW: Track navigation sources
  navigationSources: {},

  // Initialize the system
  init: () => {
    window.navigationSystem = {
      // Store position for any interactive element
      storePosition: (elementId, position, target) => {
        NavigationSystem.positions[elementId] = { position, target }
        audioManager.play("transition")
      },

      // NEW: Track navigation source
      setNavigationSource: (elementId, source) => {
        NavigationSystem.navigationSources[elementId] = source
      },

      // NEW: Get navigation source
      getNavigationSource: elementId => {
        return NavigationSystem.navigationSources[elementId] || "direct"
      },

      // Retrieve position for any element
      getPosition: elementId => {
        return NavigationSystem.positions[elementId]
      },

      // Clear stored positions
      clearPositions: () => {
        NavigationSystem.positions = {}
        // NEW: Also clear navigation sources
        NavigationSystem.navigationSources = {}
      },

      // Clear position for a specific element
      clearPositionForElement: elementId => {
        if (NavigationSystem.positions[elementId]) {
          delete NavigationSystem.positions[elementId]
          console.log(`Cleared position for ${elementId}`)
        }
        // NEW: Also clear navigation source
        if (NavigationSystem.navigationSources[elementId]) {
          delete NavigationSystem.navigationSources[elementId]
        }
      },

      // Handle return navigation
      returnToPosition: (elementId, defaultAction) => {
        const storedPosition = NavigationSystem.positions[elementId]
        const source = NavigationSystem.navigationSources[elementId] || "direct"

        console.log(`Return navigation for ${elementId}, source: ${source}`)

        // If source is pole, we should return to the pole section
        if (source === "pole") {
          if (window.globalNavigation && window.globalNavigation.navigateTo) {
            window.globalNavigation.navigateTo("nav")
            return true
          }
        }

        // Otherwise return to the stored camera position
        if (storedPosition && source === "direct") {
          const { position, target } = storedPosition
          if (window.controls && window.controls.current) {
            // Return camera to stored position
            window.controls.current
              .setLookAt(
                position[0],
                position[1],
                position[2],
                target[0],
                target[1],
                target[2],
                true
              )
              .catch(err => console.error("Camera transition error:", err))
            return true
          }
        }

        // If no stored position or error, use default action
        defaultAction()
        return false
      },
    }
  },

  // Create handlers for interactive elements
  createElementHandlers: (elementId, navigateTo, setActive, isActive) => {
    const handleElementClick = e => {
      e.stopPropagation()

      // Prevent navigation if already active
      if (isActive) return

      // Store current camera position before navigating
      if (window.controls && window.controls.current) {
        try {
          const position = window.controls.current.getPosition()
          const target = window.controls.current.getTarget()

          // Convert to arrays for consistent format
          const posArray = Array.isArray(position)
            ? position
            : [position.x, position.y, position.z]
          const targetArray = Array.isArray(target)
            ? target
            : [target.x, target.y, target.z]

          // Store position
          window.navigationSystem.storePosition(
            elementId,
            posArray,
            targetArray
          )

          window.navigationSystem.setNavigationSource(elementId, "direct")
        } catch (err) {
          console.error(
            `Failed to store camera position for ${elementId}:`,
            err
          )
        }
      }

      // Navigate to target section
      navigateTo()
    }

    const handleElementPointerEnter = e => {
      if (isActive) return
      e.stopPropagation()
      document.body.style.cursor = "pointer"
    }

    const handleElementPointerLeave = e => {
      e.stopPropagation()
      document.body.style.cursor = "default"
    }

    return {
      handleClick: handleElementClick,
      pointerHandlers: {
        onPointerEnter: handleElementPointerEnter,
        onPointerLeave: handleElementPointerLeave,
      },
    }
  },
}

// Initialize the navigation system when the module loads
NavigationSystem.init()

window.globalNavigation = {
  navigateTo: null,
  lastSection: "nav",
  sectionIndices: {
    nav: 0,
    about: 1,
    aidatingcoach: 2,
    download: 3,
    token: 4,
    roadmap: 5,
  },
  reset: function () {
    if (window.resetIframes) {
      window.resetIframes()
    }
  },
  log: function (message) {
    console.log(`[Navigation] ${message}`)
  },
}

const cameraConfig = {
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
    large: {
      nav: [
        -0.1484189177185437, 0.9565803692840462, 6.591986961996083,
        -0.21830679207380707, 1.042078953185994, 0.860456882413919,
      ],
      about: [
        1.936122025766665, 1.1392067925461205, -0.9748917781012864,
        0.4694349273915467, 1.0221643232260371, -0.2668941766080719,
      ],

      aidatingcoach: [
        -2.361710501463067, 1.439377184450022, -1.1825955618240986,
        -0.16561813012505458, 1.5435201358103645, -0.07648364070439503,
      ],

      download: [
        1.936122025766665, 1.1392067925461205, -0.9748917781012864,
        0.4694349273915467, 1.0221643232260371, -0.2668941766080719,
      ],

      token: [
        1.825378771634347, 1.233948744799477, 0.9290349176726579,
        -0.1281470601284271, 0.805001281674392, -0.041739658223842804,
      ],

      roadmap: [
        -2.162176291859386, 1.1693966697832865, 1.1159461725522344,
        0.027134998854945094, 1.177966566007922, -0.17952880154910716,
      ],
      atm: [
        1.374503345207453, 1.441964012122825, 1.68925639812635,
        -0.218306792073807, 1.042078953185994, 0.860456882413919,
      ],
    },
    small: {
      nav: [
        -0.46953619581756645, 1.3516480438889815, 7.21130905852417,
        -1.3224149774642704, 1.6753152120757284, 1.0989767468615808,
      ],
      about: [
        2.3794036621880066, 1.2374886332491917, -1.2579531405441664,
        -0.3255291216311705, 1.3232162748274139, 0.2492021531029873,
      ],
      aidatingcoach: [
        -2.361710501463067, 1.439377184450022, -1.1825955618240986,
        -0.16561813012505458, 1.5435201358103645, -0.07648364070439503,
      ],
      download: [
        1.8562259954731093, 1.1626020325030495, -0.926552435064171,
        1.3674383110764547, 1.1705903196566405, -0.662785847191283,
      ],
      token: [
        1.8820146179692514, 1.256404259704647, 0.95489048583858,
        0.4005218950207079, 0.9552618075887411, 0.24515338785642443,
      ],
      roadmap: [
        -2.27136632232592, 1.219704717323445, 1.185983135275456,
        0.40491971097480645, 0.9891680073777159, -0.4758823817390637,
      ],
      atm: [
        1.374503345207453, 1.441964012122825, 1.68925639812635,
        -0.218306792073807, 1.042078953185994, 0.860456882413919,
      ],
    },
  },
}

const useVideoTexture = videoPath => {
  const [texture, setTexture] = useState(null)
  const videoRef = useRef(null)
  const playAttemptedRef = useRef(false)

  useEffect(() => {
    try {
      const video = document.createElement("video")
      video.src = videoPath
      video.loop = true
      video.muted = true
      video.playsInline = true
      video.crossOrigin = "anonymous"
      video.preload = "auto"
      videoRef.current = video

      // Criar textura somente quando o vídeo estiver pronto
      video.addEventListener("loadeddata", () => {
        try {
          const videoTexture = new VideoTexture(video)
          videoTexture.minFilter = LinearFilter
          videoTexture.magFilter = LinearFilter
          videoTexture.flipY = true
          setTexture(videoTexture)
        } catch (e) {
          console.error("Erro ao criar textura de vídeo:", e)
        }
      })

      // Tratar erros de carregamento
      video.addEventListener("error", e => {
        console.error("Erro ao carregar vídeo:", e)
      })

      // Carregar o vídeo
      video.load()

      // Cleanup
      return () => {
        try {
          if (video && !video.paused) {
            video.pause()
          }
          video.src = ""
          video.load()
          videoRef.current = null
        } catch (e) {
          console.log("Video cleanup error:", e)
        }
        playAttemptedRef.current = false
      }
    } catch (error) {
      console.error("Erro ao inicializar vídeo:", error)
      return () => {}
    }
  }, [videoPath])

  const playVideo = useCallback(() => {
    if (!videoRef.current || playAttemptedRef.current) return

    // Use um setTimeout para garantir que as chamadas de play estejam espaçadas
    setTimeout(() => {
      if (videoRef.current) {
        playAttemptedRef.current = true
        try {
          const playPromise = videoRef.current.play()

          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.log("Video play silently failed:", err)
              playAttemptedRef.current = false
            })
          }
        } catch (e) {
          console.log("Video play error:", e)
          playAttemptedRef.current = false
        }
      }
    }, 100)
  }, [])

  return { texture, playVideo }
}
// ---------------- Castle materials ----------------

// Castle Texture
const useCastleMaterial = () => {
  const textures = useTexture({
    map: "/texture/castleColor.avif",
    roughnessMap: "/texture/castleRoughnessV1.avif",
    metalnessMap: "/texture/castleMetallicV1.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.map,
      roughnessMap: textures.roughnessMap,
      metalnessMap: textures.metalnessMap,
      roughness: 0.2,
      metalness: 0,
      blending: NormalBlending,
      envMap: clouds,
      envMapIntensity: 1,
      side: DoubleSide,
      transparent: false,
    })
  }, [textures, clouds])
}

// Heart Back Wall texure
const useCastleHeartMaterial = (
  metalness = 1.1,
  roughness = 0,
  emissiveIntensity = 0.3,
  emissiveColor = "#ff0000" // Fixed: Corrected hex color from "#0000000" to "#000000"
) => {
  const textures = useTexture({
    map: "/texture/castleHeart_Base_colorAO.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.map,
      side: DoubleSide,
      transparent: false,
      alphaTest: 0.05,
      // Only include roughnessMap if it exists in textures
      ...(textures.roughnessMap && { roughnessMap: textures.roughnessMap }),
      roughness: roughness,
      metalness: metalness,
      // Only include metalnessMap if it exists in textures
      ...(textures.metalnessMap && { metalnessMap: textures.metalnessMap }),
      // Only include emissiveMap if it exists in textures
      ...(textures.emissiveMap && { emissiveMap: textures.emissiveMap }),
      emissive: new Color(emissiveColor),
      emissiveIntensity: emissiveIntensity,
      blending: NormalBlending,
      envMap: clouds,
    })
  }, [textures, metalness, roughness, emissiveIntensity, emissiveColor, clouds])
}

// Castle Heart Mask Material
const useCastleHeartMaskMaterial = () => {
  const clouds = useTexture("/images/studio.jpg")

  useEffect(() => {
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [clouds])

  return useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color("#E8B84E"), // Dourado mais quente
        transparent: false,
        alphaTest: 0.05,
        side: DoubleSide,
        blending: NormalBlending,
        roughness: 0.2, // Rugosidade ligeiramente aumentada
        metalness: 1.5, // Metalness ajustado
        envMap: clouds,
        envMapIntensity: 1.5, // Reflexos mais intensos
        emissive: new Color("#F0D060"), // Cor de emissão mais quente
        emissiveIntensity: 0.3, // Brilho sutil
      }),
    [clouds]
  )
}

// Heart Lights Material
const useCastleLightsMaterial = () => {
  const { emissiveMap } = useTexture({
    emissiveMap: "/texture/castleLights_Emissive.avif",
  })

  return useMemo(
    () =>
      new MeshStandardMaterial({
        emissive: new Color("#fff"),
        emissiveIntensity: 1,
        emissiveMap: emissiveMap,
        side: DoubleSide,
      }),
    [emissiveMap]
  )
}

// Gods Walls Material
const usecastleGodsWallsMaterial = (
  materialType = "standard",
  metalness = 0.6,
  roughness = 1.6
) => {
  const textures = useTexture({
    map: "/texture/GodsWallColor.avif",
    roughnessMap: "/texture/castleGodsWall_Roughness.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(() => {
    // Propriedades base compartilhadas por todos os materiais
    const commonProps = {
      map: textures.map,
      side: DoubleSide,
      transparent: false,
    }

    // Propriedades específicas para materiais que suportam PBR
    const pbrProps = {
      ...commonProps,
      roughnessMap: textures.roughnessMap,
      roughness: roughness,
      metalness: metalness,
      blending: NormalBlending,
      envMap: clouds,
      envMapIntensity: 2.5,
    }

    // Criar o material baseado no tipo selecionado
    switch (materialType) {
      case "physical":
        return new MeshStandardMaterial(pbrProps)
      case "basic":
        return new MeshBasicMaterial({
          ...commonProps,
          color: new Color(0xffffff),
        })
      case "standard":
      default:
        return new MeshStandardMaterial(pbrProps)
    }
  }, [textures, materialType, metalness, roughness, clouds])
}

// Castle Walls Material
const useCastleWallsMaterial = (metalness = 0, roughness = 1) => {
  const textures = useTexture({
    map: "/texture/WallsColor.avif",
    roughnessMap: "/texture/floor_Roughness.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.map,
      roughnessMap: textures.roughnessMap,
      roughness: 0.2,
      blending: NormalBlending,
      envMap: clouds,
      envMapIntensity: 1,
      side: DoubleSide,
      transparent: false,
      alphaTest: 0.05,
    })
  }, [textures, clouds])
}

// Castle Pilars Material
const useCastlePilarsMaterial = (metalness = 0, roughness = 1) => {
  const textures = useTexture({
    map: "/texture/PilarsColor.avif",
    roughnessMap: "/texture/castlePilars_Roughness.avif",
    metalnessMap: "/texture/castlePilars_Metallic.avif",
    emissiveMap: "/texture/castlePilars_Emissive.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.map,
      roughnessMap: textures.roughnessMap,
      metalnessMap: textures.metalnessMap,
      emissiveMap: textures.emissiveMap,
      emissive: new Color(0xe8b84e),
      emissiveIntensity: 2.5,
      roughness: roughness,
      metalness: metalness,
      blending: NormalBlending,
      envMap: clouds,
      envMapIntensity: 1.0,
      side: DoubleSide,
      transparent: false,
      alphaTest: 0.05,
    })
  }, [textures, clouds])
}

// Floor Material
const useFloorMaterial = (metalness = 0, roughness = 1) => {
  const textures = useTexture({
    map: "/texture/floorAO.avif",
    roughnessMap: "/texture/floor_Roughness.avif",
    metalnessMap: "/texture/floorHeart_Metallic.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.map,
      // Only include maps if they exist
      ...(textures.roughnessMap && { roughnessMap: textures.roughnessMap }),
      ...(textures.metalnessMap && { metalnessMap: textures.metalnessMap }),
      roughness: 0.2,
      metalness: 1.3,
      blending: NormalBlending,
      envMap: clouds,
      envMapIntensity: 1,
      side: DoubleSide,
      transparent: false,
      alphaTest: 0.05,
    })
  }, [textures, clouds])
}

//MirrorFrame Material
const useMirrorFrameMaterial = () => {
  const clouds = useTexture("/images/studio.jpg")

  useEffect(() => {
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [clouds])

  return useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        // BASE MATERIAL PROPERTIES
        color: new THREE.Color("#E8B84E"), // Primary gold color (warm golden hue)
        transparent: false, // Material is completely opaque
        alphaTest: 0.05, // Alpha cutoff threshold (for transparency effects)
        side: THREE.DoubleSide, // Renders both front and back faces of polygons
        blending: THREE.NormalBlending, // Standard blending mode for transparency

        // SURFACE CHARACTERISTICS
        roughness: 0, // Perfectly smooth surface (0 = mirror-like)
        metalness: 1, // Fully metallic material (1 = pure metal)

        // ENVIRONMENT REFLECTIONS
        envMap: clouds, // Environment map texture for realistic reflections
        envMapIntensity: 2.2, // Reflection strength (higher = more reflective)

        // EMISSIVE PROPERTIES
        emissive: new THREE.Color("#F0D060"), // Secondary gold color for self-illumination
        emissiveIntensity: 0.1, // Subtle glow effect intensity
      }),
    [clouds] // Adicionado como dependência
  )
}

// Arc Heart Material
const useFloorHeartMaterial = () => {
  const textures = useTexture({
    map: "/texture/floorHeartColor.avif",
    roughnessMap: "/texture/floorHeart_Roughness.avif",
    metalnessMap: "/texture/floorHeart_Metallic.avif",
    emissiveMap: "/texture/floorHeart_Emissive.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(() => {
    return new MeshPhysicalMaterial({
      map: textures.map,
      roughnessMap: textures.roughnessMap,
      metalnessMap: textures.metalnessMap,
      emissiveMap: textures.emissiveMap,
      side: DoubleSide,
      roughness: 0.0,
      metalness: 1.3,
      reflectivity: 0.0,
      emissive: new Color("#578fd7"),
      emissiveIntensity: 5,
      transparent: false,
      blending: NormalBlending,
      envMap: clouds,
      envMapIntensity: 1.0,
      iridescence: 0.0,
    })
  }, [textures, clouds])
}

//wings Material
const useWingsMaterial = () => {
  const textures = useTexture({
    map: "/texture/wingsColor_.avif",
    roughnessMap: "/texture/wingsRoughness.avif",
  })

  const clouds = useTexture("/images/bg1.jpg") // envMap

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds]) // Atualize as dependências

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.map,
        roughnessMap: textures.roughnessMap,
        roughness: 0.2,
        blending: NormalBlending,
        envMap: clouds,
        envMapIntensity: 1,
        side: DoubleSide,
        transparent: false,
        alphaTest: 0.05,
      }),
    [textures, clouds] // Atualize as dependências
  )
}

//Logo Material
const useLogoMaterial = () => {
  const clouds = useTexture("/images/bg1.jpg")

  useEffect(() => {
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [clouds])

  return useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color("#FA3C81"),
        transparent: false,
        alphaTest: 0.05,
        side: DoubleSide,
        blending: NormalBlending,
        roughness: 0.3,
        metalness: 1.3,
        envMap: clouds,
        envMapIntensity: 1.2,
      }),
    [clouds]
  )
}

//Decor Material
const useDecorMaterial = () => {
  // Load environment map texture
  const clouds = useTexture("/images/studio.jpg")

  // Configure environment map
  useEffect(() => {
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [clouds])

  return useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color("#F9DD71"),
        transparent: false,
        alphaTest: 0.05,
        side: DoubleSide,
        blending: NormalBlending,
        roughness: 0,
        metalness: 1.3,
        envMap: clouds,
        envMapIntensity: 2.5,
      }),
    [clouds] // Recreate material when envMap updates
  )
}

//Decor Material
const useBowMaterial = () => {
  // Load environment map texture
  const clouds = useTexture("/images/studio.jpg")

  // Configure environment map
  useEffect(() => {
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [clouds])

  return useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color("#F9DD71"),
        transparent: false,
        alphaTest: 0.05,
        side: DoubleSide,
        blending: NormalBlending,
        roughness: 0,
        metalness: 1.2,
        envMap: clouds,
        envMapIntensity: 1.8,
      }),
    [clouds] // Recreate material when envMap updates
  )
}

//MirrorMaterial
const useMirrorMaterial = () => {
  const clouds = useTexture("/images/clouds.jpg")

  useEffect(() => {
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [clouds])

  return useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color("#a6cce5"),
        transparent: false,
        alphaTest: 0.05,
        side: DoubleSide,
        blending: NormalBlending,
        roughness: 0,
        metalness: 1,
        envMap: clouds,
        envMapIntensity: 2.0,
      }),
    [clouds]
  )
}

//Hallos Material
const useHallosMaterial = () => {
  // Load environment map texture
  const clouds = useTexture("/images/studio.jpg")

  // Configure environment map
  useEffect(() => {
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [clouds])

  return useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        // Base Properties
        color: new THREE.Color("#DABB46"), // Golden yellow color
        transparent: false, // Opaque material
        alphaTest: 0.05, // Alpha cutoff threshold
        side: THREE.DoubleSide, // Render both sides of geometry
        blending: THREE.NormalBlending, // Standard blending mode

        // Surface Characteristics
        roughness: 0.2, // Perfectly smooth surface (mirror-like)
        metalness: 2, // Hyper-metallic effect (values >1 intensify reflections)

        // Reflection Properties
        envMap: clouds, // Environment map for realistic reflections
        envMapIntensity: 2.5, // Strong reflection intensity
        reflectivity: 0, // Base reflectivity coefficient

        // Advanced Effects
        emissive: new THREE.Color("#DABB46").multiplyScalar(0.1), // Subtle glow
        emissiveIntensity: 2, // Controlled self-illumination
      }),
    [clouds] // Recreate material when envMap updates
  )
}

// Gods Material
const useGodsMaterial = () => {
  const textures = useTexture({
    map: "/texture/godsColorAO.avif",
  })

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
        texture.colorSpace = "srgb"
      }
    })
  }, [textures])

  return useMemo(
    () =>
      new MeshBasicMaterial({
        map: textures.map,
        transparent: false,
        alphaTest: 0.5,
        side: DoubleSide,
        blending: NormalBlending,
      }),
    [textures]
  )
}

// Hoof Material
const useHoofMaterial = () => {
  const textures = useTexture({
    map: "/texture/hoofGlassColorBAO.avif",
    emissiveMap: "/texture/hoofGlassEmissiveV2.avif",
  })

  // Carrega o environment map (igual aos outros materiais)
  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    // Configura o envMap
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(
    () =>
      new MeshPhysicalMaterial({
        map: textures.map,
        emissiveMap: textures.emissiveMap,
        emissive: new Color(0x578fd7),
        emissiveIntensity: 8,
        transparent: false,
        side: DoubleSide,
        blending: NormalBlending,
        roughness: 0.2,
        metalness: 1,
        envMap: clouds,
        envMapIntensity: 1.0,
        reflectivity: 0.5,
      }),
    [textures, clouds] // Adicione clouds como dependência
  )
}

//atm Material
const useAtmMaterial = () => {
  const textures = useTexture({
    map: "/texture/atmBake1.avif",
    metalnessMap: "/texture/atmMetallicV1.avif",
    materialEmissive: "/texture/atmEmissive.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.map,
        metalnessMap: textures.metalnessMap,
        emissiveMap: textures.materialEmissive,
        transparent: false,
        side: DoubleSide,
        blending: NormalBlending,
        metalness: 1.5,
        roughness: 0.5,
        emissive: new Color(0xc4627d),
        emissiveIntensity: -0.5,
        envMap: clouds,
        envMapIntensity: 0.8,
      }),
    [textures, clouds] // Added clouds to dependencies
  )
}

//atm Metal Material
const useAtmMetalMaterial = () => {
  const textures = useTexture({
    map: "/texture/atmBake1.avif",
    materialEmissive: "/texture/atmEmissive.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.map,
        //metalnessMap: textures.metalnessMap,
        emissiveMap: textures.materialEmissive,
        transparent: false,
        alphaTest: 0.05,
        side: DoubleSide,
        blending: NormalBlending,
        metalness: 1.3,
        roughness: 0.05,
        emissive: new Color(0xc4627d),
        emissiveIntensity: 7.5,
        envMap: clouds,
        envMapIntensity: 1.5,
      }),
    [textures, clouds]
  )
}

//Scroll Material
const useScrollMaterial = () => {
  const [hasError, setHasError] = useState(false)

  const textures = useTexture(
    hasError
      ? {} // Load nothing if error
      : {
          map: "/texture/ScrollColorV1.avif",
        }
  )

  const clouds = useTexture("/images/bg1.jpg")

  useEffect(() => {
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [clouds])

  useEffect(() => {
    if (!textures.map || textures.map.image === undefined) {
      console.warn("Scroll texture not found. Using fallback material.")
      setHasError(true)
    }
  }, [textures.map])

  if (hasError) {
    return useMemo(
      () =>
        new MeshStandardMaterial({
          color: "#f0e6d2",
          roughness: 0.7,
          metalness: 0.0,
          side: DoubleSide,
          envMap: clouds,
          envMapIntensity: 0.3,
        }),
      [clouds]
    )
  }

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.map,
        roughness: 0.7,
        metalness: 0,
        side: DoubleSide,
        envMap: clouds,
        envMapIntensity: 0.8,
      }),
    [textures, clouds]
  )
}

//Portal Material
const usePortalMaterial = () => {
  return useMemo(() => {
    const video = document.createElement("video")
    video.src = "/video/tunnel.mp4"
    video.loop = true
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    // video.play().catch(e => console.error("Video play failed:", e))

    const videoTexture = new THREE.VideoTexture(video)
    videoTexture.minFilter = THREE.LinearFilter
    videoTexture.magFilter = THREE.LinearFilter
    videoTexture.flipY = false

    return new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide,
      toneMapped: false, // Desativa mapeamento tonal
      fog: false, // Desativa efeito de neblina
      transparent: false, // Totalmente opaco
      alphaTest: 0, // Sem descarte de pixels
      color: new THREE.Color(0xffffff), // Cor base branca neutra
    })
  }, [])
}

// Components -----------------------------------------

const handleAtmClick = e => {
  e.stopPropagation()
  // Prevent navigation if ATM iframe is already active
  if (atmIframeActive) return
  audioManager.play("transition")
  // Navigate to token section
  if (onCastleClick) {
    onCastleClick("token") // Uses the existing playTransition function
  }

  // Log for debugging
  if (window.globalNavigation && window.globalNavigation.log) {
    window.globalNavigation.log("ATM mesh clicked - navigation requested")
  }
}

// Pointer event handlers for visual feedback
const handlePointerEnter = e => {
  if (atmIframeActive) return // Skip if iframe is already active
  e.stopPropagation()
  document.body.style.cursor = "pointer"
}

const handlePointerLeave = e => {
  e.stopPropagation()
  document.body.style.cursor = "default"
}

const CastleModel = ({
  onCastleClick,
  hasInteracted,
  atmIframeActive,
  mirrorIframeActive,
  scrollIframeActive,
  setAtmiframeActive,
  setMirrorIframeActive,
  setScrollIframeActive,
  onPortalPlay,
  onWaterPlay,
  activeSection,
}) => {
  const { nodes } = useGLTF("/models/Castle.glb")
  const material = useCastleMaterial()
  const castleHeart = useCastleHeartMaterial()
  const castleHeartMask = useCastleHeartMaskMaterial()
  const castleLights = useCastleLightsMaterial()
  const castleGodsWalls = usecastleGodsWallsMaterial()
  const castleWalls = useCastleWallsMaterial()
  const castlePilars = useCastlePilarsMaterial()
  const floorMaterial = useFloorMaterial()
  const mirrorFrame = useMirrorFrameMaterial()
  const floorHeart = useFloorHeartMaterial()
  const logoMaterial = useLogoMaterial()
  const decorMaterial = useDecorMaterial()
  const bowMaterial = useBowMaterial()
  const godsMaterial = useGodsMaterial()
  const hoofMaterial = useHoofMaterial()
  const atmMaterial = useAtmMaterial()
  const AtmMetalMaterial = useAtmMetalMaterial()
  const scrollMaterial = useScrollMaterial()
  const portal = usePortalMaterial()
  const mirror = useMirrorMaterial(activeSection)
  const hallosMaterial = useHallosMaterial()

  useFrame(({ camera }) => {
    // Chamar updateSpatialSounds com a posição da câmera a cada frame
    updateSpatialSounds(camera.position)
  })

  // Use the video texture hook for portal
  const { texture: portalTexture, playVideo: playPortal } =
    useVideoTexture("/video/tunnel.mp4")
  const portalMaterial = useMemo(
    () =>
      portalTexture
        ? new MeshBasicMaterial({
            map: portalTexture,
            side: DoubleSide,
          })
        : new MeshBasicMaterial({
            color: 0x000000,
            side: DoubleSide,
          }),
    [portalTexture]
  )

  const mirrorHandlers = NavigationSystem.createElementHandlers(
    "mirror",
    () => onCastleClick("aidatingcoach"),
    setMirrorIframeActive,
    mirrorIframeActive
  )

  const atmHandlers = NavigationSystem.createElementHandlers(
    "atm",
    () => onCastleClick("token"),
    setAtmiframeActive,
    atmIframeActive
  )

  const scrollHandlers = NavigationSystem.createElementHandlers(
    "scroll",
    () => onCastleClick("roadmap"),
    setScrollIframeActive,
    scrollIframeActive
  )

  // Use the video texture hook for water
  const { texture: waterTexture, playVideo: playWater } =
    useVideoTexture("/video/water.mp4")
  const waterMaterial = useMemo(
    () =>
      waterTexture
        ? new MeshBasicMaterial({
            map: waterTexture,
            side: DoubleSide,
            toneMapped: false,
            fog: false,
            transparent: false,
            alphaTest: 0,
            color: new Color(0xffffff),
          })
        : new MeshBasicMaterial({
            color: 0x000000,
            side: DoubleSide,
          }),
    [waterTexture]
  )

  const updateSpatialSounds = cameraPosition => {
    // Verificações de segurança para o AudioManager
    if (!window.audioManager || !window.audioManager.sounds) {
      console.log("AudioManager não disponível")
      return
    }

    // Coordenadas fixas dos elementos
    const orbPosition = { x: 1.76, y: 1.155, z: -0.883 }
    const fountainPosition = { x: 0, y: 0.8, z: 2.406 } // Posição da fonte

    //----- GERENCIAMENTO DO SOM DA ORB -----//

    // Cálculo de distância para o orb
    const dxOrb = cameraPosition.x - orbPosition.x
    const dyOrb = cameraPosition.y - orbPosition.y
    const dzOrb = cameraPosition.z - orbPosition.z
    const distToOrb = Math.sqrt(dxOrb * dxOrb + dyOrb * dyOrb + dzOrb * dzOrb)

    // Distância máxima para o orb
    const maxOrbDistance = 1.5

    // Gerenciar som do orb
    if (window.audioManager.sounds.orb) {
      if (distToOrb < maxOrbDistance) {
        // Cálculo de volume para o orb
        const attenuationOrb = 1 - Math.pow(distToOrb / maxOrbDistance, 3)
        const orbVolume = Math.max(0, 0.2 * attenuationOrb)

        if (orbVolume > 0.05) {
          window.audioManager.sounds.orb.audio.volume = orbVolume

          if (!window.audioManager.sounds.orb.isPlaying) {
            window.audioManager.play("orb")
          }
        } else {
          if (window.audioManager.sounds.orb.isPlaying) {
            window.audioManager.stop("orb")
          }
        }
      } else {
        if (window.audioManager.sounds.orb.isPlaying) {
          window.audioManager.stop("orb")
        }
      }
    }

    //----- GERENCIAMENTO DO SOM DO POLE (POLE) -----//
    const polePosition = { x: 0.2, y: -0.35, z: -0.2 } // Posição do pole

    // Cálculo de distância para o pole
    const dxPole = cameraPosition.x - polePosition.x
    const dyPole = cameraPosition.y - polePosition.y
    const dzPole = cameraPosition.z - polePosition.z
    const distToPole = Math.sqrt(
      dxPole * dxPole + dyPole * dyPole + dzPole * dzPole
    )

    // Distância máxima para o pole
    const maxPoleDistance = 12
    // Gerenciar som do pole
    if (window.audioManager.sounds.pole) {
      // Verificar se está dentro do alcance
      if (distToPole < maxPoleDistance) {
        // Atenuação cúbica para o pole
        const attenuationPole = 1 - Math.pow(distToPole / maxPoleDistance, 3)
        const poleVolume = Math.max(0, 0.2 * attenuationPole)
        // Aplicar volume apenas se for significativo
        if (poleVolume > 0.05) {
          window.audioManager.sounds.pole.audio.volume = poleVolume
          // Iniciar reprodução se não estiver tocando
          if (!window.audioManager.sounds.pole.isPlaying) {
            window.audioManager.play("pole")
          }
        } else {
          // Volume muito baixo, parar o som
          if (window.audioManager.sounds.pole.isPlaying) {
            window.audioManager.stop("pole")
          }
        }
      } else {
        // Fora do alcance, parar o som
        if (window.audioManager.sounds.pole.isPlaying) {
          window.audioManager.stop("pole")
        }
      }
    }
    //----- GERENCIAMENTO DO SOM DA FONTE (FOUNTAIN) -----//
    // Cálculo de distância para a fonte
    const dxFountain = cameraPosition.x - fountainPosition.x
    const dyFountain = cameraPosition.y - fountainPosition.y
    const dzFountain = cameraPosition.z - fountainPosition.z
    const distToFountain = Math.sqrt(
      dxFountain * dxFountain +
        dyFountain * dyFountain +
        dzFountain * dzFountain
    )

    const maxFountainDistance = 3.5

    // Gerenciar som da fonte
    if (window.audioManager.sounds.fountain) {
      // Verificar se está dentro do alcance
      if (distToFountain < maxFountainDistance) {
        const attenuationFountain = 1 - distToFountain / maxFountainDistance

        const fountainVolume = Math.max(0, 0.2 * attenuationFountain)

        if (fountainVolume > 0.02) {
          window.audioManager.sounds.fountain.audio.volume = fountainVolume

          // Iniciar reprodução se não estiver tocando
          if (!window.audioManager.sounds.fountain.isPlaying) {
            window.audioManager.play("fountain")
          }
        } else {
          // Volume muito baixo, parar o som
          if (window.audioManager.sounds.fountain.isPlaying) {
            window.audioManager.stop("fountain")
          }
        }
      } else {
        // Fora do alcance, parar o som
        if (window.audioManager.sounds.fountain.isPlaying) {
          window.audioManager.stop("fountain")
        }
      }
    }
  }

  // Adicione ou atualize o useEffect para garantir que tanto o som do orb quanto
  // o da fonte começam parados
  useEffect(() => {
    // Garantir que os sons começam parados
    if (window.audioManager && window.audioManager.sounds) {
      if (window.audioManager.sounds.orb) {
        window.audioManager.stop("orb")
      }
      if (window.audioManager.sounds.fountain) {
        window.audioManager.stop("fountain")
      }
    }

    // Limpar ao desmontar
    return () => {
      if (window.audioManager && window.audioManager.sounds) {
        if (window.audioManager.sounds.orb) {
          window.audioManager.stop("orb")
        }
        if (window.audioManager.sounds.fountain) {
          window.audioManager.stop("fountain")
        }
      }
    }
  }, [])

  // Adicione este hook useFrame no componente CastleModel
  // IMPORTANTE: Certifique-se de que este é o ÚNICO useFrame que chama updateSpatialSounds!
  useFrame(({ camera }) => {
    // Chamar a função de atualização de som a cada frame
    updateSpatialSounds(camera.position)
  })

  // // Adicione isto no useEffect do CastleModel para garantir que o som sempre começa parado
  // useEffect(() => {
  //   // Garantir que o som da orb começa parado
  //   if (window.audioManager && window.audioManager.sounds && window.audioManager.sounds.orb) {
  //     window.audioManager.stop('orb');
  //   }

  //   // Limpar ao desmontar
  //   return () => {
  //     if (window.audioManager && window.audioManager.sounds && window.audioManager.sounds.orb) {
  //       window.audioManager.stop('orb');
  //     }
  //   };
  // }, []);

  // Depois no useEffect para iniciar a reprodução:
  useEffect(() => {
    if (hasInteracted) {
      playPortal()
      playWater()
    }
  }, [hasInteracted, onPortalPlay])

  // Play videos when user has interacted
  useEffect(() => {
    if (hasInteracted) {
      playPortal()
      playWater()
      if (onPortalPlay) onPortalPlay()
      if (onWaterPlay) onWaterPlay()
    }
  }, [hasInteracted, onPortalPlay, onWaterPlay])

  const wingsMaterial = useWingsMaterial()

  return (
    <group dispose={null}>
      <mesh
        geometry={nodes.castle.geometry}
        material={material}
        layers-enable={1}
        castShadow={false}
        receiveShadow={false}
      />
      <mesh geometry={nodes.castleHeart.geometry} material={castleHeart} />
      <mesh
        geometry={nodes.castleHeartMask.geometry}
        material={castleHeartMask}
      />
      <mesh geometry={nodes.castleLights.geometry} material={castleLights} />
      <mesh
        geometry={nodes.castleGodsWalls.geometry}
        material={castleGodsWalls}
      />
      <mesh geometry={nodes.castleWalls.geometry} material={castleWalls} />
      <mesh geometry={nodes.castlePilars.geometry} material={castlePilars} />
      <mesh geometry={nodes.wings.geometry} material={wingsMaterial} />
      <mesh geometry={nodes.gods.geometry} material={godsMaterial} />
      <mesh geometry={nodes.decor.geometry} material={decorMaterial} />
      <mesh
        geometry={nodes.floor.geometry}
        material={floorMaterial}
        layers-enable={1}
      />
      <mesh geometry={nodes.floorHeart.geometry} material={floorHeart} />
      <mesh geometry={nodes.MirrorFrame.geometry} material={mirrorFrame} />
      <mesh
        geometry={nodes.Mirror.geometry}
        material={mirror}
        onClick={mirrorHandlers.handleClick}
        {...mirrorHandlers.pointerHandlers}
      />
      <mesh
        geometry={nodes.Hallos.geometry}
        material={hallosMaterial}
        layers-enable={2}
      />
      <mesh
        geometry={nodes.hoofGlass.geometry}
        material={hoofMaterial}
        layers-enable={2}
      />
      <mesh
        geometry={nodes.atm.geometry}
        material={atmMaterial}
        layers-enable={2}
        castShadow={false}
        receiveShadow={false}
        onClick={atmHandlers.handleClick}
        {...atmHandlers.pointerHandlers}
      />
      <mesh geometry={nodes.atmMetal.geometry} material={AtmMetalMaterial} />
      <group position={[-0.056, 1.247, -2.117]}>
        <RotateAxis axis="y" speed={0.7} rotationType="euler">
          <mesh
            geometry={nodes.bow.geometry}
            material={bowMaterial}
            castShadow={false}
            receiveShadow={false}
          />
        </RotateAxis>
      </group>
      <group>
        <RotateAxis axis="y" speed={1} rotationType="euler">
          <mesh
            geometry={nodes.LogoCupid.geometry}
            material={logoMaterial}
            position={[0.001, 4.18, -0.006]}
            layers-enable={2}
            castShadow={false}
            receiveShadow={false}
          />
        </RotateAxis>
      </group>
      <mesh
        geometry={nodes.scroll.geometry}
        material={scrollMaterial}
        castShadow={false}
        receiveShadow={false}
        onClick={scrollHandlers.handleClick}
        {...scrollHandlers.pointerHandlers}
      />
      <Select disabled>
        <mesh
          geometry={nodes.HeartVid.geometry}
          material={portalMaterial}
          layers-enable={1}
          castShadow={false}
          receiveShadow={false}
        />
      </Select>
      <mesh
        geometry={nodes.water.geometry}
        material={waterMaterial}
        layers-enable={2}
        castShadow={false}
        receiveShadow={false}
      />
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
      // Fix for the iframes in CastleModel component // For the AtmIframe
      component:
      <AtmIframe
        position={[1.675, 1.185, 0.86]}
        rotation={[1.47, 0.194, -1.088]}
        onReturnToMain={source => {
          setTimeout(() => {
            // Fecha o iframe
            setAtmiframeActive(false)
            audioManager.play("transition")
            if (source === "pole") {
              onCastleClick("nav")
            } else {
              const storedPosition = window.navigationSystem.getPosition("atm")
              if (storedPosition) {
                const { position, target } = storedPosition
                smoothCameraReturn(position, target)
              } else {
                onCastleClick("nav")
              }
            }
          }, 0) // ⬅ 0ms já resolve o conflito de render
        }}
        isActive={atmIframeActive}
      />
      // For the MirrorIframe component:
      <MirrorIframe
        onReturnToMain={source => {
          // Close the iframe first
          setMirrorIframeActive(false)

          // Return to stored position or nav
          setTimeout(() => {
            if (source === "pole") {
              // If coming from pole, go back to nav section
              onCastleClick("nav")
            } else {
              const storedPosition =
                window.navigationSystem.getPosition("mirror")
              if (storedPosition) {
                const { position, target } = storedPosition
                smoothCameraReturn(position, target)
              } else {
                // Fallback to nav if no stored position
                onCastleClick("nav")
              }
            }
          }, 100)
        }}
        isActive={mirrorIframeActive}
      />
      // For the ScrollIframe component:
      <ScrollIframe
        onReturnToMain={source => {
          // Close the iframe first
          setScrollIframeActive(false)

          // Return to stored position or nav
          setTimeout(() => {
            if (source === "pole") {
              // If coming from pole, go back to nav section
              onCastleClick("nav")
            } else {
              const storedPosition =
                window.navigationSystem.getPosition("scroll")
              if (storedPosition) {
                const { position, target } = storedPosition
                smoothCameraReturn(position, target)
              } else {
                // Fallback to nav if no stored position
                onCastleClick("nav")
              }
            }
          }, 100)
        }}
        isActive={scrollIframeActive}
      />
    </group>
  )
}

// Navigation system to handle all interactive elements

const Castle = ({ activeSection }) => {
  const controls = useRef()
  const [atmiframeActive, setAtmiframeActive] = useState(false)
  const [mirrorIframeActive, setMirrorIframeActive] = useState(false)
  const [scrollIframeActive, setScrollIframeActive] = useState(false)
  const [cameraLocked, setCameraLocked] = useState(true)
  const [clipboardMessage, setClipboardMessage] = useState("")

  // Reset function for iframes
  window.resetIframes = () => {
    setAtmiframeActive(false)
    setMirrorIframeActive(false)
    setScrollIframeActive(false)
  }

  const getCameraPosition = section => {
    const isSmallScreen = window.innerWidth < SMALL_SCREEN_THRESHOLD
    const screenType = isSmallScreen ? "small" : "large"

    if (section === "default") {
      return cameraConfig.default[screenType]
    }

    return cameraConfig.sections[screenType][section]
  }

  const playTransition = sectionName => {
    if (!controls.current) return

    // if (window.audioManager) {
    //   console.log("Starting ambient sound from Castle component");
    //   window.audioManager.startAmbient();
    // }

    // Parar sons da seção anterior
    if (activeSection && activeSection !== sectionName) {
      audioManager.stopSectionSounds(activeSection)
    }

    // Reproduzir o som da transição
    // audioManager.play("transition")

    // Após um pequeno atraso, reproduzir o som da nova seção
    setTimeout(() => {
      // Reproduzir o som específico da seção, se existir
      if (audioManager.sounds[sectionName]) {
        audioManager.play(sectionName)
      }

      // Reproduzir sons adicionais específicos para certas seções
      switch (sectionName) {
        case "aidatingcoach":
          // Som do espelho
          if (audioManager.sounds["mirror"]) {
            audioManager.play("mirror")
          }
          break
        case "token":
          // Som do ATM/moedas
          if (audioManager.sounds["atm"]) {
            audioManager.play("atm")
          }
          if (audioManager.sounds["coins"]) {
            audioManager.play("coins")
          }
          break
        case "roadmap":
          // Som do pergaminho/papel
          if (audioManager.sounds["scroll"]) {
            audioManager.play("scroll")
          }
          if (audioManager.sounds["paper"]) {
            audioManager.play("paper")
          }
          break
      }
    }, 300) // Pequeno atraso para não sobrepor o som de transição

    // Update iframe active states based on section
    if (sectionName === "roadmap") {
      setScrollIframeActive(true)
      setAtmiframeActive(false)
      setMirrorIframeActive(false)
    } else if (sectionName === "token" || sectionName === "atm") {
      setAtmiframeActive(true)
      setScrollIframeActive(false)
      setMirrorIframeActive(false)
    } else if (sectionName === "aidatingcoach") {
      setMirrorIframeActive(true)
      setScrollIframeActive(false)
      setAtmiframeActive(false)
    } else {
      setScrollIframeActive(false)
      setAtmiframeActive(false)
      setMirrorIframeActive(false)
    }

    controls.current.enabled = true

    const targetPosition = getCameraPosition(
      sectionName === "default" ? "default" : sectionName
    )

    if (targetPosition) {
      controls.current
        .setLookAt(...targetPosition, true)
        .catch(error => {
          console.error("Camera transition error:", error)
        })
        .finally(() => {
          controls.current.enabled = sectionName === "nav"
          // console.log(`Transition to ${sectionName} complete`)
        })
    }
  }

  useEffect(() => {
    // Iniciar áudio ambiente quando o componente é montado
    audioManager.startAmbient()

    // Pré-carregar todos os sons para melhor performance
    audioManager.preloadAll()

    return () => {
      // Parar todo áudio quando o componente é desmontado
      audioManager.stopAmbient()
    }
  }, [])

  // Make the transition function available globally
  window.globalNavigation.navigateTo = playTransition

  const handleReturnToMain = () => {
    console.log("Back to main requested")
    playTransition("nav")
  }

  // Function to copy camera position to clipboard
  const copyPositionToClipboard = () => {
    if (!controls.current) return

    try {
      // Get position and target from controls
      const position = controls.current.getPosition()
      const target = controls.current.getTarget()

      // Handle different possible return formats
      let posArray, targetArray

      // Handle position - might be Vector3, array, or object with x,y,z
      if (Array.isArray(position)) {
        posArray = position
      } else if (typeof position.toArray === "function") {
        posArray = position.toArray()
      } else {
        posArray = [position.x, position.y, position.z]
      }

      // Handle target - might be Vector3, array, or object with x,y,z
      if (Array.isArray(target)) {
        targetArray = target
      } else if (typeof target.toArray === "function") {
        targetArray = target.toArray()
      } else {
        targetArray = [target.x, target.y, target.z]
      }

      // Combine into the format needed for the camera config
      const positionArray = [...posArray, ...targetArray]

      // Format the array for display and copy
      const formattedArray = positionArray
        .map(val => Number(val).toFixed(15))
        .join(", ")

      // Also create a formatted JS array for console
      const jsArrayFormat = `[\n  ${posArray
        .map(val => Number(val).toFixed(15))
        .join(",\n  ")},\n  ${targetArray
        .map(val => Number(val).toFixed(15))
        .join(",\n  ")}\n]`

      // Copy to clipboard
      navigator.clipboard
        .writeText(formattedArray)
        .then(() => {
          setClipboardMessage("Position copied to clipboard!")

          // Clear message after 3 seconds
          setTimeout(() => {
            setClipboardMessage("")
          }, 3000)
        })
        .catch(err => {
          console.error("Could not copy position to clipboard:", err)
          setClipboardMessage("Failed to copy position.")

          // Clear message after 3 seconds
          setTimeout(() => {
            setClipboardMessage("")
          }, 3000)
        })

      // Log to console in different formats for reference
      console.log("Camera raw position:", position)
      console.log("Camera raw target:", target)
      console.log("Camera position array:", positionArray)
      console.log("Camera position formatted for config:", jsArrayFormat)
    } catch (error) {
      console.error("Error getting camera position:", error)
      setClipboardMessage("Error getting camera position")

      setTimeout(() => {
        setClipboardMessage("")
      }, 3000)
    }
  }

  // Make controls globally available
  useEffect(() => {
    if (!controls.current) return
    window.controls = controls

    // Initial configuration
    if (cameraLocked) {
      controls.current.minPolarAngle = Math.PI * 0.4
      controls.current.maxPolarAngle = Math.PI * 0.55
      controls.current.minDistance = 0
      controls.current.maxDistance = 100
      controls.current.boundaryFriction = 1
      controls.current.boundaryEnclosesCamera = true
      controls.current.dollyToCursor = true
      controls.current.minY = 1
      controls.current.maxY = 15

      const defaultPosition = getCameraPosition("default")
      controls.current.setLookAt(...defaultPosition, false)

      // Use direct navigation function
      setTimeout(() => {
        playTransition("nav")
      }, TRANSITION_DELAY)
    }

    return () => {
      // Cleanup
      delete window.controls
    }
  }, [])

  useControls(
    "Controls",
    {
      cameraLocked: {
        value: cameraLocked,
        label: "Lock Camera",
        onChange: locked => {
          setCameraLocked(locked)
        },
      },
      getLookAt: button(() => {
        copyPositionToClipboard()
      }),
      resetCamera: button(() => {
        if (!controls.current) return
        const targetPosition = getCameraPosition(activeSection || "nav")
        if (targetPosition) {
          controls.current.setLookAt(...targetPosition, true)
        }
      }),
    },
    { collapsed: false }
  )

  useEffect(() => {
    if (!controls.current || !controls.current.mouseButtons) return

    controls.current.mouseButtons.left = 1
    controls.current.mouseButtons.right = 4 // Truck (move) with right button
    controls.current.verticalDragToForward = false // Disable zoom on vertical drag

    // Handle Ctrl+Click safely
    const handleKeyDown = event => {
      if (event.ctrlKey && controls.current && controls.current.mouseButtons) {
        controls.current.mouseButtons.left = 4 // Truck with Ctrl+MouseLeft
      }
    }

    const handleKeyUp = event => {
      if (
        event.key === "Control" &&
        controls.current &&
        controls.current.mouseButtons
      ) {
        controls.current.mouseButtons.left = 1 // Back to ROTATE when Ctrl is released
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Create notification element outside the 3D canvas
  useEffect(() => {
    if (clipboardMessage) {
      // Create and append notification element
      const notification = document.createElement("div")
      notification.style.position = "absolute"
      notification.style.top = "10px"
      notification.style.right = "10px"
      notification.style.padding = "8px 12px"
      notification.style.backgroundColor = "rgba(0, 0, 0, 0.7)"
      notification.style.color = "white"
      notification.style.borderRadius = "4px"
      notification.style.zIndex = "1000"
      notification.style.fontFamily = "sans-serif"
      notification.style.fontSize = "14px"
      notification.style.transition = "opacity 0.3s ease"
      notification.style.opacity = "0"
      notification.textContent = clipboardMessage

      document.body.appendChild(notification)

      // Fade in
      setTimeout(() => {
        notification.style.opacity = "1"
      }, 10)

      // Remove after timeout
      setTimeout(() => {
        notification.style.opacity = "0"
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 300)
      }, 3000)

      // Cleanup on unmount
      return () => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }
    }
  }, [clipboardMessage])

  return (
    <group position={[0, 0, 0]} rotation={[0, 0, 0]}>
      <CameraControls
        ref={controls}
        makeDefault
        smoothTime={0.6}
        dollySpeed={0.1}
        wheelDampingFactor={0.15}
        truckSpeed={1.0}
        verticalDragToForward={false}
        dollyToCursor={false}
      />

      <CastleModel
        onCastleClick={playTransition}
        atmIframeActive={atmiframeActive}
        mirrorIframeActive={mirrorIframeActive}
        scrollIframeActive={scrollIframeActive}
        hasInteracted={true}
        setAtmiframeActive={setAtmiframeActive}
        setMirrorIframeActive={setMirrorIframeActive}
        setScrollIframeActive={setScrollIframeActive}
        activeSection={activeSection}
      />
    </group>
  )
}

export default Castle
