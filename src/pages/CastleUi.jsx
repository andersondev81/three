import React, { useState, useEffect } from "react"
import { AboutOverlay } from "../pages/AboutOverlay"
import { DownloadOverlay } from "./DownloadOverlay"
import { AiDatingCoachOverlay } from "./AiDatingCoachOverlay"
import { ScrollOverlay } from "./ScrollOverlay"
import { AtmOverlay } from "./AtmOverlay"

export const sections = [
  "nav",
  "about",
  "aidatingcoach",
  "download",
  "token",
  "roadmap",
]

const Section = ({ children, isActive, className = "" }) => (
  <section
    className={`absolute inset-4 flex flex-col justify-center text-center transition-opacity duration-1000 ${className} ${
      isActive ? "opacity-100" : "opacity-0 pointer-events-none"
    }`}
  >
    {children}
  </section>
)

const NavigationButton = ({ onClick, children, className }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center rounded-md px-6 py-3 transition-all ${className}`}
  >
    {children}
  </button>
)

export const CastleUi = ({ section = 0, onSectionChange, cameraRef }) => {
  const [showAboutOverlay, setShowAboutOverlay] = useState(false)
  const [showDownloadOverlay, setShowDownloadOverlay] = useState(false)
  const [showAiDatingCoachOverlay, setShowAiDatingCoachOverlay] =
    useState(false)
  const [showScrollOverlay, setShowScrollOverlay] = useState(false)
  const [showAtmOverlay, setShowAtmOverlay] = useState(false)

  const currentSectionKey = sections[section]

  useEffect(() => {
    // Reset todos os overlays primeiro
    setShowAboutOverlay(false)
    setShowDownloadOverlay(false)
    setShowAiDatingCoachOverlay(false)
    setShowScrollOverlay(false)
    setShowAtmOverlay(false)

    // Então ativa o overlay correto baseado na seção atual
    if (currentSectionKey === "about") {
      const timer = setTimeout(() => {
        setShowAboutOverlay(true)
      }, 1200)
      return () => clearTimeout(timer)
    } else if (currentSectionKey === "aidatingcoach") {
      const timer = setTimeout(() => {
        setShowAiDatingCoachOverlay(true)
      }, 1200)
      return () => clearTimeout(timer)
    } else if (currentSectionKey === "download") {
      const timer = setTimeout(() => {
        setShowDownloadOverlay(true)
      }, 1200)
      return () => clearTimeout(timer)
    } else if (currentSectionKey === "roadmap") {
      const timer = setTimeout(() => {
        setShowScrollOverlay(true)
      }, 1200)
      return () => clearTimeout(timer)
    } else if (currentSectionKey === "token") {
      const timer = setTimeout(() => {
        setShowAtmOverlay(true)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [currentSectionKey])

  useEffect(() => {
    // Handler para navegação do orb (about)
    const handleOrbNavigation = event => {
      if (event.detail && event.detail.section === "about") {
        if (currentSectionKey !== "about") {
          onSectionChange(1, "about")
        }
      }
    }

    // Handler para navegação do mirror (aidatingcoach)
    const handleMirrorNavigation = event => {
      if (event.detail && event.detail.section === "aidatingcoach") {
        if (currentSectionKey !== "aidatingcoach") {
          onSectionChange(2, "aidatingcoach")
        }
      }
    }

    // Registrar handlers para eventos de navegação
    window.addEventListener("orbNavigation", handleOrbNavigation)
    window.addEventListener("mirrorNavigation", handleMirrorNavigation)

    return () => {
      window.removeEventListener("orbNavigation", handleOrbNavigation)
      window.removeEventListener("mirrorNavigation", handleMirrorNavigation)
    }
  }, [currentSectionKey, onSectionChange])

  useEffect(() => {
    // Adiciona um handler para o clique no mirror
    const handleMirrorClick = e => {
      // Dispara o evento mirrorNavigation
      const event = new CustomEvent("mirrorNavigation", {
        detail: { section: "aidatingcoach" },
      })
      window.dispatchEvent(event)

      // Registra a origem da navegação
      if (
        window.navigationSystem &&
        window.navigationSystem.setNavigationSource
      ) {
        window.navigationSystem.setNavigationSource("datingCoach", "direct")
      }

      // Armazena a posição atual da câmera para poder voltar depois
      if (
        window.navigationSystem &&
        window.navigationSystem.storePosition &&
        cameraRef
      ) {
        const currentPosition = cameraRef.position
          ? { ...cameraRef.position }
          : null
        const currentTarget = cameraRef.target ? { ...cameraRef.target } : null

        if (currentPosition && currentTarget) {
          window.navigationSystem.storePosition("datingCoach", {
            position: currentPosition,
            target: currentTarget,
          })
        }
      }

      // Reproduz som de transição se disponível
      try {
        if (
          window.audioManager &&
          typeof window.audioManager.play === "function"
        ) {
          window.audioManager.play("transition")
        }
      } catch (error) {
        console.log("Erro ao reproduzir som de transição:", error)
      }
    }

    // Tenta encontrar elementos que devem abrir o AiDatingCoach
    const mirrorElements = [
      document.getElementById("mirror"),
      document.querySelector(".mirror"),
      document.querySelector("[data-id='mirror']"),
      document.querySelector("[data-action='openDatingCoach']"),
    ].filter(Boolean) // Remove elementos null/undefined

    // Adiciona listeners a todos os elementos encontrados
    if (mirrorElements.length > 0) {
      mirrorElements.forEach(element => {
        element.addEventListener("click", handleMirrorClick)
      })

      // Cleanup
      return () => {
        mirrorElements.forEach(element => {
          element.removeEventListener("click", handleMirrorClick)
        })
      }
    }
  }, [cameraRef])

  const handleHomeNavigation = () => {
    if (cameraRef) {
      cameraRef.goToHome()
      onSectionChange(0, "nav")
    }
  }

  const handleBackFromAbout = e => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    setShowAboutOverlay(false)

    const source =
      window.navigationSystem && window.navigationSystem.getNavigationSource
        ? window.navigationSystem.getNavigationSource("orb")
        : "direct"

    if (source === "direct" && window.audioManager) {
      try {
        window.audioManager.play("transition")
      } catch (error) {
        console.log("Erro ao reproduzir som:", error)
      }
    }

    if (
      source === "pole" &&
      window.navigationSystem &&
      window.navigationSystem.clearPositionForElement
    ) {
      window.navigationSystem.clearPositionForElement("orb")
    }

    setTimeout(() => {
      if (source === "pole") {
        onSectionChange(0, "nav")
        if (window.globalNavigation && window.globalNavigation.navigateTo) {
          window.globalNavigation.navigateTo("nav")
        }
      } else {
        const storedPosition =
          window.navigationSystem && window.navigationSystem.getPosition
            ? window.navigationSystem.getPosition("orb")
            : null

        if (storedPosition) {
          const { position, target } = storedPosition

          if (window.smoothCameraReturn) {
            window.smoothCameraReturn(position, target)
          }

          onSectionChange(0, "nav")
        } else {
          onSectionChange(0, "nav")
          if (window.globalNavigation && window.globalNavigation.navigateTo) {
            window.globalNavigation.navigateTo("nav")
          }
        }
      }
    }, 100)

    if (cameraRef && cameraRef.goToHome && source === "pole") {
      cameraRef.goToHome()
    }
  }

  const handleBackFromAiDatingCoach = e => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    setShowAiDatingCoachOverlay(false)

    const source =
      window.navigationSystem && window.navigationSystem.getNavigationSource
        ? window.navigationSystem.getNavigationSource("datingCoach") ||
          window.navigationSystem.getNavigationSource("mirror")
        : "direct"

    if (source === "direct" && window.audioManager) {
      try {
        if (typeof window.audioManager.play === "function") {
          window.audioManager.play("transition")
        } else {
          console.log("audioManager.play não é uma função")
        }
      } catch (error) {
        console.log("Erro ao reproduzir som:", error)
      }
    }

    if (
      source === "pole" &&
      window.navigationSystem &&
      window.navigationSystem.clearPositionForElement
    ) {
      window.navigationSystem.clearPositionForElement("mirror")
      window.navigationSystem.clearPositionForElement("datingCoach")
    }

    setTimeout(() => {
      if (source === "pole") {
        onSectionChange(0, "nav")
        if (window.globalNavigation && window.globalNavigation.navigateTo) {
          window.globalNavigation.navigateTo("nav")
        }
      } else {
        const storedPosition =
          window.navigationSystem && window.navigationSystem.getPosition
            ? window.navigationSystem.getPosition("mirror") ||
              window.navigationSystem.getPosition("datingCoach")
            : null

        if (storedPosition) {
          const { position, target } = storedPosition

          if (window.smoothCameraReturn) {
            window.smoothCameraReturn(position, target)
          }

          onSectionChange(0, "nav")
        } else {
          onSectionChange(0, "nav")
          if (window.globalNavigation && window.globalNavigation.navigateTo) {
            window.globalNavigation.navigateTo("nav")
          }
        }
      }
    }, 100)

    if (cameraRef && cameraRef.goToHome && source === "pole") {
      cameraRef.goToHome()
    }
  }

  const handleBackFromDownload = e => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    setShowDownloadOverlay(false)

    if (cameraRef && cameraRef.goToHome) {
      cameraRef.goToHome()
    }

    setTimeout(() => {
      onSectionChange(0, "nav")

      if (window.globalNavigation && window.globalNavigation.navigateTo) {
        window.globalNavigation.navigateTo("nav")
      }
    }, 100)
  }

  const handleBackFromScroll = e => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    setShowScrollOverlay(false)

    // 🔥 ADICIONAR: Parar os sons específicos do scroll
    if (window.audioManager && window.audioManager.sounds.scroll) {
      window.audioManager.stop("scroll")
    }
    if (window.audioManager && window.audioManager.sounds.paper) {
      window.audioManager.stop("paper")
    }
    if (window.audioManager && window.audioManager.stopAllAudio) {
      window.audioManager.stopAllAudio()
    }

    const source =
      window.navigationSystem && window.navigationSystem.getNavigationSource
        ? window.navigationSystem.getNavigationSource("scroll")
        : "direct"

    if (source === "direct" && window.audioManager) {
      try {
        window.audioManager.play("transition")
      } catch (error) {
        console.log("Erro ao reproduzir som:", error)
      }
    }

    if (
      source === "pole" &&
      window.navigationSystem &&
      window.navigationSystem.clearPositionForElement
    ) {
      window.navigationSystem.clearPositionForElement("scroll")
    }

    setTimeout(() => {
      if (source === "pole") {
        onSectionChange(0, "nav")
        if (window.globalNavigation && window.globalNavigation.navigateTo) {
          window.globalNavigation.navigateTo("nav")
        }
      } else {
        const storedPosition =
          window.navigationSystem && window.navigationSystem.getPosition
            ? window.navigationSystem.getPosition("scroll")
            : null

        if (storedPosition) {
          const { position, target } = storedPosition

          if (window.smoothCameraReturn) {
            window.smoothCameraReturn(position, target)
          }

          onSectionChange(0, "nav")
        } else {
          onSectionChange(0, "nav")
          if (window.globalNavigation && window.globalNavigation.navigateTo) {
            window.globalNavigation.navigateTo("nav")
          }
        }
      }
    }, 100)

    if (cameraRef && cameraRef.goToHome && source === "pole") {
      cameraRef.goToHome()
    }
  }

  const handleBackFromAtm = e => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    setShowAtmOverlay(false)

    // 🔥 ADICIONAR: Parar os sons específicos do ATM
    if (window.audioManager && window.audioManager.sounds.atm) {
      window.audioManager.stop("atm")
    }
    if (window.audioManager && window.audioManager.sounds.coins) {
      window.audioManager.stop("coins")
    }
    if (window.audioManager && window.audioManager.stopAllAudio) {
      window.audioManager.stopAllAudio()
    }

    const source =
      window.navigationSystem && window.navigationSystem.getNavigationSource
        ? window.navigationSystem.getNavigationSource("atm")
        : "direct"

    if (source === "direct" && window.audioManager) {
      try {
        window.audioManager.play("transition")
      } catch (error) {
        console.log("Erro ao reproduzir som:", error)
      }
    }

    if (
      source === "pole" &&
      window.navigationSystem &&
      window.navigationSystem.clearPositionForElement
    ) {
      window.navigationSystem.clearPositionForElement("atm")
    }

    setTimeout(() => {
      if (source === "pole") {
        onSectionChange(0, "nav")
        if (window.globalNavigation && window.globalNavigation.navigateTo) {
          window.globalNavigation.navigateTo("nav")
        }
      } else {
        const storedPosition =
          window.navigationSystem && window.navigationSystem.getPosition
            ? window.navigationSystem.getPosition("atm")
            : null

        if (storedPosition) {
          const { position, target } = storedPosition

          if (window.smoothCameraReturn) {
            window.smoothCameraReturn(position, target)
          }

          onSectionChange(0, "nav")
        } else {
          onSectionChange(0, "nav")
          if (window.globalNavigation && window.globalNavigation.navigateTo) {
            window.globalNavigation.navigateTo("nav")
          }
        }
      }
    }, 100)

    if (cameraRef && cameraRef.goToHome && source === "pole") {
      cameraRef.goToHome()
    }
  }

  const handleCloseOverlay = e => {
    if (currentSectionKey === "about") {
      handleBackFromAbout(e)
    } else if (currentSectionKey === "aidatingcoach") {
      handleBackFromAiDatingCoach(e)
    } else if (currentSectionKey === "download") {
      handleBackFromDownload(e)
    } else if (currentSectionKey === "roadmap") {
      handleBackFromScroll(e)
    } else if (currentSectionKey === "token") {
      handleBackFromAtm(e)
    } else {
      setShowAboutOverlay(false)
      setShowDownloadOverlay(false)
      setShowAiDatingCoachOverlay(false)
      setShowScrollOverlay(false)
      setShowAtmOverlay(false)
      handleHomeNavigation()
    }
  }

  return (
    <main className="relative h-full w-full">
      <Section isActive={currentSectionKey === "nav"}></Section>

      <Section isActive={currentSectionKey === "about"}></Section>

      <Section isActive={currentSectionKey === "aidatingcoach"}>
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-4"></div>
        </div>
      </Section>

      <Section isActive={currentSectionKey === "download"}></Section>

      <Section isActive={currentSectionKey === "token"}>
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-4"></div>
        </div>
      </Section>

      <Section isActive={currentSectionKey === "roadmap"}>
        <div className="flex flex-col items-center gap-6"></div>
      </Section>

      {/* Overlays */}
      <AiDatingCoachOverlay
        isVisible={showAiDatingCoachOverlay}
        onClose={handleBackFromAiDatingCoach}
      />
      <ScrollOverlay
        isVisible={showScrollOverlay}
        onClose={handleBackFromScroll}
      />
      <AtmOverlay isVisible={showAtmOverlay} onClose={handleBackFromAtm} />
      <AboutOverlay
        isVisible={showAboutOverlay}
        onClose={handleBackFromAbout}
      />
      <DownloadOverlay
        isVisible={showDownloadOverlay}
        onClose={handleBackFromDownload}
      />
    </main>
  )
}
