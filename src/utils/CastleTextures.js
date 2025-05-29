import { useTexture } from "@react-three/drei"
import React, { useMemo, useEffect, useState } from "react"
import * as THREE from "three"
import {
  Color,
  DoubleSide,
  LinearFilter,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NearestFilter,
  NormalBlending,
} from "three"

// OTIMIZAÇÃO: Carregamento consolidado de todas as texturas do castelo em um só hook
const useCastleTextures = () => {
  return useTexture({
    // Castle Main
    castleColor: "/texture/castleColor.avif",
    castleRoughness: "/texture/castleRoughnessV1.avif",
    castleMetallic: "/texture/castleMetallicV1.avif",

    // Castle Heart
    castleHeartColor: "/texture/castleHeart_Base_colorAO.avif",
    castleLightsEmissive: "/texture/castleLights_Emissive.avif",

    // Gods Wall
    godsWallColor: "/texture/GodsWallColor.avif",
    godsWallRoughness: "/texture/castleGodsWall_Roughness.avif",

    // Castle Walls
    wallsColor: "/texture/WallsColor.avif",
    floorRoughness: "/texture/floor_Roughness.avif",

    // Pilars
    pilarsColor: "/texture/PilarsColor.avif",
    pilarsRoughness: "/texture/castlePilars_Roughness.avif",
    pilarsMetallic: "/texture/castlePilars_Metallic.avif",
    pilarsEmissive: "/texture/castlePilars_Emissive.avif",

    // Floor
    floorAO: "/texture/floorAO.avif",
    floorHeartMetallic: "/texture/floorHeart_Metallic.avif",
    floorHeartColor: "/texture/floorHeartColor.avif",
    floorHeartRoughness: "/texture/floorHeart_Roughness.avif",
    floorHeartEmissive: "/texture/floorHeart_Emissive.avif",

    // Wings
    wingsColor: "/texture/wingsColor_.avif",
    wingsRoughness: "/texture/wingsRoughness.avif",

    // Gods
    godsColorAO: "/texture/godsColorAO.avif",

    // Hoof
    hoofGlassColor: "/texture/hoofGlassColorBAO.avif",
    hoofGlassEmissive: "/texture/hoofGlassEmissiveV2.avif",

    // ATM
    atmBake: "/texture/atmBake1.avif",
    atmMetallic: "/texture/atmMetallicV1.avif",
    atmEmissive: "/texture/atmEmissive.avif",

    // Scroll
    scrollColor: "/texture/ScrollColorV1.avif",
  })
}

// OTIMIZAÇÃO: Environment maps consolidados
const useEnvironmentMaps = () => {
  return useTexture({
    bg1: "/images/bg1.jpg",
    studio: "/images/studio.jpg",
    clouds: "/images/clouds.jpg",
  })
}

// Castle Main Material
export const useCastleMaterial = () => {
  const textures = useCastleTextures()
  const envMaps = useEnvironmentMaps()

  useMemo(() => {
    // Configure castle textures
    ;[
      textures.castleColor,
      textures.castleRoughness,
      textures.castleMetallic,
    ].forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (envMaps.bg1) {
      envMaps.bg1.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, envMaps])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.castleColor,
      roughnessMap: textures.castleRoughness,
      metalnessMap: textures.castleMetallic,
      roughness: 0.2,
      metalness: 0,
      blending: NormalBlending,
      envMap: envMaps.bg1,
      envMapIntensity: 1,
      side: DoubleSide,
      transparent: false,
    })
  }, [textures, envMaps])
}

// Heart Back Wall Material
export const useCastleHeartMaterial = (
  metalness = 1.1,
  roughness = 0,
  emissiveIntensity = 0.3,
  emissiveColor = "#ff0000"
) => {
  const textures = useCastleTextures()
  const envMaps = useEnvironmentMaps()

  useMemo(() => {
    if (textures.castleHeartColor) {
      textures.castleHeartColor.flipY = true
      textures.castleHeartColor.minFilter =
        textures.castleHeartColor.magFilter = NearestFilter
    }

    if (envMaps.bg1) {
      envMaps.bg1.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, envMaps])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.castleHeartColor,
      side: DoubleSide,
      transparent: false,
      alphaTest: 0.05,
      roughness: roughness,
      metalness: metalness,
      emissive: new Color(emissiveColor),
      emissiveIntensity: emissiveIntensity,
      blending: NormalBlending,
      envMap: envMaps.bg1,
    })
  }, [
    textures,
    metalness,
    roughness,
    emissiveIntensity,
    emissiveColor,
    envMaps,
  ])
}

