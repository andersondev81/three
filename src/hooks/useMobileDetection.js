import { useState, useEffect } from "react"

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera
      const mobileRegex =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0

      setIsMobile(
        mobileRegex.test(userAgent) || window.innerWidth < 768 || isTouchDevice
      )
    }

    // Initial check
    checkMobile()

    // Debounce resize events
    const debouncedCheck = debounce(checkMobile, 200)
    window.addEventListener("resize", debouncedCheck)

    return () => window.removeEventListener("resize", debouncedCheck)
  }, [])

  return isMobile
}

// Simple debounce helper
function debounce(func, wait) {
  let timeout
  return function () {
    clearTimeout(timeout)
    timeout = setTimeout(func, wait)
  }
}
