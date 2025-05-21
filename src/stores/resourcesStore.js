import { create } from "zustand"

export const useResourcesStore = create((set, get) => ({
  // Estado
  isLoading: true,
  progress: 0,
  loadedResources: {
    textures: [],
    models: [],
    audio: [],
    videos: [],
  },

  // Configurações de recursos
  resourceConfig: {
    textures: [
      "/images/bg1.jpg",
      "/images/studio.jpg",
      "/images/clouds.jpg",
      "/texture/castleColor.avif",
      "/texture/castleRoughnessV1.avif",
      "/texture/castleMetallicV1.avif",
      "/texture/castleHeart_Base_colorAO.avif",
      "/texture/castleLights_Emissive.avif",
      "/texture/GodsWallColor.avif",
      "/texture/castleGodsWall_Roughness.avif",
      "/texture/WallsColor.avif",
      "/texture/floor_Roughness.avif",
      "/texture/PilarsColor.avif",
      "/texture/castlePilars_Roughness.avif",
      "/texture/castlePilars_Metallic.avif",
      "/texture/castlePilars_Emissive.avif",
      "/texture/floorAO.avif",
      "/texture/floorHeart_Metallic.avif",
      "/texture/floorHeartColor.avif",
      "/texture/floorHeart_Roughness.avif",
      "/texture/floorHeart_Emissive.avif",
      "/texture/wingsColor_.avif",
      "/texture/wingsRoughness.avif",
      "/texture/godsColorAO.avif",
      "/texture/hoofGlassColorBAO.avif",
      "/texture/hoofGlassEmissiveV2.avif",
      "/texture/atmBake1.avif",
      "/texture/atmMetallicV1.avif",
      "/texture/atmEmissive.avif",
      "/texture/ScrollColorV1.avif",
      "/texture/FlowersColor.avif",
      "/texture/Flowers_Normal.avif",
      "/texture/Flowers_Alpha.avif",
      "/texture/Orb_AlphaV1.avif",
      "/texture/Orb_Alpha.avif",
      "/texture/OrbBake_Emissive.avif",
      "/texture/PoleColor.avif",
      "/texture/Pole_Metallic.avif",
      "/texture/Pole_Roughness.avif",
      "/texture/heartColor.avif",
      "/texture/HeartPoleEmissive.avif",
    ],
    models: [
      "/models/Castle.glb",
      "/models/Flower.glb",
      "/models/Orbit.glb",
      "/models/Pole.glb",
    ],
    audio: [
      "/sounds/atmambiance.mp3",
      "/sounds/camerawoosh.MP3",
      "/sounds/daingcoachmirror.MP3",
      "/sounds/fountain.mp3",
      "/sounds/orb.mp3",
      "/sounds/roadmapscroll.mp3",
      "/sounds/templeambiance.mp3",
    ],
    videos: ["/video/tunnel.mp4", "/video/water.mp4", "/video/Mirror.mp4"],
  },

  // Ações
  setLoading: isLoading => set({ isLoading }),

  setProgress: progress =>
    set({
      progress: Math.min(Math.max(progress, 0), 100),
    }),

  registerResource: (type, resource) =>
    set(state => {
      const newLoadedResources = { ...state.loadedResources }
      if (!newLoadedResources[type].includes(resource)) {
        newLoadedResources[type] = [...newLoadedResources[type], resource]
      }
      return { loadedResources: newLoadedResources }
    }),

  clearResources: () =>
    set({
      loadedResources: {
        textures: [],
        models: [],
        audio: [],
        videos: [],
      },
    }),

  preloadResources: async (
    types = ["textures", "models", "audio", "videos"]
  ) => {
    const { registerResource, setProgress } = get()
    const totalResources = types.reduce(
      (sum, type) => sum + get().resourceConfig[type].length,
      0
    )
    let loadedCount = 0

    const updateProgress = () => {
      loadedCount++
      setProgress((loadedCount / totalResources) * 100)
    }

    const preloadPromises = types.flatMap(type =>
      get().resourceConfig[type].map(async path => {
        try {
          const response = await fetch(path, { method: "HEAD" })
          if (response.ok) {
            registerResource(type, path)
            updateProgress()
            return path
          } else {
            console.warn(`Resource not found: ${path}`)
            updateProgress()
            return null
          }
        } catch (error) {
          console.error(`Error preloading ${path}:`, error)
          updateProgress()
          return null
        }
      })
    )

    await Promise.all(preloadPromises)
    set({ isLoading: false })
  },

  // Método para verificar se todos os recursos de um tipo foram carregados
  areResourcesLoaded: type => {
    const loadedResources = get().loadedResources[type]
    const configuredResources = get().resourceConfig[type]
    return loadedResources.length === configuredResources.length
  },
}))
