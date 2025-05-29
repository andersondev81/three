import { useState, useEffect, useRef } from "react"
import * as THREE from "three"
import { getVideo, releaseVideo } from "../utils/VideoCache"

/**
 * 🎥 HOOK OTIMIZADO PARA TEXTURAS DE VÍDEO
 * Substitui createElement manual com sistema de cache
 */
export const useVideoTexture = (videoPath, options = {}) => {
  // Early return for invalid videoPath
  const isValidPath = videoPath && typeof videoPath === "string"

  const [texture, setTexture] = useState(null)
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(isValidPath)
  const [error, setError] = useState(null)

  const mounted = useRef(true)
  const textureRef = useRef(null)

  useEffect(() => {
    // Reset mounted flag
    mounted.current = true

    // Skip if no valid video path
    if (!isValidPath) {
      setLoading(false)
      setTexture(null)
      setVideo(null)
      setError(null)
      return
    }

    const initializeVideo = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log(`🎥 [useVideoTexture] Carregando: ${videoPath}`)

        // ✅ USAR CACHE: ao invés de createElement
        const videoElement = await getVideo(videoPath, {
          loop: options.loop !== false, // Default true
          muted: options.muted !== false, // Default true
          playsInline: true,
          preload: options.preload || "metadata",
          crossOrigin: options.crossOrigin || "anonymous",
          ...options,
        })

        if (!mounted.current) {
          // Component foi desmontado durante loading
          releaseVideo(videoPath, options)
          return
        }

        // Criar textura THREE.js
        const videoTexture = new THREE.VideoTexture(videoElement)
        videoTexture.minFilter = THREE.LinearFilter
        videoTexture.magFilter = THREE.LinearFilter
        videoTexture.format = THREE.RGBFormat
        videoTexture.flipY = false

        // Configurações adicionais da textura
        if (options.wrapS) videoTexture.wrapS = options.wrapS
        if (options.wrapT) videoTexture.wrapT = options.wrapT
        if (options.generateMipmaps !== undefined) {
          videoTexture.generateMipmaps = options.generateMipmaps
        }

        textureRef.current = videoTexture
        setVideo(videoElement)
        setTexture(videoTexture)
        setLoading(false)

        console.log(`🎥 [useVideoTexture] Sucesso: ${videoPath}`)
      } catch (err) {
        console.error(`🎥 [useVideoTexture] Erro: ${videoPath}`, err)
        if (mounted.current) {
          setError(err)
          setLoading(false)
        }
      }
    }

    initializeVideo()

    return () => {
      mounted.current = false

      // ✅ CLEANUP: Liberar recursos
      if (textureRef.current) {
        textureRef.current.dispose()
        textureRef.current = null
      }

      if (video) {
        video.pause()
        releaseVideo(videoPath, options)
        console.log(`🎥 [useVideoTexture] Cleanup: ${videoPath}`)
      }
    }
  }, [videoPath, isValidPath]) // Dependencies

  // Controle de reprodução
  const play = () => {
    if (video && video.paused) {
      video.play().catch(console.warn)
    }
  }

  const pause = () => {
    if (video && !video.paused) {
      video.pause()
    }
  }

  const stop = () => {
    if (video) {
      video.pause()
      video.currentTime = 0
    }
  }

  // Auto-play se especificado
  useEffect(() => {
    if (video && options.autoplay && !loading) {
      play()
    }
  }, [video, options.autoplay, loading])

  return {
    texture, // THREE.VideoTexture
    video, // HTMLVideoElement
    loading, // boolean
    error, // Error | null
    play, // Function
    pause, // Function
    stop, // Function
  }
}

/**
 * 🎥 HOOK SIMPLIFICADO APENAS PARA ELEMENTO DE VÍDEO
 * Para casos que não precisam de textura THREE.js
 */
export const useVideo = (videoPath, options = {}) => {
  const isValidPath = videoPath && typeof videoPath === "string"

  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(isValidPath)
  const [error, setError] = useState(null)

  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true

    if (!isValidPath) {
      setLoading(false)
      setVideo(null)
      setError(null)
      return
    }

    const loadVideo = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log(`🎥 [useVideo] Carregando: ${videoPath}`)

        const videoElement = await getVideo(videoPath, {
          loop: options.loop !== false,
          muted: options.muted !== false,
          playsInline: true,
          preload: options.preload || "metadata",
          ...options,
        })

        if (!mounted.current) {
          releaseVideo(videoPath, options)
          return
        }

        setVideo(videoElement)
        setLoading(false)

        console.log(`🎥 [useVideo] Sucesso: ${videoPath}`)
      } catch (err) {
        console.error(`🎥 [useVideo] Erro: ${videoPath}`, err)
        if (mounted.current) {
          setError(err)
          setLoading(false)
        }
      }
    }

    loadVideo()

    return () => {
      mounted.current = false

      if (video) {
        video.pause()
        releaseVideo(videoPath, options)
        console.log(`🎥 [useVideo] Cleanup: ${videoPath}`)
      }
    }
  }, [videoPath, isValidPath])

  const play = () => video?.play().catch(console.warn)
  const pause = () => video?.pause()
  const stop = () => {
    if (video) {
      video.pause()
      video.currentTime = 0
    }
  }

  return { video, loading, error, play, pause, stop }
}
