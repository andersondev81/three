import { useState, useEffect, useRef } from "react"
import * as THREE from "three"
import { getVideo, releaseVideo } from "../utils/VideoCache"

export const useVideoTexture = (videoPath, options = {}) => {
  const isValidPath = videoPath && typeof videoPath === "string"

  const [texture, setTexture] = useState(null)
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(isValidPath)
  const [error, setError] = useState(null)

  const mounted = useRef(true)
  const textureRef = useRef(null)

  useEffect(() => {
    mounted.current = true

    if (!isValidPath) {
      setLoading(false)
      setTexture(null)
      setVideo(null)
      setError(null)
      return
    }

    const load = async () => {
      try {
        console.log(`🎥 [useVideoTexture] → ${videoPath}`)
        setLoading(true)
        setError(null)

        const videoElement = await getVideo(videoPath, {
          loop: options.loop !== false,
          muted: options.muted !== false,
          playsInline: true,
          preload: options.preload || "metadata",
          crossOrigin: options.crossOrigin || "anonymous",
          ...options,
        })

        if (!mounted.current) {
          releaseVideo(videoPath, options)
          return
        }

        const videoTexture = new THREE.VideoTexture(videoElement)
        videoTexture.minFilter = THREE.LinearFilter
        videoTexture.magFilter = THREE.LinearFilter
        videoTexture.format = THREE.RGBFormat
        videoTexture.flipY = false

        if (options.wrapS) videoTexture.wrapS = options.wrapS
        if (options.wrapT) videoTexture.wrapT = options.wrapT
        if (options.generateMipmaps !== undefined)
          videoTexture.generateMipmaps = options.generateMipmaps

        textureRef.current = videoTexture
        setTexture(videoTexture)
        setVideo(videoElement)
        setLoading(false)

        console.log(`✅ [useVideoTexture] Carregado: ${videoPath}`)
      } catch (err) {
        console.error(`❌ [useVideoTexture] Erro: ${videoPath}`, err)
        if (mounted.current) {
          setError(err)
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      mounted.current = false

      if (textureRef.current) {
        textureRef.current.dispose()
        textureRef.current = null
      }

      if (video) {
        video.pause()
        releaseVideo(videoPath, options)
        console.log(`🧹 [useVideoTexture] Cleanup: ${videoPath}`)
      }
    }
  }, [videoPath])

  // Auto-play se especificado
  useEffect(() => {
    if (video && options.autoplay && !loading) {
      video.play().catch(console.warn)
    }
  }, [video, options.autoplay, loading])

  return {
    texture,
    video,
    loading,
    error,
    play: () => video?.paused && video.play().catch(console.warn),
    pause: () => video?.pause(),
    stop: () => {
      if (video) {
        video.pause()
        video.currentTime = 0
      }
    },
  }
}
