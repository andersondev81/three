// Flower.jsx - Refatorado para evitar carregamento duplicado e otimizar para mobile
import React, { useMemo } from "react"
import { useGLTF, useTexture } from "@react-three/drei"
import {
  MeshStandardMaterial,
  NearestFilter,
  DoubleSide,
  EquirectangularReflectionMapping,
} from "three"
import * as THREE from "three"
import { useThree } from "@react-three/fiber"

const useMobileDetection = () => {
  const { size } = useThree()
  const isMobile = size.width < 768
  return isMobile
}

export function Flower(props) {
  const { nodes } = useGLTF("/models/Flower.glb")
  const isMobile = useMobileDetection()

  const textureProps = useMemo(() => {
    return isMobile
      ? {
          diffuse: "/texture/FlowersColor.avif",
          env: "/images/studio.jpg",
        }
      : {
          diffuse: "/texture/FlowersColor.avif",
          normal: "/texture/Flowers_Normal.avif",
          alpha: "/texture/Flowers_Alpha.avif",
          env: "/images/studio.jpg",
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

    if (textures.env) {
      textures.env.mapping = EquirectangularReflectionMapping
    }
  }, [textures])

  const material = useMemo(() => {
    const baseMaterialProps = {
      map: textures.diffuse,
      envMap: textures.env,
      envMapIntensity: isMobile ? 0.8 : 1.4,
      side: DoubleSide,
      roughness: isMobile ? 1.2 : 1,
      metalness: isMobile ? 0.8 : 1.2,
    }

    if (!isMobile) {
      if (textures.normal) {
        baseMaterialProps.normalMap = textures.normal
        baseMaterialProps.normalScale = new THREE.Vector2(2, 2)
        baseMaterialProps.normalMapType = THREE.TangentSpaceNormalMap
      }

      if (textures.alpha) {
        baseMaterialProps.alphaMap = textures.alpha
        baseMaterialProps.transparent = true
        baseMaterialProps.alphaTest = 0.2
      }
    }

    return new THREE.MeshStandardMaterial(baseMaterialProps)
  }, [textures, isMobile])

  if (!nodes || !nodes.flowers) {
    console.warn("Flower nodes not loaded yet")
    return null
  }

  return (
    <group {...props} dispose={null}>
      <group position={[0, 0, 0]}>
        <mesh geometry={nodes.flowers.geometry} material={material} />
      </group>
    </group>
  )
}
