import React, { useMemo, useRef, useEffect, useState } from "react"
import { useGLTF, useTexture, Float } from "@react-three/drei"
import {
  Color,
  MeshStandardMaterial,
  NearestFilter,
  FrontSide,
  AdditiveBlending,
  Layers,
  Vector3,
  MeshBasicMaterial,
} from "three"
import { useFrame, useThree } from "@react-three/fiber"

// Constants
const BLOOM_LAYER = new Layers()
BLOOM_LAYER.set(1)
const DOUBLE_CLICK_DELAY = 300
const EMISSIVE_COLOR = new Color(0x48cae4)

import { useMobileDetection } from "../../hooks/useMobileDetection"

const createMaterialManager = () => {
  const materialCache = new Map()

  return {
    getMaterial: (key, config) => {
      if (!materialCache.has(key)) {
        materialCache.set(key, new MeshStandardMaterial(config))
      }
      return materialCache.get(key)
    },
    getMaterialBasic: (key, config) => {
      if (!materialCache.has(key)) {
        materialCache.set(key, new MeshBasicMaterial(config))
      }
      return materialCache.get(key)
    },
  }
}

const RotatingAxis = React.memo(({ axis, speed, children, isMobile }) => {
  const ref = useRef()
  const adjustedSpeed = isMobile ? speed * 0.7 : speed

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation[axis] += adjustedSpeed * delta
  })

  return <group ref={ref}>{children}</group>
})

const OrbMesh = React.memo(
  ({ isZoomed, setIsZoomed, onSectionChange, isMobile }) => {
    const { nodes } = useGLTF("/models/Orbit.glb")

    const textureProps = useMemo(() => {
      return isMobile
        ? {
            map: "/texture/Orb_AlphaV1.avif",
            alphaMap: "/texture/Orb_Alpha.avif",
          }
        : {
            map: "/texture/Orb_AlphaV1.avif",
            alphaMap: "/texture/Orb_Alpha.avif",
            emissiveMap: "/texture/OrbBake_Emissive.avif",
          }
    }, [isMobile])

    const textures = useTexture(textureProps)

    useMemo(() => {
      Object.values(textures).forEach(texture => {
        if (texture) {
          texture.flipY = false
          texture.minFilter = NearestFilter
          texture.magFilter = NearestFilter
        }
      })
    }, [textures])

    const materialManager = useMemo(() => createMaterialManager(), [])

    const materials = useMemo(() => {
      const baseSettings = {
        map: textures.map,
        alphaMap: textures.alphaMap,
        transparent: true,
        alphaTest: 0.005,
        depthTest: true,
        roughness: 0,
        metalness: 0,
        side: FrontSide,
      }

      if (!isMobile && textures.emissiveMap) {
        baseSettings.emissive = EMISSIVE_COLOR
        baseSettings.emissiveIntensity = 0.5
        baseSettings.emissiveMap = textures.emissiveMap
      }

      return {
        lines: materialManager.getMaterial("lines", {
          ...baseSettings,
          opacity: isMobile ? 0.2 : 0.3,
          blending: AdditiveBlending,
        }),
        center: materialManager.getMaterial("center", {
          ...baseSettings,
          opacity: 1,
        }),
        balls: materialManager.getMaterial("balls", {
          ...baseSettings,
          opacity: isMobile ? 0.1 : 0.15,
          blending: AdditiveBlending,
        }),
        sphere: materialManager.getMaterialBasic("sphere", {
          color: new Color(0.678, 0.933, 0.953),
          transparent: true,
          opacity: isMobile ? 0.7 : 0.9,
        }),
      }
    }, [textures, materialManager, isMobile])

    const emissiveGroupRef = useRef()
    const clickTimerRef = useRef(null)
    const lastClickTimeRef = useRef(0)

    useEffect(() => {
      if (!isMobile && emissiveGroupRef.current) {
        emissiveGroupRef.current.traverse(child => {
          if (child.isMesh && child.material.emissive) {
            child.layers.enable(1)
          }
        })
      }
    }, [isMobile])

    useEffect(() => {
      return () => {
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current)
        }
      }
    }, [])

    const handleNavigation = (navigationSource = "direct") => {
      if (window.audioManager?.play) {
        window.audioManager.play("transition")
      }

      if (navigationSource === "pole") {
        if (window.navigationSystem?.clearPositionForElement) {
          window.navigationSystem.clearPositionForElement("orb")
        }
      } else if (navigationSource === "direct" && window.controls?.current) {
        try {
          const position = window.controls.current.getPosition()
          const target = window.controls.current.getTarget()

          if (window.navigationSystem?.storePosition) {
            window.navigationSystem.storePosition(
              "orb",
              [position.x, position.y, position.z],
              [target.x, target.y, target.z]
            )
          }
        } catch (err) {}
      }

      if (window.navigationSystem?.setNavigationSource) {
        window.navigationSystem.setNavigationSource("orb", navigationSource)
      }

      window.dispatchEvent(
        new CustomEvent("orbNavigation", { detail: { section: "about" } })
      )

      if (onSectionChange) {
        onSectionChange(1, "about")
      }

      if (window.globalNavigation?.navigateTo) {
        window.globalNavigation.navigateTo("about")
      }
    }

    const handleClick = e => {
      e.stopPropagation()
      const now = Date.now()
      const timeDiff = now - lastClickTimeRef.current

      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
        clickTimerRef.current = null
      }

      if (timeDiff < DOUBLE_CLICK_DELAY) {
        setIsZoomed(!isZoomed)
        lastClickTimeRef.current = 0
      } else {
        lastClickTimeRef.current = now
        clickTimerRef.current = setTimeout(() => {
          const source =
            window.navigationSystem?.getNavigationSource?.("orb") === "pole"
              ? "pole"
              : "direct"
          handleNavigation(source)
        }, DOUBLE_CLICK_DELAY)
      }
    }

    const handlePointerEnter = e => {
      e.stopPropagation()
      document.body.style.cursor = "pointer"
    }

    const handlePointerLeave = () => {
      document.body.style.cursor = "default"
    }

    if (!nodes || !nodes.lineC || !nodes.center) {
      return null
    }

    return (
      <group
        position={[1.76, 1.155, -0.883]}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <group ref={emissiveGroupRef}>
          <group>
            <RotatingAxis axis="y" speed={1} isMobile={isMobile}>
              <mesh
                geometry={nodes.lineC?.geometry}
                material={materials.lines}
              />
            </RotatingAxis>

            {(!isMobile || Math.random() > 0.5) && (
              <RotatingAxis axis="z" speed={6} isMobile={isMobile}>
                <mesh
                  geometry={nodes.lineB?.geometry}
                  material={materials.lines}
                />
              </RotatingAxis>
            )}

            {(!isMobile || Math.random() > 0.5) && (
              <RotatingAxis axis="x" speed={8} isMobile={isMobile}>
                <mesh
                  geometry={nodes.lineA?.geometry}
                  material={materials.lines}
                />
              </RotatingAxis>
            )}
          </group>

          <RotatingAxis axis="y" speed={8} isMobile={isMobile}>
            <mesh
              geometry={nodes.center?.geometry}
              material={materials.center}
            />
          </RotatingAxis>

          <group>
            {(!isMobile || Math.random() > 0.3) && (
              <RotatingAxis axis="x" speed={6} isMobile={isMobile}>
                <mesh
                  geometry={nodes.ballC?.geometry}
                  material={materials.balls}
                />
              </RotatingAxis>
            )}

            <RotatingAxis axis="y" speed={8} isMobile={isMobile}>
              <mesh
                geometry={nodes.ballA?.geometry}
                material={materials.balls}
                scale={0.993}
              />
            </RotatingAxis>

            {(!isMobile || Math.random() > 0.3) && (
              <RotatingAxis axis="z" speed={2} isMobile={isMobile}>
                <mesh
                  geometry={nodes.ballB?.geometry}
                  material={materials.balls}
                  scale={1.125}
                />
              </RotatingAxis>
            )}
          </group>
        </group>

        <mesh>
          <sphereGeometry args={[0.02, isMobile ? 8 : 16, isMobile ? 8 : 16]} />
          <meshBasicMaterial
            color={new Color(0.678, 0.933, 0.953)}
            transparent
            opacity={isMobile ? 0.7 : 0.9}
          />
        </mesh>

        {(!isMobile || Math.random() > 0.5) && (
          <RotatingAxis axis="y" speed={-0.5} isMobile={isMobile}>
            <mesh
              geometry={nodes.particles.geometry}
              material={materials.sphere}
              rotation={[Math.PI / 2, 0, 0]}
              scale={0.01}
            />
          </RotatingAxis>
        )}
      </group>
    )
  }
)

