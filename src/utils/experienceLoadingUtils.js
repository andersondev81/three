/**
 * ✅ SISTEMA DE EVENTOS CENTRALIZADO
 * Substitui window.onExperienceLoaded com approach mais limpo
 */

/**
 * Dispara evento quando experiência está totalmente carregada
 * @param {string} source - Fonte que disparou o evento
 * @param {Object} details - Detalhes adicionais
 */
export const notifyExperienceLoaded = (source = "unknown", details = {}) => {
  console.log(
    `📦 [LoadingUtils] Disparando experienceLoaded de: ${source}`,
    details
  )

  document.dispatchEvent(
    new CustomEvent("experienceLoaded", {
      detail: {
        source,
        timestamp: Date.now(),
        ...details,
      },
    })
  )
}

/**
 * Escuta eventos de experiência carregada
 * @param {Function} callback - Função a ser chamada quando evento ocorrer
 * @returns {Function} - Função de cleanup
 */
export const onExperienceLoaded = callback => {
  const handleEvent = event => {
    console.log(
      "📦 [LoadingUtils] Evento experienceLoaded capturado:",
      event.detail
    )
    callback(event)
  }

  document.addEventListener("experienceLoaded", handleEvent)

  return () => {
    document.removeEventListener("experienceLoaded", handleEvent)
  }
}

/**
 * Compatibilidade com código legado que ainda usa window.onExperienceLoaded
 */
export const setupLegacyCompatibility = () => {
  window.onExperienceLoaded = function (details) {
    console.log(
      "⚠️ [LoadingUtils] window.onExperienceLoaded chamado - redirecionando para eventos"
    )
    notifyExperienceLoaded("legacy-window-callback", details)
  }
}

/**
 * Remove compatibilidade legada
 */
export const cleanupLegacyCompatibility = () => {
  window.onExperienceLoaded = null
}
