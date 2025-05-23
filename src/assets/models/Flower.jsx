import React, { useMemo } from "react"
import { useGLTF, useTexture } from "@react-three/drei"
import {
  MeshStandardMaterial,
  NearestFilter,
  DoubleSide,
  EquirectangularReflectionMapping,
  Vector2,
  TangentSpaceNormalMap,
} from "three"
import { useThree } from "@react-three/fiber"

import { useMobileDetection } from "../../hooks/useMobileDetection"

export function Flower(props) {
  const { nodes } = useGLTF("/models/Flower.glb")
  const isMobile = useMobileDetection()

  const textures = useTexture({
    diffuse: "/texture/FlowersColor.avif",
    alpha: "/texture/Flowers_Alpha.avif",
    ...(!isMobile && {
      normal: "/texture/Flowers_Normal.avif",
    }),
    env: "/images/studio.jpg",
  })

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = false
        texture.minFilter = NearestFilter
        texture.magFilter = NearestFilter
      }
    })
    if (textures.env) {
      textures.env.mapping = EquirectangularReflectionMapping
    }
  }, [textures])

  const material = useMemo(() => {
    const baseConfig = {
      map: textures.diffuse,
      alphaMap: textures.alpha,
      transparent: true,
      alphaTest: isMobile ? 0.1 : 0.2,
      side: DoubleSide,
      envMap: textures.env,
      envMapIntensity: isMobile ? 0.8 : 1.4,
      roughness: isMobile ? 1.2 : 1,
      metalness: isMobile ? 0.8 : 1.2,
    }

    if (!isMobile && textures.normal) {
      baseConfig.normalMap = textures.normal
      baseConfig.normalScale = new Vector2(2, 2)
      baseConfig.normalMapType = TangentSpaceNormalMap
    }

    return new MeshStandardMaterial(baseConfig)
  }, [textures, isMobile])

  if (!nodes?.flowers?.geometry) {
    return null
  }

  return (
    <group {...props} dispose={null}>
      <group position={[0, 0, 0]}>
        <mesh
          geometry={nodes.flowers.geometry}
          material={material}
          frustumCulled={false}
        />
      </group>
    </group>
  )
}

useGLTF.preload("/models/Flower.glb")
