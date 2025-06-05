import { useGLTF, useTexture } from "@react-three/drei"
import { useMemo, useState, useEffect } from "react"
import * as THREE from "three"
import {
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  DoubleSide,
  NearestFilter,
} from "three"
import RotateAxis from "../../components/helpers/RotateAxis"
import { useStudioEnvironment } from "../../utils/useSharedEnvironmentMaps"

const TEXTURE_SETTINGS = {
  flipY: false,
  minFilter: NearestFilter,
  magFilter: NearestFilter,
}

// Hook personalizado para detectar tamanho da tela
const useScreenSize = () => {
  const [isLargeScreen, setIsLargeScreen] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 768)
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)

    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  return isLargeScreen
}

const usePoleTextures = () => {
  return useTexture({
    poleColor: "/texture/PoleColor.avif",
    poleMetallic: "/texture/Pole_Metallic.avif",
    poleRoughness: "/texture/Pole_Roughness.avif",
    heartColor: "/texture/heartColor.avif",
    heartEmissive: "/texture/HeartPoleEmissive.avif",
  })
}

const usePoleMaterial = () => {
  const textures = usePoleTextures()
  const studioEnv = useStudioEnvironment()

  useMemo(() => {
    ;[
      textures.poleColor,
      textures.poleMetallic,
      textures.poleRoughness,
    ].forEach(texture => {
      if (texture) Object.assign(texture, TEXTURE_SETTINGS)
    })
  }, [textures])

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.poleColor,
        metalnessMap: textures.poleMetallic,
        roughnessMap: textures.poleRoughness,
        envMap: studioEnv,
        envMapIntensity: 2,
        side: DoubleSide,
        roughness: 0.7,
        metalness: 0.7,
      }),
    [textures, studioEnv]
  )
}

const useHeartsMaterial = () => {
  const textures = usePoleTextures()
  const studioEnv = useStudioEnvironment()

  useMemo(() => {
    ;[textures.heartColor, textures.heartEmissive].forEach(texture => {
      if (texture) Object.assign(texture, TEXTURE_SETTINGS)
    })
  }, [textures])

  return useMemo(
    () =>
      new MeshPhysicalMaterial({
        map: textures.heartColor,
        emissiveMap: textures.heartEmissive,
        envMap: studioEnv,
        side: DoubleSide,
        emissive: new THREE.Color(0x00bdff),
        emissiveIntensity: 6,
        metalness: 1.2,
        roughness: 0.5,
        envMapIntensity: 3.5,
      }),
    [textures, studioEnv]
  )
}

const useFlowersMaterial = () => {
  const textures = usePoleTextures()
  const studioEnv = useStudioEnvironment()

  useMemo(() => {
    ;[
      textures.poleColor,
      textures.poleMetallic,
      textures.poleRoughness,
    ].forEach(texture => {
      if (texture) Object.assign(texture, TEXTURE_SETTINGS)
    })
  }, [textures])

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.poleColor,
        metalnessMap: textures.poleMetallic,
        roughnessMap: textures.poleRoughness,
        envMap: studioEnv,
        envMapIntensity: 1,
        side: DoubleSide,
        roughness: 1,
        metalness: 0.5,
      }),
    [textures, studioEnv]
  )
}

