import { useGLTF, useTexture } from "@react-three/drei"
import { useLoader } from "@react-three/fiber"
import { useMemo } from "react"
import * as THREE from "three"
import {
  TextureLoader,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MeshBasicMaterial,
  DoubleSide,
  NearestFilter,
  EquirectangularReflectionMapping,
} from "three"
import RotateAxis from "../../components/helpers/RotateAxis"

// Configurações de textura
const TEXTURE_SETTINGS = {
  flipY: false,
  minFilter: NearestFilter,
  magFilter: NearestFilter,
}

// OTIMIZADO: Carregamento consolidado de todas as texturas do Pole
const usePoleTextures = () => {
  return useTexture({
    // Pole textures
    poleColor: "/texture/PoleColor.avif",
    poleMetallic: "/texture/Pole_Metallic.avif",
    poleRoughness: "/texture/Pole_Roughness.avif",

    // Hearts textures
    heartColor: "/texture/heartColor.avif",
    heartEmissive: "/texture/HeartPoleEmissive.avif",

    // Environment maps
    studioEnv: "/images/studio.jpg",
  })
}

const usePoleMaterial = () => {
  const textures = usePoleTextures()

  useMemo(() => {
    // Configure pole textures
    ;[
      textures.poleColor,
      textures.poleMetallic,
      textures.poleRoughness,
    ].forEach(texture => {
      if (texture) Object.assign(texture, TEXTURE_SETTINGS)
    })

    if (textures.studioEnv) {
      textures.studioEnv.mapping = EquirectangularReflectionMapping
    }
  }, [textures])

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.poleColor,
        metalnessMap: textures.poleMetallic,
        roughnessMap: textures.poleRoughness,
        envMap: textures.studioEnv,
        envMapIntensity: 2,
        side: DoubleSide,
        roughness: 0.7,
        metalness: 0.7,
      }),
    [textures]
  )
}

const useHeartsMaterial = () => {
  const textures = usePoleTextures()

  useMemo(() => {
    // Configure hearts textures
    ;[textures.heartColor, textures.heartEmissive].forEach(texture => {
      if (texture) Object.assign(texture, TEXTURE_SETTINGS)
    })

    if (textures.studioEnv) {
      textures.studioEnv.mapping = EquirectangularReflectionMapping
    }
  }, [textures])

  return useMemo(
    () =>
      new MeshPhysicalMaterial({
        map: textures.heartColor,
        emissiveMap: textures.heartEmissive,
        envMap: textures.studioEnv,
        side: DoubleSide,
        emissive: new THREE.Color(0x00bdff),
        emissiveIntensity: 6,
        metalness: 1.2,
        roughness: 0.5,
        envMapIntensity: 3.5,
      }),
    [textures]
  )
}

const useFlowersMaterial = () => {
  const textures = usePoleTextures()

  useMemo(() => {
    // Configure flowers textures (reusing pole textures)
    ;[
      textures.poleColor,
      textures.poleMetallic,
      textures.poleRoughness,
    ].forEach(texture => {
      if (texture) Object.assign(texture, TEXTURE_SETTINGS)
    })

    if (textures.studioEnv) {
      textures.studioEnv.mapping = EquirectangularReflectionMapping
    }
  }, [textures])

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.poleColor,
        metalnessMap: textures.poleMetallic,
        roughnessMap: textures.poleRoughness,
        envMap: textures.studioEnv,
        envMapIntensity: 1,
        side: DoubleSide,
        roughness: 1,
        metalness: 0.5,
      }),
    [textures]
  )
}

export function Pole({ onSectionChange, ...props }) {
  const { nodes } = useGLTF("/models/Pole.glb")
  const material = usePoleMaterial()
  const materialHearts = useHeartsMaterial()
  const materialFlowers = useFlowersMaterial()

  const createClickHandler = (sectionIndex, sectionName) => e => {
    e.stopPropagation()
    // console.log(`Pole: Clicked on section ${sectionName}`)

    // Tag this navigation as coming from the pole
    if (window.navigationSystem) {
      // Get the corresponding element ID for this section
      const elementId =
        sectionName === "aidatingcoach"
          ? "mirror"
          : sectionName === "token"
          ? "atm"
          : sectionName === "roadmap"
          ? "scroll"
          : sectionName === "about"
          ? "orb" // Adicionado este caso
          : null

      if (elementId) {
        if (window.navigationSystem.setNavigationSource) {
          window.navigationSystem.setNavigationSource(elementId, "pole")
        }

        // Clear any stored position to ensure we don't return to a specific camera position
        if (window.navigationSystem.clearPositionForElement) {
          window.navigationSystem.clearPositionForElement(elementId)
        }
      }
    }

    if (onSectionChange && typeof onSectionChange === "function") {
      onSectionChange(sectionIndex, sectionName)
    }

    if (window.globalNavigation && window.globalNavigation.navigateTo) {
      window.globalNavigation.navigateTo(sectionName)
    }
  }

  const pointerHandlers = {
    onPointerEnter: e => {
      e.stopPropagation()
      document.body.style.cursor = "pointer"
    },
    onPointerLeave: e => {
      e.stopPropagation()
      document.body.style.cursor = "default"
    },
  }

  // Verificar se os nós existem antes de tentar acessar suas geometrias
  if (!nodes || !nodes.pole) {
    console.warn("Pole nodes not loaded properly")
    return null
  }

  return (
    <group {...props} dispose={null}>
      <group position={[0.2, -0.35, -0.2]} rotation={[0, Math.PI + 5, 0]}>
        <mesh geometry={nodes.pole.geometry} material={material} />
        <mesh geometry={nodes.flowers.geometry} material={materialFlowers} />
        {nodes.aidatingcoach && (
          <mesh
            geometry={nodes.aidatingcoach.geometry}
            material={materialHearts}
            onClick={e => {
              createClickHandler(2, "aidatingcoach")(e)
              if (window.audioManager && window.audioManager.play) {
                window.audioManager.play("transition")
              }
            }}
            {...pointerHandlers}
          />
        )}

        {nodes.roadmap && (
          <mesh
            geometry={nodes.roadmap.geometry}
            material={materialHearts}
            onClick={e => {
              createClickHandler(5, "roadmap")(e)
              if (window.audioManager && window.audioManager.play) {
                window.audioManager.play("transition")
              }
            }}
            {...pointerHandlers}
          />
        )}

        {nodes.download && (
          <mesh
            geometry={nodes.download.geometry}
            material={materialHearts}
            onClick={e => {
              createClickHandler(3, "download")(e)
              if (window.audioManager && window.audioManager.play) {
                window.audioManager.play("transition")
              }
            }}
          />
        )}

        {nodes.about && (
          <mesh
            geometry={nodes.about.geometry}
            material={materialHearts}
            onClick={e => {
              createClickHandler(1, "about")(e)
              if (window.audioManager && window.audioManager.play) {
                window.audioManager.play("transition")
              }
            }}
          />
        )}

        <group position={[-0.014, 2.547, -0.003]}>
          <RotateAxis axis="y" speed={1}>
            {nodes.token && (
              <mesh
                geometry={nodes.token.geometry}
                material={materialHearts}
                onClick={e => {
                  createClickHandler(4, "token")(e)
                  if (window.audioManager && window.audioManager.play) {
                    window.audioManager.play("transition")
                  }
                }}
              />
            )}
          </RotateAxis>
        </group>
      </group>
    </group>
  )
}
