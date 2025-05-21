import create from "zustand"

export const useNavigationStore = create((set, get) => ({
  // states
  currentSection: "intro",
  lastClickedPositions: { mirror: null, atm: null, scroll: null, orb: null },
  navigationSources: {},
  sectionIndices: {
    nav: 0,
    about: 1,
    aidatingcoach: 2,
    download: 3,
    token: 4,
    roadmap: 5,
  },

  // actions
  setCurrentSection: (sectionName, sectionIndex) => {
    set({ currentSection: sectionName })

    const event = new CustomEvent("sectionChange", {
      detail: { sectionName, sectionIndex },
    })
    window.dispatchEvent(event)
  },

  storePosition: (elementId, position, target) => {
    set(state => ({
      lastClickedPositions: {
        ...state.lastClickedPositions,
        [elementId]: { position, target },
      },
    }))
  },

  clearPositions: () =>
    set({
      lastClickedPositions: {
        mirror: null,
        atm: null,
        scroll: null,
        orb: null,
      },
    }),

  clearPositionForElement: elementId =>
    set(state => ({
      lastClickedPositions: {
        ...state.lastClickedPositions,
        [elementId]: null,
      },
    })),

  setNavigationSource: (elementId, source) =>
    set(state => ({
      navigationSources: {
        ...state.navigationSources,
        [elementId]: source,
      },
    })),

  getNavigationSource: elementId => {
    return get().navigationSources[elementId] || "direct"
  },
}))
