const videoCache = {}
const loadingPromises = {}

export async function getVideo(path, options = {}) {
  if (videoCache[path]) {
    return videoCache[path]
  }

  if (loadingPromises[path]) {
    return loadingPromises[path]
  }

  console.log(`🎥 [VideoCache] Carregando novo vídeo: ${path}`)

  const promise = new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.src = path
    video.loop = options.loop !== false
    video.muted = options.muted !== false
    video.playsInline = true
    video.preload = options.preload || "metadata"
    video.crossOrigin = options.crossOrigin || "anonymous"

    video.onloadeddata = () => {
      videoCache[path] = video
      delete loadingPromises[path]
      console.log(`🎥 [VideoCache] Vídeo carregado e armazenado: ${path}`)
      resolve(video)
    }

    video.onerror = err => {
      delete loadingPromises[path]
      console.error(`❌ [VideoCache] Erro ao carregar vídeo: ${path}`, err)
      reject(err)
    }

    video.load()
  })

  loadingPromises[path] = promise
  return promise
}

export function releaseVideo(path, options = {}) {
  const video = videoCache[path]
  if (video) {
    video.pause()
    delete videoCache[path]
    console.log(`🧹 [VideoCache] Liberado: ${path}`)
  }
}