// Castle Heart Mask Material
export const useCastleHeartMaskMaterial = () => {
  const envMaps = useEnvironmentMaps()

  useEffect(() => {
    if (envMaps.studio) {
      envMaps.studio.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [envMaps])

  return useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color("#E8B84E"),
        transparent: false,
        alphaTest: 0.05,
        side: DoubleSide,
        blending: NormalBlending,
        roughness: 0.2,
        metalness: 1.5,
        envMap: envMaps.studio,
        envMapIntensity: 1.5,
        emissive: new Color("#F0D060"),
        emissiveIntensity: 0.3,
      }),
    [envMaps]
  )
}

// Heart Lights Material
export const useCastleLightsMaterial = () => {
  const textures = useCastleTextures()

  return useMemo(
    () =>
      new MeshStandardMaterial({
        emissive: new Color("#fff"),
        emissiveIntensity: 1,
        emissiveMap: textures.castleLightsEmissive,
        side: DoubleSide,
      }),
    [textures]
  )
}

// Gods Walls Material
export const usecastleGodsWallsMaterial = (
  materialType = "standard",
  metalness = 0.6,
  roughness = 1.6
) => {
  const textures = useCastleTextures()
  const envMaps = useEnvironmentMaps()

  useMemo(() => {
    ;[textures.godsWallColor, textures.godsWallRoughness].forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (envMaps.bg1) {
      envMaps.bg1.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, envMaps])

  return useMemo(() => {
    const commonProps = {
      map: textures.godsWallColor,
      side: DoubleSide,
      transparent: false,
    }

    const pbrProps = {
      ...commonProps,
      roughnessMap: textures.godsWallRoughness,
      roughness: roughness,
      metalness: metalness,
      blending: NormalBlending,
      envMap: envMaps.bg1,
      envMapIntensity: 2.5,
    }

    switch (materialType) {
      case "physical":
        return new MeshStandardMaterial(pbrProps)
      case "basic":
        return new MeshBasicMaterial({
          ...commonProps,
          color: new Color(0xffffff),
        })
      case "standard":
      default:
        return new MeshStandardMaterial(pbrProps)
    }
  }, [textures, materialType, metalness, roughness, envMaps])
}

// Castle Walls Material
export const useCastleWallsMaterial = (metalness = 0, roughness = 1) => {
  const textures = useCastleTextures()
  const envMaps = useEnvironmentMaps()

  useMemo(() => {
    ;[textures.wallsColor, textures.floorRoughness].forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (envMaps.bg1) {
      envMaps.bg1.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, envMaps])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.wallsColor,
      roughnessMap: textures.floorRoughness,
      roughness: 0.2,
      blending: NormalBlending,
      envMap: envMaps.bg1,
      envMapIntensity: 1,
      side: DoubleSide,
      transparent: false,
      alphaTest: 0.05,
    })
  }, [textures, envMaps])
}

// Castle Pilars Material
export const useCastlePilarsMaterial = (metalness = 0, roughness = 1) => {
  const textures = useCastleTextures()
  const envMaps = useEnvironmentMaps()

  useMemo(() => {
    ;[
      textures.pilarsColor,
      textures.pilarsRoughness,
      textures.pilarsMetallic,
      textures.pilarsEmissive,
    ].forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (envMaps.bg1) {
      envMaps.bg1.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, envMaps])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.pilarsColor,
      roughnessMap: textures.pilarsRoughness,
      metalnessMap: textures.pilarsMetallic,
      emissiveMap: textures.pilarsEmissive,
      emissive: new Color(0xe8b84e),
      emissiveIntensity: 2.5,
      roughness: roughness,
      metalness: metalness,
      blending: NormalBlending,
      envMap: envMaps.bg1,
      envMapIntensity: 1.0,
      side: DoubleSide,
      transparent: false,
      alphaTest: 0.05,
    })
  }, [textures, envMaps])
}

// Floor Material
export const useFloorMaterial = (metalness = 0, roughness = 1) => {
  const textures = useCastleTextures()
  const envMaps = useEnvironmentMaps()

  useMemo(() => {
    ;[
      textures.floorAO,
      textures.floorRoughness,
      textures.floorHeartMetallic,
    ].forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (envMaps.bg1) {
      envMaps.bg1.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, envMaps])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.floorAO,
      roughnessMap: textures.floorRoughness,
      metalnessMap: textures.floorHeartMetallic,
      roughness: 0.2,
      metalness: 1.3,
      blending: NormalBlending,
      envMap: envMaps.bg1,
      envMapIntensity: 1,
      side: DoubleSide,
      transparent: false,
      alphaTest: 0.05,
    })
  }, [textures, envMaps])
}

