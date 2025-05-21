import { create } from "zustand"

// Definir índices de seções
const SECTION_INDICES = {
  nav: 0,
  about: 1,
  aidatingcoach: 2,
  download: 3,
  token: 4,
  roadmap: 5,
}

export const useNavigationStore = create((set, get) => ({
  // Estado atual da seção
  currentSection: "nav",
  currentSectionIndex: 0,

  // Posições armazenadas para diferentes elementos
  storedPositions: {},

  // Fontes de navegação
  navigationSources: {},

  // Alterar seção atual
  setCurrentSection: (section, index) =>
    set({
      currentSection: section,
      currentSectionIndex: index,
    }),

  // Armazenar posição de um elemento
  storePosition: (elementId, position, target) => {
    set(state => ({
      storedPositions: {
        ...state.storedPositions,
        [elementId]: { position, target },
      },
    }))
  },

  // Limpar todas as posições armazenadas
  clearPositions: () =>
    set({
      storedPositions: {},
      navigationSources: {},
    }),

  // Limpar posição de um elemento específico
  clearPositionForElement: elementId => {
    set(state => {
      const { [elementId]: _, ...remainingPositions } = state.storedPositions
      const { [elementId]: __, ...remainingSources } = state.navigationSources

      return {
        storedPositions: remainingPositions,
        navigationSources: remainingSources,
      }
    })
  },

  // Definir fonte de navegação para um elemento
  setNavigationSource: (elementId, source) => {
    set(state => ({
      navigationSources: {
        ...state.navigationSources,
        [elementId]: source,
      },
    }))
  },

  // Obter fonte de navegação de um elemento
  getNavigationSource: elementId => {
    return get().navigationSources[elementId] || "direct"
  },

  // Obter posição de um elemento
  getPosition: elementId => {
    return get().storedPositions[elementId]
  },

  // Índices de seções para referência
  sectionIndices: SECTION_INDICES,
}))
