import React, { useMemo } from "react"
import { useGLTF, useTexture } from "@react-three/drei"
import {
  MeshStandardMaterial,
  NearestFilter,
  DoubleSide,
  Vector2,
  TangentSpaceNormalMap,
} from "three"
import { useThree } from "@react-three/fiber"
import { useStudioEnvironment } from "../../utils/useSharedEnvironmentMaps"

const useMobileDetection = () => {
  const { size } = useThree()
  return size.width < 768 || /Mobi|Android/i.test(navigator.userAgent)
}

export function Flower(props) {
  const { nodes } = useGLTF("/models/Flower.glb")
  const isMobile = useMobileDetection()
  const studioEnv = useStudioEnvironment()

  const textures = useTexture({
    diffuse: "/texture/FlowersColor.avif",
    alpha: "/texture/Flowers_Alpha.avif",
    ...(!isMobile && {
      normal: "/texture/Flowers_Normal.avif",
    }),
  })

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = false
        texture.minFilter = NearestFilter
        texture.magFilter = NearestFilter
      }
    })
  }, [textures])

  const material = useMemo(() => {
    const baseConfig = {
      map: textures.diffuse,
      alphaMap: textures.alpha,
      transparent: true,
      alphaTest: isMobile ? 0.1 : 0.2,
      side: DoubleSide,
      envMap: studioEnv,
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
  }, [textures, isMobile, studioEnv])

  if (!nodes?.flowers?.geometry) {
    console.warn("Flower model not loaded yet")
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
