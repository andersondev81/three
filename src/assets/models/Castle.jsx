import { CameraControls, useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { button, useControls } from "leva"
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import * as THREE from "three"
import { Color, DoubleSide, MeshBasicMaterial } from "three"
import RotateAxis from "../../components/helpers/RotateAxis"

import audioManager from "./AudioManager"
const SMALL_SCREEN_THRESHOLD = 768
const TRANSITION_DELAY = 100
window.lastClickedPosition = null

function smoothCameraReturn(position, target) {
  if (!window.controls || !window.controls.current) {
    console.error("No controls available for camera transition")
    return
  }

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
  // Track navigation sources
  navigationSources: {},

  // Initialize the system
  init: () => {
    window.navigationSystem = {
      // Store position for any interactive element
      storePosition: (elementId, position, target) => {
        NavigationSystem.positions[elementId] = { position, target }
        audioManager.play("transition")
      },

      // Track navigation source
      setNavigationSource: (elementId, source) => {
        NavigationSystem.navigationSources[elementId] = source
      },

      // Get navigation source
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
        NavigationSystem.navigationSources = {}
      },

      // Clear position for a specific element
      clearPositionForElement: elementId => {
        if (NavigationSystem.positions[elementId]) {
          delete NavigationSystem.positions[elementId]
          console.log(`Cleared position for ${elementId}`)
        }
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
      -0.6191818190771635, 1.0420789531859995, 92.27433517944273,
      -0.21830679207380707, 1.042078953185994, 0.860456882413919,
    ],
    small: [
      132.95512091806918, 87.33269746995288, 188.3864842177005,
      -0.1823668021901385, -0.24424001987657776, 0.22391277970336168,
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
        -0.47993818136505073, 1.13917177154802, 6.743922666460792,
        -1.3224149774642704, 1.6753152120757284, 1.0989767468615808,
      ],
      about: [
        2.3794036621880066, 1.2374886332491917, -1.2579531405441664,
        -0.3255291216311705, 1.3232162748274139, 0.2492021531029873,
      ],
      aidatingcoach: [
        -2.3148021101664606, 1.1024327055391172, -1.1063841608771088,
        -0.1820891855994354, 1.1199307653182649, -0.05437741521465597,
      ],
      download: [
        1.8562259954731093, 1.1626020325030495, -0.926552435064171,
        1.3674383110764547, 1.1705903196566405, -0.662785847191283,
      ],
      token: [-1.413729, 1.421313, 1.655757, -0.218307, 1.042079, 0.860457],
      roadmap: [
        -2.231073073487725, 1.199565269846763, 1.135322606706848,
        -0.176846154417628, 0.945515121504943, 0.032543752154573,
      ],
      atm: [
        1.374503345207453, 1.441964012122825, 1.68925639812635,
        -0.218306792073807, 1.042078953185994, 0.860456882413919,
      ],
    },
  },
}

// Materiais extremamente simples sem texturas
// Objeto com cores para diferentes partes do castelo
const COLORS = {
  CASTLE: "#c2a887",
  HEART: "#ff6b6b",
  HEART_MASK: "#e8b84e",
  LIGHTS: "#ffffff",
  GODS_WALLS: "#aea29a",
  WALLS: "#d4c4a8",
  PILARS: "#bfae98",
  FLOOR: "#b0a794",
  MIRROR_FRAME: "#e8b84e",
  FLOOR_HEART: "#578fd7",
  LOGO: "#fa3c81",
  DECOR: "#f9dd71",
  BOW: "#f9dd71",
  MIRROR: "#a6cce5",
  HALLOS: "#dabb46",
  GODS: "#fcfcfc",
  HOOF: "#578fd7",
  ATM: "#c4627d",
  ATM_METAL: "#d7d7d7",
  SCROLL: "#f0e6d2",
  PORTAL: "#330066",
  WATER: "#88ccff",
  WINGS: "#e8e4dc",
}

