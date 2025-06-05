import { useVideoTexture } from "../../hooks/useVideoTexture"
import { CameraControls, useGLTF } from "@react-three/drei"
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
  VideoTexture,
} from "three"
import RotateAxis from "../helpers/RotateAxis"
import AtmIframe from "./AtmIframe"
import MirrorIframe from "./MirrorIframe"
import ScrollIframe from "./ScrolIframe"

import {
  useCastleMaterial,
  useCastleHeartMaterial,
  useCastleHeartMaskMaterial,
  useCastleLightsMaterial,
  usecastleGodsWallsMaterial,
  useCastleWallsMaterial,
  useCastlePilarsMaterial,
  useFloorMaterial,
  useMirrorFrameMaterial,
  useFloorHeartMaterial,
  useWingsMaterial,
  useLogoMaterial,
  useDecorMaterial,
  useBowMaterial,
  useMirrorMaterial,
  useHallosMaterial,
  useGodsMaterial,
  useHoofMaterial,
  useAtmMaterial,
  useAtmMetalMaterial,
  useScrollMaterial,
} from "../../utils/CastleTextures"

const SMALL_SCREEN_THRESHOLD = 768
const TRANSITION_DELAY = 100

window.lastClickedPosition = null
window.lastClickedPositions = {
  mirror: null,
  atm: null,
  scroll: null,
  orb: null,
}

function smoothCameraReturn(position, target) {
  if (!window.controls || !window.controls.current) return

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
        true
      )
      .catch(err => {})
  }, 50)
}

window.smoothCameraReturn = function (position, target) {
  if (!window.controls || !window.controls.current) return

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
        true
      )
      .catch(err => {})
  }, 50)
}

if (window.navigationSystem) {
  const origClearPositions = window.navigationSystem.clearPositions
  window.navigationSystem.clearPositions = function () {
    if (origClearPositions) origClearPositions()

    window.lastClickedPositions = {
      mirror: null,
      atm: null,
      scroll: null,
      orb: null,
    }
  }

  if (!window.navigationSystem.clearPositionForElement) {
    window.navigationSystem.clearPositionForElement = function (elementId) {
      if (
        window.lastClickedPositions &&
        window.lastClickedPositions[elementId]
      ) {
        delete window.lastClickedPositions[elementId]
      }
    }
  }
}

