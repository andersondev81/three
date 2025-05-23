import React, { useMemo, useEffect } from "react"
import { useGLTF, useTexture } from "@react-three/drei"
import { useLoader } from "@react-three/fiber"
import { TextureLoader } from "three"
import {
  MeshPhysicalMaterial,
  DoubleSide,
  NormalBlending,
  NearestFilter,
  EquirectangularReflectionMapping,
} from "three"

const useStairsMaterial = () => {
  const textures = useTexture({
    map: "/texture/stairsColor.avif",
    normalMap: "/texture/stairs_Normal.avif",
    alphaMap: "/texture/stairs_Alpha.avif",
    roughnessMap: "/texture/stairs_Roughness.avif",
  })

  const envMap = useLoader(TextureLoader, "/images/bg1.jpg")
  envMap.mapping = EquirectangularReflectionMapping

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = false
        texture.minFilter = NearestFilter
        texture.magFilter = NearestFilter
      }
    })
  }, [textures])

  const material = useMemo(
    () =>
      new MeshPhysicalMaterial({
        ...textures,
        color: 0x62bfed,
        transparent: false,
        alphaTest: 0.01,
        depthWrite: true,
        depthTest: true,
        side: DoubleSide,
        blending: NormalBlending,
        roughness: 1,
        metalness: 0.6,
        envMap: envMap,
        envMapIntensity: 2.2,
      }),
    [textures, envMap]
  )

  useEffect(() => {
    if (envMap) {
      material.needsUpdate = true
    }
  }, [envMap, material])

  return material
}

export function Stairs(props) {
  const { nodes } = useGLTF("/models/stairs.glb")
  const material = useStairsMaterial()

  return (
    <group {...props} dispose={null}>
      <mesh
        geometry={nodes.stairs_Baked.geometry}
        material={material}
        position={[0, 0.317, 4.033]}
      />
    </group>
  )
}

useGLTF.preload("/models/stairs.glb")
