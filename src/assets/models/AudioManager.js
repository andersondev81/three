class Position {
  constructor(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }

  distanceTo(other) {
    const dx = this.x - other.x
    const dy = this.y - other.y
    const dz = this.z - other.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
}

function distanceBetween(point1, point2) {
  const dx = point1.x - point2.x
  const dy = point1.y - point2.y
  const dz = point1.z - point2.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

class AudioManager {
  constructor() {
    this.sounds = {}
    this.isMuted = false
    this.volume = 0.5
    this.loop = false
    this.positions = {
      orb: new Position(1.76, 1.155, -0.883),
      fountain: new Position(0, 0.8, 2.406),
      portal: new Position(0, 1.247, -2.117),
      heart: new Position(0, 4.18, -0.006),
      pole: new Position(0.2, -0.35, -0.2),
    }

    this.setupSoundCategories()
    this.setupSounds()
    this.canAutoplay = false
    this.checkAutoplay()
  }

  setupSoundCategories() {
    this.soundCategories = {
      ambient: [
        "ambient",
        "water",
        "fountain",
        "heartbeat",
        "portal",
        "orb",
        "pole",
      ],
      transition: ["transition", "click", "hover"],
      section: [
        "nav",
        "about",
        "aidatingcoach",
        "download",
        "token",
        "roadmap",
      ],
      sectionElements: {
        nav: [],
        about: [],
        aidatingcoach: ["mirror"],
        download: [],
        token: ["atm", "coins"],
        roadmap: ["scroll", "paper"],
      },
    }

    this.soundToCategory = {}

    this.soundCategories.ambient.forEach(sound => {
      this.soundToCategory[sound] = "ambient"
    })

    this.soundCategories.transition.forEach(sound => {
      this.soundToCategory[sound] = "transition"
    })

    this.soundCategories.section.forEach(sound => {
      this.soundToCategory[sound] = "section"
    })

    Object.entries(this.soundCategories.sectionElements).forEach(
      ([section, elements]) => {
        elements.forEach(sound => {
          this.soundToCategory[sound] = "sectionElement"
          this.soundToCategory[`${sound}_section`] = section
        })
      }
    )
  }

  setupSounds() {
    this.registerSound("transition", "../sounds/camerawoosh.MP3", {
      loop: false,
      volume: 0.1,
    })

    this.registerSound("aidatingcoach", "../sounds/daingcoachmirror.MP3", {
      loop: true,
      volume: 0.1,
    })
    this.registerSound("token", "../sounds/atmambiance.mp3", {
      loop: true,
      volume: 0.1,
    })
    this.registerSound("roadmap", "../sounds/roadmapscroll.mp3", {
      loop: true,
      volume: 0.1,
    })

    this.registerSound("ambient", "../sounds/templeambiance.mp3", {
      loop: true,
      volume: 1,
    })
    this.registerSound("orb", "../sounds/orb.mp3", {
      loop: true,
      volume: 0.3,
    })
    this.registerSound("fountain", "/sounds/fountain.mp3", {
      loop: true,
      volume: 0.3,
    })
    this.registerSound("pole", "../sounds/templeambiance.mp3", {
      loop: true,
      volume: 1,
    })
  }

  checkAutoplay() {
    const audio = new Audio()
    audio.volume = 0

    const playPromise = audio.play()

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.canAutoplay = true
          audio.pause()
        })
        .catch(error => {
          this.canAutoplay = false
        })
    }
  }

  registerSound(id, path, options = {}) {
    const audio = new Audio()
    audio.src = path
    audio.volume = options.volume || this.volume

    audio.loop = false

    this.sounds[id] = {
      audio: audio,
      volume: options.volume || this.volume,
      isPlaying: false,
      loop: false,
    }
  }

  play(id) {
    if (this.isMuted || !this.sounds[id]) return

    const sound = this.sounds[id]

    sound.audio.loop = false
    if (id === "pole") {
      sound.audio.loop = true
    }

    sound.isPlaying = true
    sound.audio.volume = sound.volume

    const playPromise = sound.audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        sound.isPlaying = false
      })
    }
  }

  stop(id) {
    if (!this.sounds[id]) return

    if (id === "pole") {
      return
    }

    const sound = this.sounds[id]
    if (sound.isPlaying) {
      sound.audio.pause()
      sound.audio.currentTime = 0
      sound.isPlaying = false
    }
  }

  pause(id) {
    if (!this.sounds[id]) return

    const sound = this.sounds[id]
    if (sound.isPlaying) {
      sound.audio.pause()
    }
  }

  resume(id) {
    if (this.isMuted || !this.sounds[id]) return

    const sound = this.sounds[id]
    if (sound.isPlaying) {
      sound.audio.volume = 0

      const playPromise = sound.audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            const fadeDuration = 1000
            const fadeSteps = 20
            const volumeIncrement = sound.volume / fadeSteps
            const stepDuration = fadeDuration / fadeSteps

            let currentStep = 0
            const fadeInterval = setInterval(() => {
              currentStep++
              const newVolume = Math.min(
                sound.volume,
                currentStep * volumeIncrement
              )
              sound.audio.volume = newVolume

              if (currentStep >= fadeSteps) {
                clearInterval(fadeInterval)
                sound.audio.volume = sound.volume
              }
            }, stepDuration)
          })
          .catch(error => {
            console.error(`Erro ao retomar o som ${id}:`, error)
          })
      }
    } else {
      this.play(id)
    }
  }

  fadeOut(id, duration = 1000) {
    if (!this.sounds[id] || !this.sounds[id].isPlaying) return

    const sound = this.sounds[id]
    const originalVolume = sound.audio.volume
    const fadeSteps = 20
    const volumeDecrement = originalVolume / fadeSteps
    const stepDuration = duration / fadeSteps

    let currentStep = 0
    const fadeInterval = setInterval(() => {
      currentStep++
      const newVolume = Math.max(
        0,
        originalVolume - currentStep * volumeDecrement
      )
      sound.audio.volume = newVolume

      if (currentStep >= fadeSteps) {
        clearInterval(fadeInterval)
        if (sound.loop) {
          sound.audio.pause()
        } else {
          sound.audio.pause()
          sound.audio.currentTime = 0
          sound.isPlaying = false
        }
        sound.audio.volume = originalVolume
      }
    }, stepDuration)

    return fadeInterval
  }

  crossFade(fromId, toId, duration = 1000) {
    if (!this.sounds[fromId] || !this.sounds[toId]) return

    this.fadeOut(fromId, duration)

    setTimeout(() => {
      if (this.sounds[toId]) {
        this.sounds[toId].audio.volume = 0
        this.play(toId)

        const fadeSteps = 20
        const targetVolume = this.sounds[toId].volume
        const volumeIncrement = targetVolume / fadeSteps
        const stepDuration = duration / 2 / fadeSteps

        let currentStep = 0
        const fadeInterval = setInterval(() => {
          currentStep++
          const newVolume = Math.min(
            targetVolume,
            currentStep * volumeIncrement
          )
          if (this.sounds[toId] && this.sounds[toId].audio) {
            this.sounds[toId].audio.volume = newVolume
          }

          if (currentStep >= fadeSteps) {
            clearInterval(fadeInterval)
            if (this.sounds[toId] && this.sounds[toId].audio) {
              this.sounds[toId].audio.volume = targetVolume
            }
          }
        }, stepDuration)
      }
    }, duration / 2)
  }

  playTransitionSound(sectionName) {
    this.play("transition")

    if (this.sounds[sectionName]) {
      setTimeout(() => {
        this.play(sectionName)
      }, 300)
    }
  }

  playClickSound() {
    this.play("click")
  }

  playHoverSound() {
    this.play("hover")
  }

  startAmbient() {
    if (!this.isMuted) {
      this.play("ambient")
    }
  }

  stopAmbient() {
    this.stop("ambient")
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value))

    Object.keys(this.sounds).forEach(id => {
      this.sounds[id].audio.volume = this.isMuted ? 0 : this.volume
    })
  }

  toggleMute() {
    this.isMuted = !this.isMuted

    Object.keys(this.sounds).forEach(id => {
      this.sounds[id].audio.muted = this.isMuted
    })

    return this.isMuted
  }

  pauseAllExceptAmbient() {
    const ambientSounds = this.soundCategories.ambient || [
      "ambient",
      "water",
      "fountain",
      "orb",
      "pole",
    ]

    Object.keys(this.sounds).forEach(id => {
      if (!ambientSounds.includes(id)) {
        this.pause(id)
      }
    })
  }

  pauseAllExcept(category) {
    Object.keys(this.sounds).forEach(id => {
      if (this.soundToCategory[id] !== category) {
        this.pause(id)
      }
    })
  }

  stopSectionSounds(sectionName) {
    if (this.sounds[sectionName]) {
      this.stop(sectionName)
    }

    switch (sectionName) {
      case "nav":
        break
      case "about":
        break
      case "aidatingcoach":
        this.stop("mirror")
        break
      case "download":
        break
      case "token":
        this.stop("coins")
        this.stop("atm")
        break
      case "roadmap":
        this.stop("scroll")
        this.stop("paper")
        break
    }
  }

  stopAllSectionSounds() {
    const sections = [
      "nav",
      "about",
      "aidatingcoach",
      "download",
      "token",
      "roadmap",
    ]

    sections.forEach(section => {
      this.stopSectionSounds(section)
    })
    ;["transition", "mirror", "atm", "scroll", "coins", "paper"].forEach(
      sound => {
        if (this.sounds[sound] && sound !== "pole") {
          this.stop(sound)
        }
      }
    )

    if (
      window.isExperienceStarted &&
      this.sounds["pole"] &&
      !this.sounds["pole"].isPlaying
    ) {
      this.play("pole")
    }
  }

  pauseCategory(category) {
    const soundsInCategory = Object.keys(this.sounds).filter(
      id => this.soundToCategory[id] === category
    )

    soundsInCategory.forEach(sound => {
      this.pause(sound)
    })
  }

  pauseSectionSounds(sectionName) {
    if (this.sounds[sectionName]) {
      this.pause(sectionName)
    }

    const sectionElements =
      this.soundCategories.sectionElements[sectionName] || []
    sectionElements.forEach(element => {
      if (this.sounds[element]) {
        this.pause(element)
      }
    })
  }

  playSectionSounds(sectionName) {
    if (this.sounds[sectionName]) {
      this.play(sectionName)
    }

    const sectionElements =
      this.soundCategories.sectionElements[sectionName] || []
    sectionElements.forEach(element => {
      if (this.sounds[element]) {
        this.play(element)
      }
    })
  }

  transitionBetweenSections(fromSection, toSection) {
    this.play("transition")

    if (fromSection) {
      this.pauseSectionSounds(fromSection)
    }

    setTimeout(() => {
      this.playSectionSounds(toSection)
    }, 300)
  }

  updateSpatialSounds = cameraPosition => {
    if (!window.audioManager) return

    const orbPosition = { x: 1.76, y: 1.155, z: -0.883 }
    const distToOrb = distanceBetween(cameraPosition, orbPosition)
    const maxOrbDistance = 3.5

    if (distToOrb < maxOrbDistance) {
      const attenuation = 1 - Math.pow(distToOrb / maxOrbDistance, 2)
      const orbVolume = Math.max(0, 0.3 * attenuation)

      if (window.audioManager && window.audioManager.sounds.orb) {
        if (orbVolume > 0.01) {
          window.audioManager.sounds.orb.audio.volume = orbVolume

          if (!window.audioManager.sounds.orb.isPlaying) {
            window.audioManager.play("orb")
          }
        } else {
          window.audioManager.stop("orb")
        }
      }
    } else {
      if (window.audioManager) {
        window.audioManager.stop("orb")
      }
    }
  }

  updateElementSound(
    soundId,
    cameraPosition,
    maxDistance,
    maxVolume,
    positionKey
  ) {
    const posKey = positionKey || soundId

    if (!this.positions[posKey] || !this.sounds[soundId]) return

    const distance = cameraPosition.distanceTo(this.positions[posKey])

    let effectiveMaxDistance = maxDistance
    if (soundId === "orb") {
      effectiveMaxDistance = 2.5
    } else if (soundId === "portal" || soundId === "heartbeat") {
      effectiveMaxDistance = 5
    } else if (soundId === "fountain") {
      effectiveMaxDistance = 6
    } else if (soundId === "pole") {
      effectiveMaxDistance = 6
    }

    if (distance < effectiveMaxDistance) {
      const attenuation = 1 - Math.pow(distance / effectiveMaxDistance, 2)
      const volume = Math.max(0, maxVolume * attenuation)

      if (volume > 0.01) {
        if (this.sounds[soundId]) {
          this.sounds[soundId].audio.volume = volume

          if (!this.sounds[soundId].isPlaying) {
            console.log(
              `Iniciando som ${soundId} a ${distance.toFixed(2)} unidades`
            )
            this.play(soundId)
          }
        }
      } else {
        this.stop(soundId)
      }
    } else {
      if (this.sounds[soundId] && this.sounds[soundId].isPlaying) {
        this.stop(soundId)
      }
    }
  }

  setElementPosition(elementId, x, y, z) {
    this.positions[elementId] = new Position(x, y, z)
  }

  stopAllAudio() {
    Object.keys(this.sounds).forEach(id => {
      if (id !== "pole" && this.sounds[id] && this.sounds[id].isPlaying) {
        this.sounds[id].audio.pause()
        this.sounds[id].audio.currentTime = 0
        this.sounds[id].isPlaying = false
      }
    })

    const criticalSounds = [
      "orb",
      "fountain",
      "portal",
      "mirror",
      "atm",
      "scroll",
    ]
    criticalSounds.forEach(id => {
      if (id !== "pole" && this.sounds[id]) {
        this.sounds[id].audio.pause()
        this.sounds[id].audio.currentTime = 0
        this.sounds[id].isPlaying = false
      }
    })
  }

  setupNavigationHandlers() {
    if (typeof window !== "undefined") {
      window.stopAllSounds = () => this.stopAllAudio()

      if (window.globalNavigation) {
        const originalNavigateTo = window.globalNavigation.navigateTo

        window.globalNavigation.navigateTo = sectionName => {
          this.stopAllAudio()

          if (originalNavigateTo) {
            originalNavigateTo(sectionName)
          }
        }
      }

      const handleReturnCommand = () => {
        this.stopAllAudio()
      }

      document.addEventListener("returnToCastle", handleReturnCommand)
    }
  }

  preloadAll() {
    Object.keys(this.sounds).forEach(id => {
      const sound = this.sounds[id]
      sound.audio.load()
    })
  }
}

