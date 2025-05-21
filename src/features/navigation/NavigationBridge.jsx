// features/navigation/NavigationBridge.jsx
import { useEffect } from "react"
import { useNavigationStore } from "../../stores/navigationStore"
import { useCameraStore } from "../../stores/cameraStore"

export function NavigationBridge() {
  const {
    currentSection,
    setCurrentSection,
    storePosition,
    clearPositions,
    clearPositionForElement,
    setNavigationSource,
    getNavigationSource,
    sectionIndices,
  } = useNavigationStore()

  const { moveCamera, getCameraPosition, getCameraTarget } = useCameraStore()

  useEffect(() => {
    // Criar ponte com o sistema global de navegação
    window.globalNavigation = {
      navigateTo: section => {
        setCurrentSection(section, sectionIndices[section] || 0)
      },
      lastSection: currentSection,
      sectionIndices: sectionIndices,
      reset: function () {
        if (window.resetIframes) {
          window.resetIframes()
        }
      },
      log: function (message) {
        console.log(`[Navigation] ${message}`)
      },
    }

    // Ponte para o sistema de navegação
    window.navigationSystem = {
      storePosition: (elementId, position, target) => {
        storePosition(elementId, position, target)
      },
      clearPositions: () => {
        clearPositions()
      },
      clearPositionForElement: elementId => {
        clearPositionForElement(elementId)
      },
      setNavigationSource: (elementId, source) => {
        setNavigationSource(elementId, source)
      },
      getNavigationSource: elementId => {
        return getNavigationSource(elementId)
      },
      getPosition: elementId => {
        // Implementar baseado na store
        console.warn("getPosition not implemented")
      },
      returnToPosition: (elementId, defaultAction) => {
        // Implementar baseado na store
        console.warn("returnToPosition not implemented")
      },
    }

    // Ponte para o sistema de câmera suave
    window.smoothCameraReturn = (position, target) => {
      moveCamera(position, target, true)
    }

    return () => {
      // Limpeza ao desmontar
      delete window.globalNavigation
      delete window.navigationSystem
      delete window.smoothCameraReturn
    }
  }, [
    currentSection,
    setCurrentSection,
    storePosition,
    clearPositions,
    clearPositionForElement,
    setNavigationSource,
    getNavigationSource,
    moveCamera,
    sectionIndices,
  ])

  return null // Este componente não renderiza nada
}
