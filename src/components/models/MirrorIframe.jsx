import { Html, useGLTF } from "@react-three/drei"
import React, { useEffect, useState } from "react"
import * as THREE from "three"
import MirrorPage from "../iframes/Mirror"
import { useVideoTexture } from "../../hooks/useVideoTexture"

const MirrorIframe = ({ onReturnToMain, isActive, ...props }) => {
  // Estados
  const [uiState, setUiState] = useState({
    showContent: false,
    showButtons: false,
    opacity: 0,
    meshOpacity: 0,
  })

  // ✅ HOOK OTIMIZADO: Substitui todo o código de vídeo manual
  const { texture, video, loading, play, pause, stop } = useVideoTexture(
    "/video/Mirror.mp4",
    {
      loop: true,
      muted: true,
      playsInline: true,
      preload: "metadata",
    }
  )

  // Modelo 3D
  const { nodes } = useGLTF("/models/mirrorPos.glb")

  // ✅ CONTROLE OTIMIZADO: Usar funções do hook
  useEffect(() => {
    if (!video || loading) return

    if (isActive) {
      console.log("🎥 [MirrorIframe] Iniciando reprodução via hook")
      play()
    } else {
      console.log("🎥 [MirrorIframe] Pausando reprodução via hook")
      pause()
    }
  }, [isActive, video, loading, play, pause])

  // ✅ LISTENER OTIMIZADO: Usar função do hook
  useEffect(() => {
    const handleStopVideo = () => {
      if (video) {
        stop()
        console.log("🎥 [MirrorIframe] Vídeo pausado externamente via hook")

        // Também desativar o mirror se estiver ativo
        if (isActive) {
          deactivateMirror()
        }
      }
    }

    document.addEventListener("stopMirrorVideo", handleStopVideo)

    return () => {
      document.removeEventListener("stopMirrorVideo", handleStopVideo)
    }
  }, [video, isActive, stop])

  // Efeitos para animação
  useEffect(() => {
    if (isActive) {
      activateMirror()

      // Registrar que o mirror está sendo utilizado
      if (window.navigationSystem && window.navigationSystem.registerView) {
        window.navigationSystem.registerView("mirror")
      }

      // Disparar evento para abrir AiDatingCoachOverlay
      setTimeout(() => {
        const mirrorEvent = new CustomEvent("mirrorNavigation", {
          detail: { section: "aidatingcoach" },
        })
        window.dispatchEvent(mirrorEvent)
      }, 300)
    } else {
      deactivateMirror()
    }
  }, [isActive])

  // Handlers atualizados para controlar a mesh também
  const activateMirror = () => {
    // Primeiro, mostrar o conteúdo (ainda com opacidade 0)
    setUiState(prev => ({ ...prev, showContent: true }))
    playSound("mirror")

    // Adicionar um pequeno delay antes de iniciar a animação da mesh
    setTimeout(() => {
      // Animação gradual para a mesh ao longo de 800ms
      const startTime = Date.now()
      const duration = 800

      const animateMesh = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Função de easing para suavizar a transição
        const easeOutCubic = t => 1 - Math.pow(1 - t, 3)
        const easedProgress = easeOutCubic(progress)

        setUiState(prev => ({
          ...prev,
          meshOpacity: easedProgress,
        }))

        if (progress < 1) {
          requestAnimationFrame(animateMesh)
        }
      }

      requestAnimationFrame(animateMesh)
    }, 800)

    // Animação para o conteúdo HTML
    setTimeout(() => {
      setUiState(prev => ({ ...prev, opacity: 1 }))
      setTimeout(
        () => setUiState(prev => ({ ...prev, showButtons: true })),
        600
      )
    }, 800)
  }

  const deactivateMirror = () => {
    // Animar tudo para saída
    setUiState(prev => ({
      ...prev,
      opacity: 0,
      meshOpacity: 0,
      showButtons: false,
    }))
    stopSound("mirror")

    setTimeout(() => {
      setUiState(prev => ({ ...prev, showContent: false }))
    }, 800)
  }

  const handleBackToMain = () => {
    setUiState(prev => ({
      ...prev,
      opacity: 0,
      meshOpacity: 0,
      showButtons: false,
    }))

    const source = getNavigationSource("mirror")
    handleNavigation(source)

    setTimeout(() => {
      setUiState(prev => ({ ...prev, showContent: false }))
      onReturnToMain?.(source)
    }, 800)
  }

  const playSound = sound => {
    try {
      if (window.audioManager) {
        if (typeof window.audioManager.play === "function") {
          window.audioManager.play(sound)
          console.log(`🔊 [MirrorIframe] Som do ${sound} iniciado`)
        } else if (window.audioManager.sounds?.[sound]?.play) {
          window.audioManager.sounds[sound].play()
          console.log(`🔊 [MirrorIframe] Som do ${sound} iniciado via sounds`)
        }
      }
    } catch (error) {
      console.log(`🔊 [MirrorIframe] Erro ao reproduzir som ${sound}:`, error)
    }
  }

  const stopSound = sound => {
    try {
      if (window.audioManager) {
        if (typeof window.audioManager.stop === "function") {
          window.audioManager.stop(sound)
          console.log(`🔊 [MirrorIframe] Som do ${sound} parado`)
        } else if (window.audioManager.sounds?.[sound]?.stop) {
          window.audioManager.sounds[sound].stop()
          console.log(`🔊 [MirrorIframe] Som do ${sound} parado via sounds`)
        }
      }
    } catch (error) {
      console.log(`🔊 [MirrorIframe] Erro ao parar som ${sound}:`, error)
    }
  }

  const getNavigationSource = page =>
    window.navigationSystem?.getNavigationSource?.(page) || "direct"

  const handleNavigation = source => {
    if (source === "direct") {
      setTimeout(() => {
        try {
          if (window.audioManager) {
            if (typeof window.audioManager.play === "function") {
              window.audioManager.play("transition")
            }
            console.log("🔊 [MirrorIframe] Som de transição reproduzido")
          }
        } catch (error) {
          console.log(
            "🔊 [MirrorIframe] Erro ao reproduzir som de transição:",
            error
          )
        }
      }, 50)
    }

    // Parar todos os sons se necessário
    if (window.audioManager?.stopAllAudio) {
      window.audioManager.stopAllAudio()
    }

    if (typeof document !== "undefined") {
      document.dispatchEvent(new CustomEvent("returnToCastle"))
    }
  }

  return (
    <>
      {/* Grupo independente para a mesh (vidro do espelho) */}
      <group
        position={[-1.638, 1.524, -0.825]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      >
        <mesh geometry={nodes.glassF.geometry}>
          {/* ✅ TEXTURA OTIMIZADA: Usar texture do hook */}
          {texture && !loading && (
            <meshStandardMaterial
              map={texture}
              transparent={true}
              opacity={uiState.meshOpacity * 0.9}
              emissiveMap={texture}
              emissiveIntensity={0.5 * uiState.meshOpacity}
              emissive={new THREE.Color(0xffffff)}
            />
          )}
        </mesh>
      </group>

      {/* HTML Content removido para focar na otimização de vídeo */}
    </>
  )
}

export default MirrorIframe