const Orb = ({ onSectionChange }) => {
  const [isZoomed, setIsZoomed] = useState(false)
  const floatGroupRef = useRef()
  const originalScale = useRef(new Vector3(1, 1, 1))
  const originalPosition = useRef(new Vector3(0.066, 0, -0.04))
  const targetScale = new Vector3(1.5, 1.5, 1.5)
  const targetPosition = new Vector3(0.066, 0.25, -0.04)
  const isMobile = useMobileDetection()

  const transitionSpeed = isMobile ? 0.3 : 0.5

  useFrame((_, delta) => {
    if (!floatGroupRef.current) return

    floatGroupRef.current.scale.lerp(
      isZoomed ? targetScale : originalScale.current,
      delta * transitionSpeed
    )
    floatGroupRef.current.position.lerp(
      isZoomed ? targetPosition : originalPosition.current,
      delta * transitionSpeed
    )
  })

  useEffect(() => {
    if (floatGroupRef.current) {
      originalScale.current.copy(floatGroupRef.current.scale)
      originalPosition.current.copy(floatGroupRef.current.position)
    }
  }, [])

  return (
    <group position={[0, 0, 0]}>
      <group ref={floatGroupRef} position={[0.066, 0, -0.04]}>
        <Float
          floatIntensity={isMobile ? 0.2 : 0.3}
          speed={isMobile ? 2 : 3}
          rotationIntensity={0}
          floatingRange={isMobile ? [-0.05, 0.05] : [-0.1, 0.1]}
        >
          <OrbMesh
            isZoomed={isZoomed}
            setIsZoomed={setIsZoomed}
            onSectionChange={onSectionChange}
            isMobile={isMobile}
          />
        </Float>
      </group>
    </group>
  )
}

export default React.memo(Orb)
