import React, { useRef, useState } from "react"
import Lottie from "lottie-react"
import animationData from "./ToogleMusic.json"

const ToogleMusic = () => {
  const lottieRef = useRef(null)
  const [isForward, setIsForward] = useState(true) // Estado para controlar a direção da animação

  const handleClick = () => {
    if (isForward) {
      lottieRef.current?.playSegments([0, 15], true) // Animação vai do frame 0 ao 30
    } else {
      lottieRef.current?.playSegments([15, 0], true) // Animação volta do frame 30 ao 0
    }
    setIsForward(!isForward) // Alterna a direção no próximo clique
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: "inline-block",
        cursor: "pointer",
      }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={false}
        autoplay={false}
        style={{ height: 24, width: 40 }} // Ajuste o tamanho conforme necessário
      />
    </div>
  )
}

export default ToogleMusic
