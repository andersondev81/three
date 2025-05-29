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
    this.ambientVolume = 0.3
    this.positions = {
      orb: new Position(1.76, 1.155, -0.883),
      fountain: new Position(0, 0.8, 2.406),
      portal: new Position(0, 1.247, -2.117),
      heart: new Position(0, 4.18, -0.006),
    }

    this.setupSoundCategories()
    this.setupSoundsOptimized() // ← OTIMIZADO
    this.canAutoplay = false
    this.checkAutoplayOptimized() // ← OTIMIZADO
  }

  killAllAudio() {
    console.log("🔇 MATANDO TODOS OS ÁUDIOS...")
    let stopped = 0

    try {
      // 1. Parar todos os sons do AudioManager
      Object.keys(this.sounds || {}).forEach(id => {
        try {
          const sound = this.sounds[id]
          if (sound && sound.audio) {
            sound.audio.pause()
            sound.audio.volume = 0
            sound.audio.currentTime = 0
            sound.audio.muted = true
            sound.isPlaying = false
            stopped++
          }
        } catch (e) {}
      })

      // 2. Configurações internas
      this.isMuted = true
      this.ambientVolume = 0
      this.volume = 0

      // 3. Parar todos os elementos <audio> da página
      document.querySelectorAll("audio").forEach(audio => {
        try {
          audio.pause()
          audio.volume = 0
          audio.muted = true
          audio.currentTime = 0
          stopped++
        } catch (e) {}
      })

      // 4. Parar todos os vídeos (podem ter áudio)
      document.querySelectorAll("video").forEach(video => {
        try {
          video.pause()
          video.volume = 0
          video.muted = true
          stopped++
        } catch (e) {}
      })

      // 5. Limpar cache de áudio se existir
      if (window.audioCache) {
        Object.keys(window.audioCache).forEach(key => {
          try {
            if (window.audioCache[key] && window.audioCache[key].pause) {
              window.audioCache[key].pause()
              window.audioCache[key].volume = 0
              window.audioCache[key].muted = true
              stopped++
            }
          } catch (e) {}
        })
      }

      console.log(`✅ ${stopped} elementos de áudio parados`)
      return true
    } catch (error) {
      console.error("Erro ao parar áudios:", error)
      return false
    }
  }

  reviveAllAudio() {
    console.log("🔊 REATIVANDO ÁUDIOS...")

    try {
      // 1. Reativar configurações
      this.isMuted = false
      this.ambientVolume = 0.3
      this.volume = 0.5

      // 2. Reativar sons importantes
      Object.keys(this.sounds || {}).forEach(id => {
        try {
          const sound = this.sounds[id]
          if (sound && sound.audio) {
            sound.audio.muted = false
            if (id === "ambient") {
              sound.audio.volume = this.ambientVolume
              sound.volume = this.ambientVolume
            } else {
              sound.audio.volume = sound.volume || this.volume
            }
          }
        } catch (e) {}
      })

      // 3. Reiniciar áudio ambiente se apropriado
      if (this.sounds.ambient && this.ambientVolume > 0) {
        setTimeout(() => {
          this.play("ambient")
        }, 100)
      }

      console.log("✅ Áudios reativados")
      return true
    } catch (error) {
      console.error("Erro ao reativar áudios:", error)
      return false
    }
  }

  setupSoundCategories() {
    this.soundCategories = {
      ambient: ["ambient", "water", "fountain", "heartbeat", "portal", "orb"],
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

  // OTIMIZADO: Setup consolidado de áudios
  setupSoundsOptimized() {
    // Definir todos os sons em uma estrutura consolidada
    const soundsConfig = [
      {
        id: "transition",
        path: "../sounds/camerawoosh.MP3",
        volume: 0.1,
        loop: false,
      },
      {
        id: "aidatingcoach",
        path: "../sounds/daingcoachmirror.MP3",
        volume: 0.1,
        loop: true,
      },
      {
        id: "token",
        path: "../sounds/atmambiance.mp3",
        volume: 0.1,
        loop: true,
      },
      {
        id: "roadmap",
        path: "../sounds/roadmapscroll.mp3",
        volume: 0.1,
        loop: true,
      },
      {
        id: "ambient",
        path: "../sounds/templeambiance.mp3",
        volume: this.ambientVolume,
        loop: true,
      },
      { id: "orb", path: "../sounds/orb.mp3", volume: 0.3, loop: true },
      { id: "fountain", path: "/sounds/fountain.mp3", volume: 0.3, loop: true },
    ]

    // OTIMIZAÇÃO: Criar todos os áudios de uma vez só com lazy loading
    soundsConfig.forEach(config => {
      this.sounds[config.id] = {
        path: config.path,
        volume: config.volume,
        loop: config.loop,
        isPlaying: false,
        audio: null, // ← Lazy loading: só cria quando necessário
      }
    })
  }

  // OTIMIZADO: Verificação de autoplay mais eficiente
  checkAutoplayOptimized() {
    // Só verifica autoplay quando realmente necessário
    this.canAutoplay = false

    // Adiado para primeira tentativa de reprodução
    this.autoplayTested = false
  }

  // OTIMIZADO: Lazy loading de áudio
  createAudioElement(id) {
    if (!this.sounds[id] || this.sounds[id].audio) return

    const config = this.sounds[id]
    const audio = new Audio()

    // Configuração mínima para evitar preload
    audio.preload = "none" // ← OTIMIZAÇÃO: Não fazer preload automático
    audio.src = config.path
    audio.volume = config.volume
    audio.loop = false // Sempre false no elemento - controle manual

    this.sounds[id].audio = audio
  }

  // OTIMIZADO: Registro de som sem criar elemento imediatamente
  registerSound(id, path, options = {}) {
    this.sounds[id] = {
      path: path,
      volume: options.volume || this.volume,
      loop: options.loop || false,
      isPlaying: false,
      audio: null, // ← Lazy loading
    }
  }

  play(id) {
    if (this.isMuted || !this.sounds[id]) return

    // Lazy loading: criar áudio só quando necessário
    if (!this.sounds[id].audio) {
      this.createAudioElement(id)
    }

    const sound = this.sounds[id]
    if (!sound.audio) return

    // Teste de autoplay na primeira reprodução
    if (!this.autoplayTested) {
      this.autoplayTested = true
      this.canAutoplay = true // Assumir que pode - fallback se necessário
    }

    sound.audio.loop = false
    if (id === "ambient") {
      sound.audio.loop = true
    }

    sound.isPlaying = true
    sound.audio.volume = sound.volume

    const playPromise = sound.audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        sound.isPlaying = false
        this.canAutoplay = false
      })
    }
  }

  stop(id) {
    if (!this.sounds[id] || !this.sounds[id].audio) return

    const sound = this.sounds[id]
    if (sound.isPlaying) {
      sound.audio.pause()
      sound.audio.currentTime = 0
      sound.isPlaying = false
    }
  }

  pause(id) {
    if (!this.sounds[id] || !this.sounds[id].audio) return

    const sound = this.sounds[id]
    if (sound.isPlaying) {
      sound.audio.pause()
    }
  }

  resume(id) {
    if (this.isMuted || !this.sounds[id]) return

    // Lazy loading se necessário
    if (!this.sounds[id].audio) {
      this.createAudioElement(id)
    }

    const sound = this.sounds[id]
    if (!sound.audio) return

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
    if (
      !this.sounds[id] ||
      !this.sounds[id].audio ||
      !this.sounds[id].isPlaying
    )
      return

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
        // Lazy loading se necessário
        if (!this.sounds[toId].audio) {
          this.createAudioElement(toId)
        }

        if (this.sounds[toId].audio) {
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
    if (!this.isMuted && this.ambientVolume > 0) {
      this.play("ambient")
    }
  }

  stopAmbient() {
    this.stop("ambient")
  }

  setAmbientVolume(volume) {
    this.ambientVolume = Math.max(0, Math.min(1, volume))

    if (this.sounds.ambient) {
      this.sounds.ambient.volume = this.ambientVolume

      if (this.ambientVolume === 0) {
        if (this.sounds.ambient.audio) {
          this.sounds.ambient.audio.pause()
          this.sounds.ambient.audio.volume = 0
          this.sounds.ambient.isPlaying = false
        }
      } else {
        if (this.sounds.ambient.audio) {
          this.sounds.ambient.audio.volume = this.isMuted
            ? 0
            : this.ambientVolume
        }
        if (!this.sounds.ambient.isPlaying && !this.isMuted) {
          this.play("ambient")
        }
      }
    }
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value))

    Object.keys(this.sounds).forEach(id => {
      if (id !== "ambient" && this.sounds[id].audio) {
        // CORRIGIDO: Verificar se audio existe antes de acessar volume
        this.sounds[id].audio.volume = this.isMuted ? 0 : this.volume
      }
    })
  }

  toggleMute() {
    this.isMuted = !this.isMuted

    Object.keys(this.sounds).forEach(id => {
      // CORRIGIDO: Verificar se audio existe antes de acessar muted
      if (this.sounds[id].audio) {
        this.sounds[id].audio.muted = this.isMuted
      }
    })

    return this.isMuted
  }

  pauseAllExceptAmbient() {
    const ambientSounds = this.soundCategories.ambient || [
      "ambient",
      "water",
      "fountain",
      "orb",
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
        if (this.sounds[sound] && sound !== "ambient") {
          this.stop(sound)
        }
      }
    )

    if (
      window.isExperienceStarted &&
      this.sounds["ambient"] &&
      !this.sounds["ambient"].isPlaying &&
      !this.isMuted &&
      this.ambientVolume > 0
    ) {
      this.play("ambient")
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
          // CORRIGIDO: Verificar se audio existe antes de acessar volume
          if (window.audioManager.sounds.orb.audio) {
            window.audioManager.sounds.orb.audio.volume = orbVolume
          }

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
    }

    if (distance < effectiveMaxDistance) {
      const attenuation = 1 - Math.pow(distance / effectiveMaxDistance, 2)
      const volume = Math.max(0, maxVolume * attenuation)

      if (volume > 0.01) {
        if (this.sounds[soundId]) {
          // CORRIGIDO: Verificar se audio existe antes de acessar volume
          if (this.sounds[soundId].audio) {
            this.sounds[soundId].audio.volume = volume
          }

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
      if (id !== "ambient" && this.sounds[id] && this.sounds[id].isPlaying) {
        if (this.sounds[id].audio) {
          this.sounds[id].audio.pause()
          this.sounds[id].audio.currentTime = 0
        }
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
      if (id !== "ambient" && this.sounds[id]) {
        if (this.sounds[id].audio) {
          this.sounds[id].audio.pause()
          this.sounds[id].audio.currentTime = 0
        }
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

  // ADICIONADO: Método preloadAll para compatibilidade (agora otimizado)
  preloadAll() {
    // Não fazer preload imediato - apenas preparar estruturas
    // Os áudios serão carregados sob demanda quando play() for chamado
    console.log(
      "[AudioManager] preloadAll() chamado - usando lazy loading otimizado"
    )
  }

  // REMOVIDO: preloadAll() - não fazer preload automático
  // Os áudios são carregados sob demanda quando necessário
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
window.killAllAudio = function () {
  console.log("🚨 EXECUTANDO KILL ALL AUDIO...")

  let success = false

  // Tentar via AudioManager primeiro
  if (window.audioManager && window.audioManager.killAllAudio) {
    success = window.audioManager.killAllAudio()
  }

  // Backup brutal se AudioManager falhar
  if (!success) {
    console.log("⚠️ Backup mode ativado...")

    // Parar todos os áudios da página brutalmente
    document.querySelectorAll("audio, video").forEach(media => {
      try {
        media.pause()
        media.volume = 0
        media.muted = true
        media.currentTime = 0
      } catch (e) {}
    })

    // Quebrar qualquer Audio global
    if (window.audioCache) {
      Object.keys(window.audioCache).forEach(key => {
        try {
          window.audioCache[key].pause()
          window.audioCache[key].volume = 0
        } catch (e) {}
      })
    }
  }

  alert("🔇 TODOS os áudios foram desativados!")
}

// Função global para reativar tudo
window.reviveAllAudio = function () {
  console.log("🔊 EXECUTANDO REVIVE ALL AUDIO...")

  if (window.audioManager && window.audioManager.reviveAllAudio) {
    window.audioManager.reviveAllAudio()
  }

  alert("🔊 Áudios foram reativados!")
}

export default audioManager