const audioManager = new AudioManager()
window.audioManager = audioManager

const soundLogStatus = {}
const originalPlay = audioManager.play
const originalStartAmbient = audioManager.startAmbient
const originalUpdateSpatialSounds = audioManager.updateSpatialSounds
const originalStopAllSectionSounds = audioManager.stopAllSectionSounds

audioManager.play = function (id, options) {
  const isUiSound = id === "click" || id === "hover"

  if (!window.isExperienceStarted && !isUiSound) {
    if (!soundLogStatus[id] || Date.now() - soundLogStatus[id] > 3000) {
      console.log(
        `[AudioManager] Som "${id}" não reproduzido - aguardando início da experiência`
      )
      soundLogStatus[id] = Date.now()
    }
    return
  }

  return originalPlay.call(this, id, options)
}

audioManager.startAmbient = function () {
  if (!window.isExperienceStarted) {
    if (
      !soundLogStatus["ambient"] ||
      Date.now() - soundLogStatus["ambient"] > 5000
    ) {
      console.log(
        "[AudioManager] Áudio ambiente não iniciado - aguardando início da experiência"
      )
      soundLogStatus["ambient"] = Date.now()
    }
    return
  }

  return originalStartAmbient.call(this)
}

audioManager.updateSpatialSounds = function (cameraPosition) {
  if (!window.isExperienceStarted) {
    return
  }

  return originalUpdateSpatialSounds.call(this, cameraPosition)
}

audioManager.stopAllSectionSounds = function () {
  originalStopAllSectionSounds.call(this)

  if (!window.isExperienceStarted) {
    return
  }
}

audioManager.shouldPlayAudio = function () {
  return window.isExperienceStarted && !this.isMuted
}

audioManager.isExperienceStarted = function () {
  return !!window.isExperienceStarted
}

if (typeof window !== "undefined") {
  let _isExperienceStarted = false

  if (!window.hasOwnProperty("isExperienceStarted")) {
    window.isExperienceStarted = false
  }

  const originalDescriptor = Object.getOwnPropertyDescriptor(
    window,
    "isExperienceStarted"
  )

  if (!originalDescriptor || originalDescriptor.configurable) {
    Object.defineProperty(window, "isExperienceStarted", {
      configurable: true,
      enumerable: true,
      get: function () {
        return _isExperienceStarted
      },
      set: function (value) {
        _isExperienceStarted = value
        if (value === true) {
          setTimeout(() => {
            originalStartAmbient.call(audioManager)
          }, 300)
        }
      },
    })
  }
}

window.blockTransitionSound = !window.isExperienceStarted

export default audioManager