// Components -----------------------------------------
const CastleModel = ({
  onCastleClick,
  atmIframeActive,
  mirrorIframeActive,
  scrollIframeActive,
  setAtmiframeActive,
  setMirrorIframeActive,
  setScrollIframeActive,
  activeSection,
}) => {
  const { nodes } = useGLTF("/models/Castle.glb")

  // Criar materiais simples sem texturas
  const materials = useMemo(() => {
    return {
      castle: new MeshBasicMaterial({ color: COLORS.CASTLE, side: DoubleSide }),
      castleHeart: new MeshBasicMaterial({
        color: COLORS.HEART,
        side: DoubleSide,
      }),
      castleHeartMask: new MeshBasicMaterial({
        color: COLORS.HEART_MASK,
        side: DoubleSide,
      }),
      castleLights: new MeshBasicMaterial({
        color: COLORS.LIGHTS,
        side: DoubleSide,
        emissive: new Color(COLORS.LIGHTS),
        emissiveIntensity: 1,
      }),
      castleGodsWalls: new MeshBasicMaterial({
        color: COLORS.GODS_WALLS,
        side: DoubleSide,
      }),
      castleWalls: new MeshBasicMaterial({
        color: COLORS.WALLS,
        side: DoubleSide,
      }),
      castlePilars: new MeshBasicMaterial({
        color: COLORS.PILARS,
        side: DoubleSide,
      }),
      floor: new MeshBasicMaterial({ color: COLORS.FLOOR, side: DoubleSide }),
      mirrorFrame: new MeshBasicMaterial({
        color: COLORS.MIRROR_FRAME,
        side: DoubleSide,
      }),
      floorHeart: new MeshBasicMaterial({
        color: COLORS.FLOOR_HEART,
        side: DoubleSide,
        emissive: new Color(COLORS.FLOOR_HEART),
        emissiveIntensity: 0.5,
      }),
      logo: new MeshBasicMaterial({ color: COLORS.LOGO, side: DoubleSide }),
      decor: new MeshBasicMaterial({ color: COLORS.DECOR, side: DoubleSide }),
      bow: new MeshBasicMaterial({ color: COLORS.BOW, side: DoubleSide }),
      mirror: new MeshBasicMaterial({ color: COLORS.MIRROR, side: DoubleSide }),
      hallos: new MeshBasicMaterial({ color: COLORS.HALLOS, side: DoubleSide }),
      gods: new MeshBasicMaterial({ color: COLORS.GODS, side: DoubleSide }),
      hoof: new MeshBasicMaterial({
        color: COLORS.HOOF,
        side: DoubleSide,
        emissive: new Color(COLORS.HOOF),
        emissiveIntensity: 0.5,
      }),
      atm: new MeshBasicMaterial({ color: COLORS.ATM, side: DoubleSide }),
      atmMetal: new MeshBasicMaterial({
        color: COLORS.ATM_METAL,
        side: DoubleSide,
      }),
      scroll: new MeshBasicMaterial({ color: COLORS.SCROLL, side: DoubleSide }),
      portal: new MeshBasicMaterial({
        color: COLORS.PORTAL,
        side: DoubleSide,
        emissive: new Color(COLORS.PORTAL),
        emissiveIntensity: 1,
      }),
      water: new MeshBasicMaterial({
        color: COLORS.WATER,
        side: DoubleSide,
        emissive: new Color("#6699ff"),
        emissiveIntensity: 0.5,
      }),
      wings: new MeshBasicMaterial({ color: COLORS.WINGS, side: DoubleSide }),
    }
  }, [])

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

  return (
    <group dispose={null}>
      <mesh
        geometry={nodes.castle.geometry}
        material={materials.castle}
        layers-enable={1}
        castShadow={false}
        receiveShadow={false}
      />
      <mesh
        geometry={nodes.castleHeart.geometry}
        material={materials.castleHeart}
      />
      <mesh
        geometry={nodes.castleHeartMask.geometry}
        material={materials.castleHeartMask}
      />
      <mesh
        geometry={nodes.castleLights.geometry}
        material={materials.castleLights}
      />
      <mesh
        geometry={nodes.castleGodsWalls.geometry}
        material={materials.castleGodsWalls}
      />
      <mesh
        geometry={nodes.castleWalls.geometry}
        material={materials.castleWalls}
      />
      <mesh
        geometry={nodes.castlePilars.geometry}
        material={materials.castlePilars}
      />
      <mesh geometry={nodes.wings.geometry} material={materials.wings} />
      <mesh geometry={nodes.gods.geometry} material={materials.gods} />
      <mesh geometry={nodes.decor.geometry} material={materials.decor} />
      <mesh
        geometry={nodes.floor.geometry}
        material={materials.floor}
        layers-enable={1}
      />
      <mesh
        geometry={nodes.floorHeart.geometry}
        material={materials.floorHeart}
      />
      <mesh
        geometry={nodes.MirrorFrame.geometry}
        material={materials.mirrorFrame}
      />
      <mesh
        geometry={nodes.Mirror.geometry}
        material={materials.mirror}
        onClick={mirrorHandlers.handleClick}
        {...mirrorHandlers.pointerHandlers}
      />
      <mesh
        geometry={nodes.Hallos.geometry}
        material={materials.hallos}
        layers-enable={2}
      />
      <mesh
        geometry={nodes.hoofGlass.geometry}
        material={materials.hoof}
        layers-enable={2}
      />
      <mesh
        geometry={nodes.atm.geometry}
        material={materials.atm}
        layers-enable={2}
        castShadow={false}
        receiveShadow={false}
        onClick={atmHandlers.handleClick}
        {...atmHandlers.pointerHandlers}
      />
      <mesh geometry={nodes.atmMetal.geometry} material={materials.atmMetal} />
      <group position={[-0.056, 1.247, -2.117]}>
        <RotateAxis axis="y" speed={0.7} rotationType="euler">
          <mesh
            geometry={nodes.bow.geometry}
            material={materials.bow}
            castShadow={false}
            receiveShadow={false}
          />
        </RotateAxis>
      </group>
      <group>
        <RotateAxis axis="y" speed={1} rotationType="euler">
          <mesh
            geometry={nodes.LogoCupid.geometry}
            material={materials.logo}
            position={[0.001, 4.18, -0.006]}
            layers-enable={2}
            castShadow={false}
            receiveShadow={false}
          />
        </RotateAxis>
      </group>
      <mesh
        geometry={nodes.scroll.geometry}
        material={materials.scroll}
        castShadow={false}
        receiveShadow={false}
        onClick={scrollHandlers.handleClick}
        {...scrollHandlers.pointerHandlers}
      />
      {/* Material estático básico para o portal */}
      <mesh
        geometry={nodes.HeartVid.geometry}
        material={materials.portal}
        layers-enable={1}
        castShadow={false}
        receiveShadow={false}
      />
      {/* Material estático básico para a água */}
      <mesh
        geometry={nodes.water.geometry}
        material={materials.water}
        layers-enable={2}
        castShadow={false}
        receiveShadow={false}
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

  // Detectar se é dispositivo móvel
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768

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

    // Parar sons da seção anterior - desativado em mobile
    if (!isMobile && activeSection && activeSection !== sectionName) {
      audioManager.stopSectionSounds(activeSection)
    }

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
        })
    }
  }

  useEffect(() => {
    // Iniciar áudio ambiente quando o componente é montado - desativado em mobile
    if (!isMobile) {
      audioManager.startAmbient()
    }

    return () => {
      // Parar todo áudio quando o componente é desmontado
      audioManager.stopAmbient()
    }
  }, [isMobile])

  // Make the transition function available globally
  window.globalNavigation.navigateTo = playTransition

  // Make controls globally available
  useEffect(() => {
    if (!controls.current) return
    window.controls = controls

    // Initial configuration
    if (cameraLocked) {
      controls.current.minPolarAngle = Math.PI * 0.4
      controls.current.maxPolarAngle = Math.PI * 0.5
      controls.current.minDistance = 0
      controls.current.maxDistance = 100
      controls.current.boundaryFriction = 1
      controls.current.boundaryEnclosesCamera = true
      controls.current.dollyToCursor = false
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
      resetCamera: button(() => {
        if (!controls.current) return
        const targetPosition = getCameraPosition(activeSection || "nav")
        if (targetPosition) {
          controls.current.setLookAt(...targetPosition, true)
        }
      }),
    },
    { collapsed: true }
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
