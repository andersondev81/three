/**
 * 🎥 SISTEMA DE CACHE DE VÍDEOS CENTRALIZADO
 * Evita carregar o mesmo vídeo múltiplas vezes
 * Similar ao sistema de eventos que criamos
 */

class VideoCache {
  constructor() {
    this.cache = new Map()
    this.loadingPromises = new Map()
    this.usageCount = new Map()

    console.log("🎥 [VideoCache] Inicializado")
  }

  /**
   * Obtém um vídeo do cache ou carrega se necessário
   * @param {string} src - URL do vídeo
   * @param {Object} options - Opções do vídeo
   * @returns {Promise<HTMLVideoElement>}
   */
  async getVideo(src, options = {}) {
    const cacheKey = this.getCacheKey(src, options)

    // Se já está no cache, reutilizar
    if (this.cache.has(cacheKey)) {
      console.log(`🎥 [VideoCache] Reutilizando vídeo: ${src}`)
      const video = this.cache.get(cacheKey)
      this.incrementUsage(cacheKey)
      return this.cloneVideo(video, options)
    }

    // Se está carregando, aguardar
    if (this.loadingPromises.has(cacheKey)) {
      console.log(`🎥 [VideoCache] Aguardando carregamento: ${src}`)
      const video = await this.loadingPromises.get(cacheKey)
      this.incrementUsage(cacheKey)
      return this.cloneVideo(video, options)
    }

    // Carregar novo vídeo
    console.log(`🎥 [VideoCache] Carregando novo vídeo: ${src}`)
    const loadingPromise = this.loadVideo(src, options)
    this.loadingPromises.set(cacheKey, loadingPromise)

    try {
      const video = await loadingPromise
      this.cache.set(cacheKey, video)
      this.usageCount.set(cacheKey, 1)
      this.loadingPromises.delete(cacheKey)

      console.log(`🎥 [VideoCache] Vídeo carregado e armazenado: ${src}`)
      return this.cloneVideo(video, options)
    } catch (error) {
      this.loadingPromises.delete(cacheKey)
      console.error(`🎥 [VideoCache] Erro ao carregar vídeo: ${src}`, error)
      throw error
    }
  }

  /**
   * Carrega um vídeo com otimizações
   * @param {string} src - URL do vídeo
   * @param {Object} options - Opções do vídeo
   * @returns {Promise<HTMLVideoElement>}
   */
  loadVideo(src, options = {}) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video")

      // Configurações otimizadas
      video.preload = options.preload || "metadata" // Não fazer preload completo
      video.muted = options.muted !== false // Muted por padrão
      video.playsInline = true
      video.crossOrigin = options.crossOrigin || "anonymous"

      // Configurações de loop e controles
      if (options.loop !== undefined) video.loop = options.loop
      if (options.controls !== undefined) video.controls = options.controls
      if (options.autoplay !== undefined) video.autoplay = options.autoplay

      // Timeout para evitar travamento
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout loading video: ${src}`))
      }, 15000)

      // Event listeners
      const onLoaded = () => {
        clearTimeout(timeout)
        video.removeEventListener("loadedmetadata", onLoaded)
        video.removeEventListener("error", onError)
        resolve(video)
      }

      const onError = error => {
        clearTimeout(timeout)
        video.removeEventListener("loadedmetadata", onLoaded)
        video.removeEventListener("error", onError)
        reject(error)
      }

      video.addEventListener("loadedmetadata", onLoaded)
      video.addEventListener("error", onError)

      // Iniciar carregamento
      video.src = src
    })
  }

  /**
   * Clona um vídeo do cache para uso independente
   * @param {HTMLVideoElement} originalVideo
   * @param {Object} options
   * @returns {HTMLVideoElement}
   */
  cloneVideo(originalVideo, options = {}) {
    const video = document.createElement("video")

    // Copiar propriedades básicas
    video.src = originalVideo.src
    video.preload = "none" // Clone não precisa preload
    video.muted = options.muted !== false
    video.playsInline = true
    video.crossOrigin = originalVideo.crossOrigin

    // Configurações específicas do uso
    if (options.loop !== undefined) video.loop = options.loop
    if (options.controls !== undefined) video.controls = options.controls
    if (options.autoplay !== undefined) video.autoplay = options.autoplay
    if (options.volume !== undefined) video.volume = options.volume

    // Sincronizar com vídeo original se estiver reproduzindo
    if (options.syncWithOriginal && !originalVideo.paused) {
      video.currentTime = originalVideo.currentTime
    }

    return video
  }

  /**
   * Gera chave de cache baseada em src e opções relevantes
   * @param {string} src
   * @param {Object} options
   * @returns {string}
   */
  getCacheKey(src, options = {}) {
    // Incluir apenas opções que afetam o carregamento
    const relevantOptions = {
      preload: options.preload,
      crossOrigin: options.crossOrigin,
    }

    return `${src}:${JSON.stringify(relevantOptions)}`
  }

  /**
   * Incrementa contador de uso
   * @param {string} cacheKey
   */
  incrementUsage(cacheKey) {
    const current = this.usageCount.get(cacheKey) || 0
    this.usageCount.set(cacheKey, current + 1)
  }

  /**
   * Remove vídeo do cache se não está sendo usado
   * @param {string} src
   * @param {Object} options
   */
  releaseVideo(src, options = {}) {
    const cacheKey = this.getCacheKey(src, options)
    const usage = this.usageCount.get(cacheKey) || 0

    if (usage > 1) {
      this.usageCount.set(cacheKey, usage - 1)
      console.log(
        `🎥 [VideoCache] Reduzido uso de ${src}: ${usage - 1} restantes`
      )
    } else {
      // Último uso - remover do cache
      if (this.cache.has(cacheKey)) {
        const video = this.cache.get(cacheKey)
        video.src = "" // Limpar src para liberar recursos
        this.cache.delete(cacheKey)
        this.usageCount.delete(cacheKey)
        console.log(`🎥 [VideoCache] Removido do cache: ${src}`)
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clearCache() {
    console.log("🎥 [VideoCache] Limpando cache completo")

    // Limpar src de todos os vídeos
    for (const video of this.cache.values()) {
      video.src = ""
    }

    this.cache.clear()
    this.loadingPromises.clear()
    this.usageCount.clear()
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats() {
    return {
      cached: this.cache.size,
      loading: this.loadingPromises.size,
      totalUsage: Array.from(this.usageCount.values()).reduce(
        (a, b) => a + b,
        0
      ),
    }
  }
}

// Instância singleton
const videoCache = new VideoCache()

// Helper functions para uso nos componentes
export const getVideo = (src, options) => videoCache.getVideo(src, options)
export const releaseVideo = (src, options) =>
  videoCache.releaseVideo(src, options)
export const clearVideoCache = () => videoCache.clearCache()
export const getVideoCacheStats = () => videoCache.getStats()

// Compatibilidade para componentes existentes
export const createVideoElement = async (src, options = {}) => {
  console.log(`🎥 [VideoCache] createVideoElement chamado para: ${src}`)
  return await getVideo(src, options)
}

export default videoCache
