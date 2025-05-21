import create from "zustand"

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

  // Ações
  setLoading: isLoading => set({ isLoading }),
  setProgress: progress => set({ progress }),

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
}))
