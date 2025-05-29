import React, { useRef, useEffect } from "react"
import Lottie from "lottie-react"
import animationData from "./ToogleMusic.json"

const ToogleMusic = ({ isActive }) => {
  const lottieRef = useRef(null)

  // Sincroniza a animação com o estado isActive
  useEffect(() => {
    if (!lottieRef.current) return

    if (isActive) {
      lottieRef.current.goToAndStop(0, true)
    } else {
      lottieRef.current.goToAndStop(15, true)
    }
  }, [isActive])

  return (
    <div style={{ display: "inline-block" }}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={false}
        autoplay={false}
        style={{ height: 24, width: 40 }}
      />
    </div>
  )
}

export default ToogleMusic
