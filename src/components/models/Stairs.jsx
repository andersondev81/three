import React, { useMemo } from "react"
import { useGLTF, useTexture } from "@react-three/drei"
import {
  MeshPhysicalMaterial,
  DoubleSide,
  NormalBlending,
  NearestFilter,
} from "three"
import { useBg1Environment } from "../../utils/useSharedEnvironmentMaps"

const useStairsMaterial = () => {
  const textures = useTexture({
    map: "/texture/stairsColor.avif",
    normalMap: "/texture/stairs_Normal.avif",
    alphaMap: "/texture/stairs_Alpha.avif",
    roughnessMap: "/texture/stairs_Roughness.avif",
  })

  const bg1Env = useBg1Environment()

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
        envMap: bg1Env,
        envMapIntensity: 2.2,
      }),
    [textures, bg1Env]
  )

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
