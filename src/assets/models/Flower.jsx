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

// Hook customizado para detectar dispositivos móveis
const useMobileDetection = () => {
  // Aproveitar o detector de dispositivos móveis existente no ThreeJS context
  const { size } = useThree()
  const isMobile = size.width < 768
  return isMobile
}

export function Flower(props) {
  const { nodes } = useGLTF("/models/Flower.glb")
  const isMobile = useMobileDetection()

  // Carregar texturas com base no tipo de dispositivo
  const textureProps = useMemo(() => {
    return isMobile
      ? {
          // Versão simplificada para dispositivos móveis com menos texturas
          diffuse: "/texture/FlowersColor.avif",
          env: "/images/studio.jpg",
        }
      : {
          // Versão completa para desktop
          diffuse: "/texture/FlowersColor.avif",
          normal: "/texture/Flowers_Normal.avif",
          alpha: "/texture/Flowers_Alpha.avif",
          env: "/images/studio.jpg",
        }
  }, [isMobile])

  const textures = useTexture(textureProps)

  // Configure textures - otimizado para evitar reconfigurações desnecessárias
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

  // Criação do material com base no tipo de dispositivo
  const material = useMemo(() => {
    const baseMaterialProps = {
      map: textures.diffuse,
      envMap: textures.env,
      envMapIntensity: isMobile ? 0.8 : 1.4,
      side: DoubleSide,
      roughness: isMobile ? 1.2 : 1,
      metalness: isMobile ? 0.8 : 1.2,
    }

    // Adicionar propriedades extras apenas para desktop
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

  // Renderização com tratamento de erro para garantir que não quebre se os nós não estiverem carregados
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

// Remover preloads duplicados - isso agora é feito centralmente no ResourcePreloader