// Mirror Frame Material
export const useMirrorFrameMaterial = () => {
  const envMaps = useEnvironmentMaps()

  useEffect(() => {
    if (envMaps.studio) {
      envMaps.studio.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [envMaps])

  return useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#E8B84E"),
        transparent: false,
        alphaTest: 0.05,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
        roughness: 0,
        metalness: 1,
        envMap: envMaps.studio,
        envMapIntensity: 2.2,
        emissive: new THREE.Color("#F0D060"),
        emissiveIntensity: 0.1,
      }),
    [envMaps]
  )
}

// Floor Heart Material
export const useFloorHeartMaterial = () => {
  const textures = useCastleTextures()
  const envMaps = useEnvironmentMaps()

  useMemo(() => {
    ;[
      textures.floorHeartColor,
      textures.floorHeartRoughness,
      textures.floorHeartMetallic,
      textures.floorHeartEmissive,
    ].forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (envMaps.bg1) {
      envMaps.bg1.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, envMaps])

  return useMemo(() => {
    return new MeshPhysicalMaterial({
      map: textures.floorHeartColor,
      roughnessMap: textures.floorHeartRoughness,
      metalnessMap: textures.floorHeartMetallic,
      emissiveMap: textures.floorHeartEmissive,
      side: DoubleSide,
      roughness: 0.0,
      metalness: 1.3,
      reflectivity: 0.0,
      emissive: new Color("#578fd7"),
      emissiveIntensity: 5,
      transparent: false,
      blending: NormalBlending,
      envMap: envMaps.bg1,
      envMapIntensity: 1.0,
      iridescence: 0.0,
    })
  }, [textures, envMaps])
}

// Wings Material
export const useWingsMaterial = () => {
  const textures = useCastleTextures()
  const envMaps = useEnvironmentMaps()

  useMemo(() => {
    ;[textures.wingsColor, textures.wingsRoughness].forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (envMaps.bg1) {
      envMaps.bg1.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, envMaps])

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.wingsColor,
        roughnessMap: textures.wingsRoughness,
        roughness: 0.2,
        blending: NormalBlending,
        envMap: envMaps.bg1,
        envMapIntensity: 1,
        side: DoubleSide,
        transparent: false,
        alphaTest: 0.05,
      }),
    [textures, envMaps]
  )
}

// Logo Material
export const useLogoMaterial = () => {
  const envMaps = useEnvironmentMaps()

  useEffect(() => {
    if (envMaps.bg1) {
      envMaps.bg1.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [envMaps])

  return useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color("#FA3C81"),
        transparent: false,
        alphaTest: 0.05,
        side: DoubleSide,
        blending: NormalBlending,
        roughness: 0.3,
        metalness: 1.3,
        envMap: envMaps.bg1,
        envMapIntensity: 1.2,
      }),
    [envMaps]
  )
}

// Decor Material
export const useDecorMaterial = () => {
  const envMaps = useEnvironmentMaps()

  useEffect(() => {
    if (envMaps.studio) {
      envMaps.studio.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [envMaps])

  return useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color("#F9DD71"),
        transparent: false,
        alphaTest: 0.05,
        side: DoubleSide,
        blending: NormalBlending,
        roughness: 0,
        metalness: 1.3,
        envMap: envMaps.studio,
        envMapIntensity: 2.5,
      }),
    [envMaps]
  )
}

// Bow Material
export const useBowMaterial = () => {
  const envMaps = useEnvironmentMaps()

  useEffect(() => {
    if (envMaps.studio) {
      envMaps.studio.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [envMaps])

  return useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color("#F9DD71"),
        transparent: false,
        alphaTest: 0.05,
        side: DoubleSide,
        blending: NormalBlending,
        roughness: 0,
        metalness: 1.2,
        envMap: envMaps.studio,
        envMapIntensity: 1.8,
      }),
    [envMaps]
  )
}

// Mirror Material
export const useMirrorMaterial = () => {
  const envMaps = useEnvironmentMaps()

  useEffect(() => {
    if (envMaps.clouds) {
      envMaps.clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [envMaps])

  return useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color("#a6cce5"),
        transparent: false,
        alphaTest: 0.05,
        side: DoubleSide,
        blending: NormalBlending,
        roughness: 0,
        metalness: 1,
        envMap: envMaps.clouds,
        envMapIntensity: 2.0,
      }),
    [envMaps]
  )
}

