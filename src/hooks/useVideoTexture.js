import { useState, useEffect, useRef, useCallback } from "react"
import * as THREE from "three"

export function useVideoTexture(videoPath) {
  const [texture, setTexture] = useState(null)
  const videoRef = useRef(null)
  const playAttemptedRef = useRef(false)

  useEffect(() => {
    try {
      const video = document.createElement("video")
      video.src = videoPath
      video.loop = true
      video.muted = true
      video.playsInline = true
      video.crossOrigin = "anonymous"
      video.preload = "auto"

      const handleError = e => {
        console.error("Video loading error:", e)
      }

      video.addEventListener("error", handleError)

      const handleLoadedData = () => {
        try {
          const videoTexture = new THREE.VideoTexture(video)
          videoTexture.minFilter = THREE.LinearFilter
          videoTexture.magFilter = THREE.LinearFilter
          videoTexture.flipY = true
          setTexture(videoTexture)
        } catch (e) {
          console.error("Error creating video texture:", e)
        }
      }

      video.addEventListener("loadeddata", handleLoadedData)
      video.load()

      videoRef.current = video

      return () => {
        video.removeEventListener("error", handleError)
        video.removeEventListener("loadeddata", handleLoadedData)
        if (video && !video.paused) {
          video.pause()
        }
        video.src = ""
        video.load()
      }
    } catch (error) {
      console.error("Error initializing video:", error)
    }
  }, [videoPath])

  const playVideo = useCallback(() => {
    if (!videoRef.current || playAttemptedRef.current) return

    setTimeout(() => {
      if (videoRef.current) {
        playAttemptedRef.current = true
        try {
          const playPromise = videoRef.current.play()

          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.log("Video play silently failed:", err)
              playAttemptedRef.current = false
            })
          }
        } catch (e) {
          console.log("Video play error:", e)
          playAttemptedRef.current = false
        }
      }
    }, 100)
  }, [])

  return { texture, playVideo }
}