const NavigationSystem = {
  positions: {},
  navigationSources: {},

  init: () => {
    window.navigationSystem = {
      storePosition: (elementId, position, target) => {
        NavigationSystem.positions[elementId] = { position, target }
        window.audioManager?.play("transition")
      },

      setNavigationSource: (elementId, source) => {
        NavigationSystem.navigationSources[elementId] = source
      },

      getNavigationSource: elementId => {
        return NavigationSystem.navigationSources[elementId] || "direct"
      },

      getPosition: elementId => {
        return NavigationSystem.positions[elementId]
      },

      clearPositions: () => {
        NavigationSystem.positions = {}
        NavigationSystem.navigationSources = {}
      },

      clearPositionForElement: elementId => {
        if (NavigationSystem.positions[elementId]) {
          delete NavigationSystem.positions[elementId]
        }
        if (NavigationSystem.navigationSources[elementId]) {
          delete NavigationSystem.navigationSources[elementId]
        }
      },

      returnToPosition: (elementId, defaultAction) => {
        const storedPosition = NavigationSystem.positions[elementId]
        const source = NavigationSystem.navigationSources[elementId] || "direct"

        if (source === "pole") {
          if (window.globalNavigation && window.globalNavigation.navigateTo) {
            window.globalNavigation.navigateTo("nav")
            return true
          }
        }

        if (storedPosition && source === "direct") {
          const { position, target } = storedPosition
          if (window.controls && window.controls.current) {
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
              .catch(err => {})
            return true
          }
        }

        defaultAction()
        return false
      },
    }
  },

  createElementHandlers: (elementId, navigateTo, setActive, isActive) => {
    const handleElementClick = e => {
      e.stopPropagation()

      if (isActive) return

      if (window.controls && window.controls.current) {
        try {
          const position = window.controls.current.getPosition()
          const target = window.controls.current.getTarget()

          const posArray = Array.isArray(position)
            ? position
            : [position.x, position.y, position.z]
          const targetArray = Array.isArray(target)
            ? target
            : [target.x, target.y, target.z]

          window.navigationSystem.storePosition(
            elementId,
            posArray,
            targetArray
          )

          window.navigationSystem.setNavigationSource(elementId, "direct")
        } catch (err) {}
      }

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

NavigationSystem.init()

const cameraConfig = {
  default: {
    large: [
      -0.6191818190771635, 0.95, 100.27433517944273, -0.21830679207380707,
      1.042078953185994, 0.860456882413919,
    ],
    small: [
      -0.6191818190771635, 0.95, 100.27433517944273, -0.21830679207380707,
      1.042078953185994, -0.1,
    ],
  },
  sections: {
    large: {
      nav: [
        -0.1484189177185437, 0.9565803692840462, 7, -0.21830679207380707,
        1.042078953185994, -0.1,
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
        -2.161684749505211, 1.173942777565765, 1.1206670134865,
        -0.197542004012201, 1.111892526171484, -0.069368081468385,
      ],
      atm: [
        1.374503345207453, 1.441964012122825, 1.68925639812635,
        -0.218306792073807, 1.042078953185994, 0.860456882413919,
      ],
    },
    small: {
      nav: [
        -0.868691622067547, 1.029782675546368, 7.143255099997356, 0.0,
        1.675315212075728, -0.1,
      ],
      about: [
        2.3794036621880066, 1.2374886332491917, -1.2579531405441664,
        -0.3255291216311705, 1.3232162748274139, 0.2492021531029873,
      ],
      aidatingcoach: [
        -2.581695666739801, 1.371253842691613, -1.255349396667348,
        -0.031149146971484, 1.541309489195095, -0.08529385130035,
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
        -2.180525612709062, 1.158549488415, 1.115589073493356,
        0.000018681309145, 1.211390086122982, -0.094066400577277,
      ],
      atm: [
        1.374503345207453, 1.441964012122825, 1.68925639812635,
        -0.218306792073807, 1.042078953185994, 0.860456882413919,
      ],
    },
  },
}

const updateSpatialSounds = cameraPosition => {
  if (!window.audioManager || !window.audioManager.sounds) {
    return
  }

  const orbPosition = { x: 1.76, y: 1.155, z: -0.883 }
  const fountainPosition = { x: 0, y: 0.8, z: 2.406 }

  const dxOrb = cameraPosition.x - orbPosition.x
  const dyOrb = cameraPosition.y - orbPosition.y
  const dzOrb = cameraPosition.z - orbPosition.z
  const distToOrb = Math.sqrt(dxOrb * dxOrb + dyOrb * dyOrb + dzOrb * dzOrb)

  const maxOrbDistance = 1.5

  if (window.audioManager.sounds.orb) {
    if (distToOrb < maxOrbDistance) {
      const attenuationOrb = 1 - Math.pow(distToOrb / maxOrbDistance, 3)
      const orbVolume = Math.max(0, 0.2 * attenuationOrb)

      if (orbVolume > 0.05) {
        if (!window.audioManager.sounds.orb.audio) {
          window.audioManager.createAudioElement("orb")
        }

        if (window.audioManager.sounds.orb.audio) {
          window.audioManager.sounds.orb.audio.volume = orbVolume
        }

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

  const dxFountain = cameraPosition.x - fountainPosition.x
  const dyFountain = cameraPosition.y - fountainPosition.y
  const dzFountain = cameraPosition.z - fountainPosition.z
  const distToFountain = Math.sqrt(
    dxFountain * dxFountain + dyFountain * dyFountain + dzFountain * dzFountain
  )

  const maxFountainDistance = 3.5

  if (window.audioManager.sounds.fountain) {
    if (distToFountain < maxFountainDistance) {
      const attenuationFountain = 1 - distToFountain / maxFountainDistance
      const fountainVolume = Math.max(0, 0.2 * attenuationFountain)

      if (fountainVolume > 0.02) {
        if (!window.audioManager.sounds.fountain.audio) {
          window.audioManager.createAudioElement("fountain")
        }

        if (window.audioManager.sounds.fountain.audio) {
          window.audioManager.sounds.fountain.audio.volume = fountainVolume
        }

        if (!window.audioManager.sounds.fountain.isPlaying) {
          window.audioManager.play("fountain")
        }
      } else {
        if (window.audioManager.sounds.fountain.isPlaying) {
          window.audioManager.stop("fountain")
        }
      }
    } else {
      if (window.audioManager.sounds.fountain.isPlaying) {
        window.audioManager.stop("fountain")
      }
    }
  }
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
  const mirror = useMirrorMaterial(activeSection)
  const hallosMaterial = useHallosMaterial()
  const wingsMaterial = useWingsMaterial()

  const { texture: portalTexture, play: playPortal } = useVideoTexture(
    "/video/tunnel.mp4",
    {
      loop: true,
      muted: true,
      playsInline: true,
      preload: "metadata",
    }
  )

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

  useFrame(({ camera }) => {
    updateSpatialSounds(camera.position)
  })

  const mirrorHandlers = NavigationSystem.createElementHandlers(
    "mirror",
    () => {
      if (!mirrorIframeActive) {
        onCastleClick("aidatingcoach")
      }
    },
    setMirrorIframeActive,
    mirrorIframeActive
  )

  const atmHandlers = NavigationSystem.createElementHandlers(
    "atm",
    () => {
      if (!atmIframeActive) {
        onCastleClick("token")
      }
    },
    setAtmiframeActive,
    atmIframeActive
  )

  const scrollHandlers = NavigationSystem.createElementHandlers(
    "scroll",
    () => {
      if (!scrollIframeActive) {
        onCastleClick("roadmap")
      }
    },
    setScrollIframeActive,
    scrollIframeActive
  )

  const { texture: waterTexture, play: playWater } = useVideoTexture(
    "/video/water.mp4",
    {
      loop: true,
      muted: true,
      playsInline: true,
      preload: "metadata",
    }
  )

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

  useEffect(() => {
    if (window.audioManager && window.audioManager.sounds) {
      if (window.audioManager.sounds.orb) {
        window.audioManager.stop("orb")
      }
      if (window.audioManager.sounds.fountain) {
        window.audioManager.stop("fountain")
      }
    }

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

  useEffect(() => {
    if (hasInteracted) {
      playPortal()
      playWater()
      if (onPortalPlay) onPortalPlay()
      if (onWaterPlay) onWaterPlay()
    }
  }, [hasInteracted, playPortal, playWater, onPortalPlay, onWaterPlay])

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

      <AtmIframe
        position={[1.675, 1.185, 0.86]}
        rotation={[1.47, 0.194, -1.088]}
        onReturnToMain={source => {
          setTimeout(() => {
            setAtmiframeActive(false)
            window.audioManager?.play("transition")
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
          }, 0)
        }}
        isActive={atmIframeActive}
      />

      {mirrorIframeActive && (
        <MirrorIframe
          onReturnToMain={source => {
            setMirrorIframeActive(false)

            setTimeout(() => {
              if (source === "pole") {
                onCastleClick("nav")
              } else {
                const storedPosition =
                  window.navigationSystem.getPosition("mirror")
                if (storedPosition) {
                  const { position, target } = storedPosition
                  smoothCameraReturn(position, target)
                } else {
                  onCastleClick("nav")
                }
              }
            }, 100)
          }}
          isActive={mirrorIframeActive}
        />
      )}

      {scrollIframeActive && (
        <ScrollIframe
          onReturnToMain={source => {
            setScrollIframeActive(false)

            setTimeout(() => {
              if (source === "pole") {
                onCastleClick("nav")
              } else {
                const storedPosition =
                  window.navigationSystem.getPosition("scroll")
                if (storedPosition) {
                  const { position, target } = storedPosition
                  smoothCameraReturn(position, target)
                } else {
                  onCastleClick("nav")
                }
              }
            }, 100)
          }}
          isActive={scrollIframeActive}
        />
      )}
    </group>
  )
}

const Castle = ({ activeSection, onSectionChange, isStarted = false }) => {
  const controls = useRef()
  const [atmiframeActive, setAtmiframeActive] = useState(false)
  const [mirrorIframeActive, setMirrorIframeActive] = useState(false)
  const [scrollIframeActive, setScrollIframeActive] = useState(false)
  const [cameraLocked, setCameraLocked] = useState(true)
  const [clipboardMessage, setClipboardMessage] = useState("")
  const [hasStartedAnimation, setHasStartedAnimation] = useState(false)

  window.resetIframes = () => {
    setAtmiframeActive(false)
    setMirrorIframeActive(false)
    setScrollIframeActive(false)

    if (window.audioManager) {
      window.audioManager.stopSectionSounds("aidatingcoach")
      window.audioManager.stopSectionSounds("token")
      window.audioManager.stopSectionSounds("roadmap")
    }
  }

  useEffect(() => {
    if (
      activeSection &&
      !["aidatingcoach", "token", "roadmap"].includes(activeSection)
    ) {
      setAtmiframeActive(false)
      setMirrorIframeActive(false)
      setScrollIframeActive(false)
    }
  }, [activeSection])
  useEffect(() => {
    if (!controls.current || !isStarted || hasStartedAnimation) return
    console.log("🚀 [Castle] Iniciando animação da câmera")
    setHasStartedAnimation(true)
    setTimeout(() => {
      playTransition("nav")
    }, TRANSITION_DELAY)
  }, [isStarted, hasStartedAnimation])

  useEffect(() => {
    if (!isStarted && hasStartedAnimation) {
      console.log("🔄 [Castle] Resetando animação")
      setHasStartedAnimation(false)
      if (controls.current) {
        const defaultPosition = getCameraPosition("default")
        controls.current.setLookAt(...defaultPosition, false)
      }
    }
  }, [isStarted, hasStartedAnimation])
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

    setAtmiframeActive(false)
    setMirrorIframeActive(false)
    setScrollIframeActive(false)

    if (activeSection && activeSection !== sectionName) {
      window.audioManager?.stopSectionSounds(activeSection)
    }

    setTimeout(() => {
      if (window.audioManager?.sounds[sectionName]) {
        window.audioManager.play(sectionName)
      }

      switch (sectionName) {
        case "aidatingcoach":
          if (window.audioManager?.sounds["mirror"]) {
            window.audioManager.play("mirror")
          }
          setTimeout(() => {
            setMirrorIframeActive(true)
          }, 150)
          break

        case "token":
          if (window.audioManager?.sounds["atm"]) {
            window.audioManager.play("atm")
          }
          if (window.audioManager?.sounds["coins"]) {
            window.audioManager.play("coins")
          }

          if (onSectionChange) {
            onSectionChange(4, "token")
            return
          }
          break

        case "roadmap":
          if (window.audioManager?.sounds["scroll"]) {
            window.audioManager.play("scroll")
          }
          if (window.audioManager?.sounds["paper"]) {
            window.audioManager.play("paper")
          }

          if (onSectionChange) {
            onSectionChange(5, "roadmap")
            return
          }
          break

        case "nav":
          setAtmiframeActive(false)
          setMirrorIframeActive(false)
          setScrollIframeActive(false)
          break
      }
    }, 300)

    controls.current.enabled = true

    const targetPosition = getCameraPosition(
      sectionName === "default" ? "default" : sectionName
    )

    if (targetPosition) {
      controls.current
        .setLookAt(...targetPosition, true)
        .catch(error => {})
        .finally(() => {
          controls.current.enabled = sectionName === "nav"
        })
    }
  }

  window.globalNavigation = {
    navigateTo: playTransition,
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
      this.lastSection = "nav"
    },
    log: function (message) {},
  }

  useEffect(() => {
    window.audioManager?.startAmbient()
    window.audioManager?.preloadAll()

    setAtmiframeActive(false)
    setMirrorIframeActive(false)
    setScrollIframeActive(false)

    return () => {
      window.audioManager?.stopAmbient()
      if (window.resetIframes) {
        window.resetIframes()
      }
    }
  }, [])

  const copyPositionToClipboard = () => {
    if (!controls.current) return

    try {
      const position = controls.current.getPosition()
      const target = controls.current.getTarget()

      let posArray, targetArray

      if (Array.isArray(position)) {
        posArray = position
      } else if (typeof position.toArray === "function") {
        posArray = position.toArray()
      } else {
        posArray = [position.x, position.y, position.z]
      }

      if (Array.isArray(target)) {
        targetArray = target
      } else if (typeof target.toArray === "function") {
        targetArray = target.toArray()
      } else {
        targetArray = [target.x, target.y, target.z]
      }

      const positionArray = [...posArray, ...targetArray]

      const formattedArray = positionArray
        .map(val => Number(val).toFixed(15))
        .join(", ")

      navigator.clipboard
        .writeText(formattedArray)
        .then(() => {
          setClipboardMessage("Position copied to clipboard!")

          setTimeout(() => {
            setClipboardMessage("")
          }, 3000)
        })
        .catch(err => {
          setClipboardMessage("Failed to copy position.")

          setTimeout(() => {
            setClipboardMessage("")
          }, 3000)
        })
    } catch (error) {
      setClipboardMessage("Error getting camera position")

      setTimeout(() => {
        setClipboardMessage("")
      }, 3000)
    }
  }

  useEffect(() => {
    if (!controls.current) return
    window.controls = controls

    if (cameraLocked) {
      controls.current.minPolarAngle = Math.PI * 0.34
      controls.current.maxPolarAngle = Math.PI * 0.53
      controls.current.minDistance = 1
      controls.current.maxDistance = 14
      controls.current.boundaryFriction = 1
      controls.current.boundaryEnclosesCamera = true
      controls.current.dollyToCursor = true
      controls.current.minY = 1
      controls.current.maxY = 15

      const defaultPosition = getCameraPosition("default")
      controls.current.setLookAt(...defaultPosition, false)

      console.log("🎥 [Castle] Camera setup - isStarted:", isStarted)
    }

    return () => {
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
    controls.current.mouseButtons.right = 4
    controls.current.verticalDragToForward = false

    const handleKeyDown = event => {
      if (event.ctrlKey && controls.current && controls.current.mouseButtons) {
        controls.current.mouseButtons.left = 4
      }
    }

    const handleKeyUp = event => {
      if (
        event.key === "Control" &&
        controls.current &&
        controls.current.mouseButtons
      ) {
        controls.current.mouseButtons.left = 1
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  useEffect(() => {
    if (clipboardMessage) {
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

      setTimeout(() => {
        notification.style.opacity = "1"
      }, 10)

      setTimeout(() => {
        notification.style.opacity = "0"
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 300)
      }, 3000)

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
