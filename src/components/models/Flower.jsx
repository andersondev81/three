// Flower.jsx - Optimized for both mobile and desktop with alpha support
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

// Custom mobile detection hook
const useMobileDetection = () => {
  const { size } = useThree()
  return size.width < 768 || /Mobi|Android/i.test(navigator.userAgent)
}

export function Flower(props) {
  const { nodes } = useGLTF("/models/Flower.glb")
  const isMobile = useMobileDetection()

  // Texture configuration based on device type
  const textures = useTexture({
    diffuse: "/texture/FlowersColor.avif",
    alpha: "/texture/Flowers_Alpha.avif", // Always load alpha for both mobile and desktop
    ...(!isMobile && {
      normal: "/texture/Flowers_Normal.avif", // Only load normal map for desktop
    }),
    env: "/images/studio.jpg",
  })

  // Texture optimization
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

  // Material configuration with alpha support for both platforms
  const material = useMemo(() => {
    const baseConfig = {
      map: textures.diffuse,
      alphaMap: textures.alpha,
      transparent: true,
      alphaTest: isMobile ? 0.1 : 0.2, // Slightly more aggressive alpha test on mobile
      side: DoubleSide,
      envMap: textures.env,
      envMapIntensity: isMobile ? 0.8 : 1.4,
      roughness: isMobile ? 1.2 : 1,
      metalness: isMobile ? 0.8 : 1.2,
    }

    // Add normal mapping only for desktop
    if (!isMobile && textures.normal) {
      baseConfig.normalMap = textures.normal
      baseConfig.normalScale = new Vector2(2, 2)
      baseConfig.normalMapType = TangentSpaceNormalMap
    }

    return new MeshStandardMaterial(baseConfig)
  }, [textures, isMobile])

  // Safe rendering
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
          frustumCulled={false} // Improve rendering for small elements
        />
      </group>
    </group>
  )
}
