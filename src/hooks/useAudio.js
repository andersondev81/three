// ✅ CRIAR NOVO ARQUIVO: hooks/useAudio.js
import { useCallback } from "react"
import { useAudioStore } from "../stores/audioStore"

/**
 * Hook simplificado para interação com áudio
 * Use este hook quando precisar de controle direto sobre sons específicos
 */
export function useAudio() {
  const {
    playSound,
    stopSound,
    pauseSound,
    setUserInteracted,
    playTransition,
    muted,
    volume,
    isPlaying,
    canPlay,
  } = useAudioStore()

  // Wrapper para garantir interação do usuário
  const safePlay = useCallback(
    (soundId, options = {}) => {
      setUserInteracted()
      return playSound(soundId, options)
    },
    [playSound, setUserInteracted]
  )

  // Wrapper para transições
  const playTransitionTo = useCallback(
    toSection => {
      setUserInteracted()
      playTransition(null, toSection)
    },
    [playTransition, setUserInteracted]
  )

  return {
    // Métodos principais
    play: safePlay,
    stop: stopSound,
    pause: pauseSound,
    playTransition: playTransitionTo,

    // Estado
    muted,
    volume,
    canPlay: canPlay(),

    // Utilitários
    isPlaying,
    setUserInteracted,
  }
}

/**
 * Hook para sons de UI (botões, hovers, etc.)
 */
export function useUIAudio() {
  const { play } = useAudio()

  const playClick = useCallback(() => {
    play("transition", { volume: 0.1 })
  }, [play])

  const playHover = useCallback(() => {
    // Som de hover mais sutil
    play("transition", { volume: 0.05 })
  }, [play])

  return {
    playClick,
    playHover,
  }
}
