console.log("🔁 MirrorIframe MONTADO")
import { Html, useGLTF } from "@react-three/drei"
import React, { useEffect, useState, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { createRoot } from "react-dom/client"
import MirrorBg from "../animations/MirrorBg"

const MirrorIframe = ({ onReturnToMain, isActive, ...props }) => {
  // Estados
  const [uiState, setUiState] = useState({
    showContent: false,
    showButtons: false,
    opacity: 0,
    meshOpacity: 0,
  })

  // ✅ SIMPLIFICADO: Renderizar MirrorBg off-screen
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const textureRef = useRef(null)
  const reactRootRef = useRef(null)
  const [bgReady, setBgReady] = useState(false)

  // Modelo 3D
  const { nodes } = useGLTF("/models/mirrorPos.glb")

  // ✅ SETUP: Criar textura com gradientes (sem html2canvas)
  useEffect(() => {
    console.log("🎨 [MirrorIframe] Configurando MirrorBg como textura...")

    // Criar canvas para textura
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 512
    canvasRef.current = canvas

    // Criar textura animada com gradientes
    createAnimatedTexture()

    return () => {
      if (textureRef.current) {
        textureRef.current.dispose()
      }
    }
  }, [])

  // ✅ TEXTURA ANIMADA: Recrear o MirrorBg com gradientes nativos
  const createAnimatedTexture = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    let animationTime = 0

    const animate = () => {
      animationTime += 0.016 // ~60fps

      // Limpar canvas
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, 512, 512)

      // Calcular rotação (-45° a +45°)
      const rotation = Math.sin(animationTime * 1.5) * (Math.PI / 4)

      ctx.save()
      ctx.translate(100, 350) // Centro
      ctx.rotate(rotation)

      // Esfera Rosa (em cima) - gradiente radial MAIS FORTE
      const gradientPink = ctx.createRadialGradient(0, -120, 0, 0, -120, 150)
      gradientPink.addColorStop(0, "rgba(236, 72, 153, 1.0)") // 100% sólido
      gradientPink.addColorStop(0.3, "rgba(236, 72, 153, 0.8)") // 80%
      gradientPink.addColorStop(0.6, "rgba(236, 72, 153, 0.4)") // 40%
      gradientPink.addColorStop(1, "rgba(236, 72, 153, 0)") // transparente

      ctx.fillStyle = gradientPink
      ctx.beginPath()
      ctx.arc(0, -120, 150, 0, Math.PI * 2)
      ctx.fill()

      // Esfera Azul (embaixo) - gradiente radial MAIS FORTE
      const gradientBlue = ctx.createRadialGradient(0, 120, 0, 0, 120, 150)
      gradientBlue.addColorStop(0, "rgba(59, 130, 246, 1.0)") // 100% sólido
      gradientBlue.addColorStop(0.3, "rgba(59, 130, 246, 0.8)") // 80%
      gradientBlue.addColorStop(0.6, "rgba(59, 130, 246, 0.4)") // 40%
      gradientBlue.addColorStop(1, "rgba(59, 130, 246, 0)") // transparente

      ctx.fillStyle = gradientBlue
      ctx.beginPath()
      ctx.arc(0, 120, 150, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()

      // Criar/atualizar textura
      if (!textureRef.current) {
        const canvasTexture = new THREE.CanvasTexture(canvas)
        canvasTexture.needsUpdate = true
        canvasTexture.wrapS = THREE.ClampToEdgeWrapping
        canvasTexture.wrapT = THREE.ClampToEdgeWrapping
        canvasTexture.flipY = false
        textureRef.current = canvasTexture
        setBgReady(true)
        console.log("✅ [MirrorIframe] MirrorBg animado criado")
      } else {
        textureRef.current.needsUpdate = true
      }

      requestAnimationFrame(animate)
    }

    animate()
  }

  // ✅ SIMPLIFICADO: Controle sem vídeo
  useEffect(() => {
    if (isActive) {
      console.log("🎨 [MirrorIframe] Ativando MirrorBg no espelho")
    } else {
      console.log("🎨 [MirrorIframe] Desativando MirrorBg")
    }
  }, [isActive])

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
          {/* ✅ TEXTURA DO MirrorBg REAL: Componente original importado */}
          {textureRef.current && bgReady ? (
            <meshStandardMaterial
              map={textureRef.current}
              transparent={true}
              opacity={uiState.meshOpacity}
              emissiveMap={textureRef.current}
              emissiveIntensity={0.8}
              emissive={new THREE.Color(0x333333)}
              side={THREE.DoubleSide}
            />
          ) : (
            <meshStandardMaterial
              color="#FF0000"
              transparent={true}
              opacity={uiState.meshOpacity}
            />
          )}
        </mesh>
      </group>
    </>
  )
}

export default MirrorIframe
