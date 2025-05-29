import { useState, useEffect } from "react"

export const useVideoLoader = () => {
  const [progress, setProgress] = useState(0)
  const [videosLoaded, setVideosLoaded] = useState(false)

  // Lista de vídeos que precisam ser carregados
  const videoSources = [
    "/videos/portal.mp4",
    "/videos/water.mp4",
    // Adicione outros vídeos se necessário
  ]

  useEffect(() => {
    if (videoSources.length === 0) {
      setVideosLoaded(true)
      return
    }

    let loadedCount = 0

    videoSources.forEach(src => {
      const video = document.createElement("video")
      video.src = src

      video.onloadeddata = () => {
        loadedCount++
        const newProgress = Math.round(
          (loadedCount / videoSources.length) * 100
        )
        setProgress(newProgress)

        if (loadedCount === videoSources.length) {
          setVideosLoaded(true)
        }
      }

      video.onerror = () => {
        console.error(`Error loading video: ${src}`)
        loadedCount++
        if (loadedCount === videoSources.length) {
          setVideosLoaded(true)
        }
      }
    })
  }, [])

  return { progress, videosLoaded }
}