// Hallos Material
export const useHallosMaterial = () => {
  const envMaps = useEnvironmentMaps()

  useEffect(() => {
    if (envMaps.studio) {
      envMaps.studio.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [envMaps])

  return useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#DABB46"),
        transparent: false,
        alphaTest: 0.05,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
        roughness: 0.2,
        metalness: 2,
        envMap: envMaps.studio,
        envMapIntensity: 2.5,
        reflectivity: 0,
        emissive: new THREE.Color("#DABB46").multiplyScalar(0.1),
        emissiveIntensity: 2,
      }),
    [envMaps]
  )
}

// Gods Material
export const useGodsMaterial = () => {
  const textures = useCastleTextures()

  useMemo(() => {
    if (textures.godsColorAO) {
      textures.godsColorAO.flipY = true
      textures.godsColorAO.minFilter = textures.godsColorAO.magFilter =
        NearestFilter
      textures.godsColorAO.colorSpace = "srgb"
    }
  }, [textures])

  return useMemo(
    () =>
      new MeshBasicMaterial({
        map: textures.godsColorAO,
        transparent: false,
        alphaTest: 0.5,
        side: DoubleSide,
        blending: NormalBlending,
      }),
    [textures]
  )
}

// Hoof Material
export const useHoofMaterial = () => {
  const textures = useCastleTextures()
  const envMaps = useEnvironmentMaps()

  useMemo(() => {
    ;[textures.hoofGlassColor, textures.hoofGlassEmissive].forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (envMaps.bg1) {
      envMaps.bg1.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, envMaps])

  return useMemo(
    () =>
      new MeshPhysicalMaterial({
        map: textures.hoofGlassColor,
        emissiveMap: textures.hoofGlassEmissive,
        emissive: new Color(0x578fd7),
        emissiveIntensity: 8,
        transparent: false,
        side: DoubleSide,
        blending: NormalBlending,
        roughness: 0.2,
        metalness: 1,
        envMap: envMaps.bg1,
        envMapIntensity: 1.0,
        reflectivity: 0.5,
      }),
    [textures, envMaps]
  )
}

// ATM Material
export const useAtmMaterial = () => {
  const textures = useCastleTextures()
  const envMaps = useEnvironmentMaps()

  useMemo(() => {
    ;[textures.atmBake, textures.atmMetallic, textures.atmEmissive].forEach(
      texture => {
        if (texture) {
          texture.flipY = true
          texture.minFilter = texture.magFilter = NearestFilter
        }
      }
    )

    if (envMaps.bg1) {
      envMaps.bg1.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, envMaps])

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.atmBake,
        metalnessMap: textures.atmMetallic,
        emissiveMap: textures.atmEmissive,
        transparent: false,
        side: DoubleSide,
        blending: NormalBlending,
        metalness: 1.5,
        roughness: 0.5,
        emissive: new Color(0xc4627d),
        emissiveIntensity: -0.5,
        envMap: envMaps.bg1,
        envMapIntensity: 0.8,
      }),
    [textures, envMaps]
  )
}

// ATM Metal Material
export const useAtmMetalMaterial = () => {
  const textures = useCastleTextures()
  const envMaps = useEnvironmentMaps()

  useMemo(() => {
    ;[textures.atmBake, textures.atmEmissive].forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (envMaps.bg1) {
      envMaps.bg1.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, envMaps])

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.atmBake,
        emissiveMap: textures.atmEmissive,
        transparent: false,
        alphaTest: 0.05,
        side: DoubleSide,
        blending: NormalBlending,
        metalness: 1.3,
        roughness: 0.05,
        emissive: new Color(0xc4627d),
        emissiveIntensity: 7.5,
        envMap: envMaps.bg1,
        envMapIntensity: 1.5,
      }),
    [textures, envMaps]
  )
}

// Scroll Material
export const useScrollMaterial = () => {
  const textures = useCastleTextures()
  const envMaps = useEnvironmentMaps()
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (envMaps.bg1) {
      envMaps.bg1.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [envMaps])

  useEffect(() => {
    if (!textures.scrollColor || textures.scrollColor.image === undefined) {
      setHasError(true)
    }
  }, [textures])

  if (hasError) {
    return useMemo(
      () =>
        new MeshStandardMaterial({
          color: "#f0e6d2",
          roughness: 0.7,
          metalness: 0.0,
          side: DoubleSide,
          envMap: envMaps.bg1,
          envMapIntensity: 0.3,
        }),
      [envMaps]
    )
  }

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.scrollColor,
        roughness: 0.7,
        metalness: 0,
        side: DoubleSide,
        envMap: envMaps.bg1,
        envMapIntensity: 0.8,
      }),
    [textures, envMaps]
  )
}
