export const calculateDistance = (point1, point2) => {
  const dx = point1.x - point2.x
  const dy = point1.y - point2.y
  const dz = point1.z - point2.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * Calcula atenuação de volume baseado na distância
 */
export const calculateAttenuation = (distance, maxDistance, curve = 2) => {
  if (distance >= maxDistance) return 0
  const normalizedDistance = distance / maxDistance
  return Math.max(0, 1 - Math.pow(normalizedDistance, curve))
}

/**
 * Configurações centralizadas de posições de áudio
 */
export const AUDIO_POSITIONS = {
  orb: { x: 1.76, y: 1.155, z: -0.883 },
  fountain: { x: 0, y: 0.8, z: 2.406 },
  portal: { x: 0, y: 1.247, z: -2.117 },
  heart: { x: 0, y: 4.18, z: -0.006 },
  pole: { x: 0.2, y: -0.35, z: -0.2 },
  mirror: { x: -2.3, y: 1.4, z: -1.2 },
  atm: { x: 1.8, y: 1.2, z: 0.9 },
  coins: { x: 1.5, y: 1.5, z: 1.2 },
  scroll: { x: -2.1, y: 1.1, z: 1.1 },
  paper: { x: -1.8, y: 1.3, z: 1.3 },
  temple: { x: 0, y: 0, z: 0 },
}

/**
 * Configurações de áudio por elemento
 */
export const AUDIO_CONFIG = {
  // Áudio ambiente
  ambient: {
    path: "/sounds/templeambiance.mp3",
    loop: true,
    volume: 1,
    maxDistance: 20,
    position: AUDIO_POSITIONS.temple,
  },

  // Elementos com posição fixa
  orb: {
    path: "/sounds/orb.mp3",
    loop: true,
    volume: 0.3,
    maxDistance: 3.5,
    position: AUDIO_POSITIONS.orb,
  },
  fountain: {
    path: "/sounds/fountain.mp3",
    loop: true,
    volume: 0.3,
    maxDistance: 6,
    position: AUDIO_POSITIONS.fountain,
  },
  pole: {
    path: "/sounds/templeambiance.mp3",
    loop: true,
    volume: 1,
    maxDistance: 6,
    position: AUDIO_POSITIONS.pole,
  },

  // Sons de interação
  transition: {
    path: "/sounds/camerawoosh.MP3",
    loop: false,
    volume: 0.1,
  },
  mirror: {
    path: "/sounds/daingcoachmirror.MP3",
    loop: true,
    volume: 0.1,
    maxDistance: 8,
    position: AUDIO_POSITIONS.mirror,
  },
  atm: {
    path: "/sounds/atmambiance.mp3",
    loop: true,
    volume: 0.3,
    maxDistance: 7,
    position: AUDIO_POSITIONS.atm,
  },
  coins: {
    path: "/sounds/coins.mp3",
    loop: false,
    volume: 0.3,
    maxDistance: 5,
    position: AUDIO_POSITIONS.coins,
  },
  scroll: {
    path: "/sounds/roadmapscroll.mp3",
    loop: true,
    volume: 0.3,
    maxDistance: 7,
    position: AUDIO_POSITIONS.scroll,
  },
  paper: {
    path: "/sounds/paper.mp3",
    loop: false,
    volume: 0.3,
    maxDistance: 4,
    position: AUDIO_POSITIONS.paper,
  },

  // Sons de seções (fallback)
  about: { path: "/sounds/orb.mp3", loop: true, volume: 0.2 },
  aidatingcoach: {
    path: "/sounds/daingcoachmirror.MP3",
    loop: true,
    volume: 0.1,
  },
  token: { path: "/sounds/atmambiance.mp3", loop: true, volume: 0.1 },
  roadmap: { path: "/sounds/roadmapscroll.mp3", loop: true, volume: 0.1 },
}

/**
 * Throttle function para otimização
 */
export const createThrottle = (delay = 16) => {
  const throttleMap = new Map()

  return (id, fn) => {
    if (throttleMap.has(id)) return

    throttleMap.set(id, true)
    requestAnimationFrame(() => {
      fn()
      setTimeout(() => throttleMap.delete(id), delay)
    })
  }
}

/**
 * Configurações de áudio por seção para facilitar gerenciamento
 */
export const SECTION_AUDIO_CONFIG = {
  nav: ["fountain", "pole", "temple"],
  about: ["fountain", "orb"],
  aidatingcoach: ["fountain", "mirror"],
  token: ["fountain", "atm", "coins"],
  roadmap: ["fountain", "scroll", "paper"],
}
