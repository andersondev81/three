import React, { useEffect, useRef } from "react"
import * as THREE from "three"
import { useResourcesStore } from "../../stores/resourcesStore"
import { useMobileDetection } from "../../hooks/useMobileDetection"

export const ResourcePreloader = React.memo(() => {
  const hasNotifiedRef = useRef(false)
  const isMobile = useMobileDetection()
  const { setLoading, setProgress, registerResource } = useResourcesStore()

  useEffect(() => {
    // Função para pré-carregar todos os recursos
    const preloadResources = async () => {
      try {
        setLoading(true)

        // 1. Pré-carregar texturas críticas
        await preloadTextures()
        setProgress(25)

        // 2. Verificar arquivos HDR
        await preloadHDRs()
        setProgress(50)

        // 3. Pré-carregar vídeos
        await preloadVideos()
        setProgress(75)

        // 4. Verificar modelos 3D
        await preloadModels()

        // 5. Pré-carregar arquivos de áudio
        await preloadAudio()
        setProgress(100)

        // 6. Notificar que está pronto para iniciar
        if (!hasNotifiedRef.current) {
          console.log("✅ Notificando App que está pronto para iniciar")
          setLoading(false)
          if (window.onExperienceLoaded) {
            window.onExperienceLoaded()
            hasNotifiedRef.current = true
          }
        }
      } catch (error) {
        console.error("Erro durante o carregamento de recursos:", error)

        // Mesmo com erros, notificar como "pronto" para evitar travamentos da UI
        if (!hasNotifiedRef.current) {
          console.log("⚠️ Notificando App apesar de erros de carregamento")
          setLoading(false)
          if (window.onExperienceLoaded) {
            window.onExperienceLoaded()
            hasNotifiedRef.current = true
          }
        }
      }
    }

    // Função para pré-carregar texturas
    const preloadTextures = async () => {
      // Lista de texturas a carregar (copiar do seu código atual)
      const texturePaths = [
        // Mapas de ambiente
        "/images/bg1.jpg",
        // ... outras texturas
      ]

      // Criar carregador de textura
      const textureLoader = new THREE.TextureLoader()

      // Função para carregar uma textura com timeout
      const loadTextureWithTimeout = path => {
        return new Promise(resolve => {
          // 10 segundos de timeout para cada textura
          const timeoutId = setTimeout(() => {
            console.warn(`Timeout carregando textura: ${path}`)
            resolve(null)
          }, 10000)

          textureLoader.load(
            path,
            texture => {
              clearTimeout(timeoutId)
              registerResource("textures", path)
              resolve(texture)
            },
            undefined,
            error => {
              clearTimeout(timeoutId)
              console.error(`Erro carregando textura ${path}:`, error)
              resolve(null)
            }
          )
        })
      }

      // Carregar todas as texturas com timeout
      console.log("🔄 Iniciando carregamento de texturas críticas...")
      const texturePromises = texturePaths.map(path =>
        loadTextureWithTimeout(path)
      )
      const textures = await Promise.all(texturePromises)

      // Verificar resultados
      const loadedCount = textures.filter(t => t !== null).length
      console.log(
        `✅ Carregadas ${loadedCount} de ${texturePaths.length} texturas`
      )
    }

    // Implementar outras funções de preload seguindo o mesmo padrão...
    // preloadHDRs, preloadVideos, preloadModels, preloadAudio

    // Iniciar pré-carregamento
    preloadResources()
  }, [isMobile, setLoading, setProgress, registerResource])

  return null
})