export function Pole({ onSectionChange, ...props }) {
  const { nodes } = useGLTF("/models/Pole.glb")
  const material = usePoleMaterial()
  const materialHearts = useHeartsMaterial()
  const materialFlowers = useFlowersMaterial()
  const isLargeScreen = useScreenSize()

  // 🔥 ESTADO LOCAL: Flag para prevenir múltiplos cliques
  const [isNavigating, setIsNavigating] = useState(false)

  const rotation = useMemo(() => {
    return isLargeScreen
      ? [0, Math.PI + 5, 0] // Screen Big
      : [0, Math.PI + 4.6, 0] // Screen Small
  }, [isLargeScreen])

  // 🔥 REFATORAÇÃO: Handler melhorado com reset e controle de estado
  const createClickHandler = (sectionIndex, sectionName) => e => {
    e.stopPropagation()

    // 🛡️ PROTEÇÃO: Prevenir cliques múltiplos/simultâneos
    if (isNavigating) {
      console.log(
        `🚫 Pole: Already navigating, ignoring click to ${sectionName}`
      )
      return
    }

    console.log(`🎯 Pole: Starting navigation to ${sectionName}`)
    setIsNavigating(true)

    // 🔄 RESET: Limpar todos os iframes antes de navegar
    if (window.resetIframes) {
      console.log("🔄 Pole: Resetting iframes before navigation")
      window.resetIframes()
    }

    // 🗺️ NAVEGAÇÃO: Configurar sistema de navegação
    if (window.navigationSystem) {
      const elementId =
        sectionName === "aidatingcoach"
          ? "mirror"
          : sectionName === "token"
          ? "atm"
          : sectionName === "roadmap"
          ? "scroll"
          : sectionName === "about"
          ? "orb"
          : null

      if (elementId) {
        if (window.navigationSystem.setNavigationSource) {
          window.navigationSystem.setNavigationSource(elementId, "pole")
        }

        if (window.navigationSystem.clearPositionForElement) {
          window.navigationSystem.clearPositionForElement(elementId)
        }
      }
    }

    // ⏱️ DELAY: Garantir que o reset foi processado antes de navegar
    setTimeout(() => {
      try {
        if (onSectionChange && typeof onSectionChange === "function") {
          console.log(
            `📞 Pole: Calling onSectionChange(${sectionIndex}, "${sectionName}")`
          )
          onSectionChange(sectionIndex, sectionName)
        }

        if (window.globalNavigation && window.globalNavigation.navigateTo) {
          console.log(
            `🌐 Pole: Calling globalNavigation.navigateTo("${sectionName}")`
          )
          window.globalNavigation.navigateTo(sectionName)
        }
      } catch (error) {
        console.error(
          `❌ Pole: Error during navigation to ${sectionName}:`,
          error
        )
      }

      // 🔓 LIBERAÇÃO: Reset flag após um delay maior para evitar clicks muito rápidos
      setTimeout(() => {
        setIsNavigating(false)
        console.log(`✅ Pole: Navigation to ${sectionName} completed`)
      }, 1000)
    }, 100) // Delay para garantir que o reset foi aplicado
  }

  // 🎯 HANDLERS: Gerenciadores de eventos de ponteiro melhorados
  const createPointerHandlers = sectionName => ({
    onPointerEnter: e => {
      if (isNavigating) return
      e.stopPropagation()
      document.body.style.cursor = "pointer"
      console.log(`👆 Pole: Pointer enter ${sectionName}`)
    },
    onPointerLeave: e => {
      e.stopPropagation()
      document.body.style.cursor = "default"
      console.log(`👆 Pole: Pointer leave ${sectionName}`)
    },
  })

  // 🎵 AUDIO: Handler para tocar som de transição
  const playTransitionSound = () => {
    if (window.audioManager && window.audioManager.play) {
      window.audioManager.play("transition")
    }
  }

  // 🧹 CLEANUP: useEffect para limpeza quando componente é desmontado
  useEffect(() => {
    console.log("🏗️ Pole: Component mounted")

    // Reset inicial do estado de navegação
    setIsNavigating(false)

    return () => {
      console.log("🧹 Pole: Component unmounting")

      // Reset flag de navegação
      setIsNavigating(false)

      // Reset iframes se existir a função
      if (window.resetIframes) {
        console.log("🔄 Pole: Final cleanup - resetting iframes")
        window.resetIframes()
      }

      // Reset cursor
      document.body.style.cursor = "default"
    }
  }, [])

  // 🛡️ PROTEÇÃO: Verificar se nodes foram carregados corretamente
  if (!nodes || !nodes.pole) {
    console.warn("⚠️ Pole: Nodes not loaded properly")
    return null
  }

  return (
    <group {...props} dispose={null}>
      <group position={[0.2, -0.35, -0.2]} rotation={rotation}>
        {/* 🏛️ ESTRUTURA BASE */}
        <mesh geometry={nodes.pole.geometry} material={material} />
        <mesh geometry={nodes.flowers.geometry} material={materialFlowers} />

        {/* 💕 AI DATING COACH */}
        {nodes.aidatingcoach && (
          <mesh
            geometry={nodes.aidatingcoach.geometry}
            material={materialHearts}
            onClick={e => {
              if (isNavigating) return
              createClickHandler(2, "aidatingcoach")(e)
              playTransitionSound()
            }}
            {...createPointerHandlers("aidatingcoach")}
          />
        )}

        {/* 🗺️ ROADMAP */}
        {nodes.roadmap && (
          <mesh
            geometry={nodes.roadmap.geometry}
            material={materialHearts}
            onClick={e => {
              if (isNavigating) return
              createClickHandler(5, "roadmap")(e)
              playTransitionSound()
            }}
            {...createPointerHandlers("roadmap")}
          />
        )}

        {/* 📥 DOWNLOAD */}
        {nodes.download && (
          <mesh
            geometry={nodes.download.geometry}
            material={materialHearts}
            onClick={e => {
              if (isNavigating) return
              createClickHandler(3, "download")(e)
              playTransitionSound()
            }}
            {...createPointerHandlers("download")}
          />
        )}

        {/* ℹ️ ABOUT */}
        {nodes.about && (
          <mesh
            geometry={nodes.about.geometry}
            material={materialHearts}
            onClick={e => {
              if (isNavigating) return
              createClickHandler(1, "about")(e)
              playTransitionSound()
            }}
            {...createPointerHandlers("about")}
          />
        )}

        {/* 🪙 TOKEN - Com rotação */}
        <group position={[-0.014, 2.547, -0.003]}>
          <RotateAxis axis="y" speed={1}>
            {nodes.token && (
              <mesh
                geometry={nodes.token.geometry}
                material={materialHearts}
                onClick={e => {
                  if (isNavigating) return
                  createClickHandler(4, "token")(e)
                  playTransitionSound()
                }}
                {...createPointerHandlers("token")}
              />
            )}
          </RotateAxis>
        </group>
      </group>
    </group>
  )
}
