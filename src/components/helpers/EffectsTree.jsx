import { Bloom, EffectComposer } from "@react-three/postprocessing"
import React, { useMemo } from "react"

export const EffectsTree = () => {
  // Configurações fixas em vez de useControls
  const bloomConfig = {
    enabled: true,
    luminanceThreshold: 1.1,
    intensity: 7.5,
    mipmapBlur: true,
    kernelSize: 4,
    luminanceSmoothing: 0.94,
    radius: 0.42,
  }

  const effectsTree = useMemo(() => {
    return (
      <EffectComposer disableNormalPass multisampling={0}>
        {bloomConfig.enabled && (
          <Bloom
            {...bloomConfig}
            mipmapBlur={false}
            kernelSize={2}
            intensity={5}
          />
        )}
      </EffectComposer>
    )
  }, [bloomConfig])

  return <>{effectsTree}</>
}
