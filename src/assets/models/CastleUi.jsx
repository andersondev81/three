import React, { useState, useEffect } from "react"
import { AboutOverlay } from "/src/assets/models/AboutOverlay.jsx"
import { DownloadOverlay } from "./DownloadOverlay"

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

  const currentSectionKey = sections[section]

  useEffect(() => {
    if (currentSectionKey === "about") {
      const timer = setTimeout(() => {
        setShowAboutOverlay(true)
      }, 1200)
      return () => clearTimeout(timer)
    } else if (currentSectionKey === "download") {
      const timer = setTimeout(() => {
        setShowDownloadOverlay(true)
      }, 1200)
      return () => clearTimeout(timer)
    } else {
      setShowAboutOverlay(false)
      setShowDownloadOverlay(false)
    }
  }, [currentSectionKey])

  useEffect(() => {
    const handleOrbNavigation = event => {
      if (event.detail && event.detail.section === "about") {
        if (currentSectionKey !== "about") {
          onSectionChange(1, "about")
        }
      }
    }

    window.addEventListener("orbNavigation", handleOrbNavigation)
    return () =>
      window.removeEventListener("orbNavigation", handleOrbNavigation)
  }, [currentSectionKey, onSectionChange])

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
      window.audioManager.play("transition")
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

  const handleCloseOverlay = e => {
    if (currentSectionKey === "about") {
      handleBackFromAbout(e)
    } else if (currentSectionKey === "download") {
      handleBackFromDownload(e)
    } else {
      setShowAboutOverlay(false)
      setShowDownloadOverlay(false)
      handleHomeNavigation()
    }
  }

  return (
    <main className="relative h-full w-full">
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
