import { useTexture } from "@react-three/drei"
import { useMemo } from "react"
import * as THREE from "three"

export const useSharedEnvironmentMaps = () => {
  const textures = useTexture({
    bg1: "/images/bg1.jpg",
    studio: "/images/studio.jpg",
    clouds: "/images/clouds.jpg",
  })

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping
      }
    })
  }, [textures])

  return textures
}

export const useStudioEnvironment = () => {
  const { studio } = useSharedEnvironmentMaps()
  return studio
}

export const useBg1Environment = () => {
  const { bg1 } = useSharedEnvironmentMaps()
  return bg1
}

export const useCloudsEnvironment = () => {
  const { clouds } = useSharedEnvironmentMaps()
  return clouds
}
