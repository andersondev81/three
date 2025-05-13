import React, { useRef, useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { CameraControls, Environment } from "@react-three/drei"
import Castle from "../assets/models/Castle"

// Detector de dispositivo móvel simplificado
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768

const MinimalExperience = () => {
  // Configuração básica para melhorar desempenho
  const canvasConfig = {
    dpr: isMobile ? 0.5 : 1, // Reduzir drasticamente a resolução em dispositivos móveis
    gl: {
      antialias: !isMobile,
      powerPreference: "low-power", // Sempre priorizar economia de bateria
      alpha: false,
      depth: true,
      stencil: false,
      precision: isMobile ? "lowp" : "mediump",
    },
    camera: {
      fov: 50,
      near: 0.1,
      far: 100,
      position: [0, 1, 6], // Posição inicial simples
    },
    shadows: false, // Desativar sombras completamente
  }

  return (
    <div className="relative w-full h-screen">
      <Canvas {...canvasConfig} className="w-full h-full">
        {/* Luz ambiente básica */}
        <ambientLight intensity={1.5} />

        {/* Apenas o Castle */}
        <Castle activeSection="nav" scale={[2, 1.6, 2]} />

        {/* Controles básicos de câmera */}
        <CameraControls makeDefault />

        {/* Ambiente simples */}
        <Environment preset="sunset" />
      </Canvas>

      {/* Aviso para dispositivos móveis */}
      {isMobile && (
        <div className="absolute bottom-4 left-0 right-0 text-center text-white text-xs bg-black/50 p-2">
          Versão simplificada para dispositivos móveis.
        </div>
      )}
    </div>
  )
}

export default MinimalExperience
