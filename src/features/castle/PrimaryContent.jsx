import React, { useRef, useState, useEffect } from "react"
import { Sparkles, Environment } from "@react-three/drei"
import gsap from "gsap"
import * as THREE from "three"

import FountainParticles from "../../components/FountainParticles"
import { EffectsTree } from "../../components/helpers/EffectsTree"
import Castle from "../../assets/models/Castle"
import { Flower } from "../../assets/models/Flower"
import { Pole } from "../../assets/models/Pole"
import { Stairs } from "../../assets/models/Stairs"
import Orb from "../../assets/models/Orb"

// Pode ser movido para um hook ou utils mais tarde
import { useMobileDetection } from "../../hooks/useMobileDetection"

const PrimaryContent = React.memo(
  ({ activeSection, onSectionChange, isReady }) => {
    const groundParams = useRef({
      height: 5,
      radius: 110,
      scale: 100,
    })
    const [forceUpdate, setForceUpdate] = useState(0)
    const isMobile = useMobileDetection()

    // Iniciar animações quando a cena estiver pronta
    useEffect(() => {
      if (isReady && typeof gsap !== "undefined") {
        console.log("Starting Environment Animation")

        gsap.to(groundParams.current, {
          radius: 10,
          duration: 2,
          delay: 0,
          ease: "sine.inOut",
          onUpdate: () => {
            setForceUpdate(prev => prev + 1)
          },
          onComplete: () => {
            console.log("Animation completed!")
          },
        })
      }
    }, [isReady])

    return (
      <>
        <Environment
          files="/images/CloudsBG.hdr"
          background
          resolution={256}
          ground={{
            height: groundParams.current.height,
            radius: groundParams.current.radius,
            scale: groundParams.current.scale,
          }}
        />
        <Sparkles
          count={80}
          size={Array.from({ length: 25 }, () => 4 + Math.random() * 2)}
          scale={[10, 3, 10]}
          position={[0, 6, 0]}
          speed={0.01}
          color="#ff00ff"
          opacity={0.1}
        />
        <EffectsTree />
        <FountainParticles
          count={80}
          color="lightpink"
          size={0.03}
          speed={0.65}
          spread={0.3}
          layers-enable={2}
          castShadow={false}
          receiveShadow={false}
        />
        <Castle activeSection={activeSection} scale={[2, 1.6, 2]} />
        <Flower />
        <Stairs />
        <Orb />
        <Pole
          position={[-0.8, 0, 5.8]}
          scale={[0.6, 0.6, 0.6]}
          onSectionChange={onSectionChange}
        />
      </>
    )
  }
)

export default PrimaryContent
