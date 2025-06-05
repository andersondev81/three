import { useTexture } from "@react-three/drei"
import React, { useMemo, useEffect, useState } from "react"
import * as THREE from "three"
import {
  Color,
  DoubleSide,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NearestFilter,
  NormalBlending,
} from "three"
import {
  useSharedEnvironmentMaps,
  useBg1Environment,
  useStudioEnvironment,
  useCloudsEnvironment,
} from "./useSharedEnvironmentMaps"

const useCastleTextures = () => {
  return useTexture({
    castleColor: "/texture/castleColor.avif",
    castleRoughness: "/texture/castleRoughnessV1.avif",
    castleMetallic: "/texture/castleMetallicV1.avif",
    castleHeartColor: "/texture/castleHeart_Base_colorAO.avif",
    castleLightsEmissive: "/texture/castleLights_Emissive.avif",
    godsWallColor: "/texture/GodsWallColor.avif",
    godsWallRoughness: "/texture/castleGodsWall_Roughness.avif",
    wallsColor: "/texture/WallsColor.avif",
    floorRoughness: "/texture/floor_Roughness.avif",
    pilarsColor: "/texture/PilarsColor.avif",
    pilarsRoughness: "/texture/castlePilars_Roughness.avif",
    pilarsMetallic: "/texture/castlePilars_Metallic.avif",
    pilarsEmissive: "/texture/castlePilars_Emissive.avif",
    floorAO: "/texture/floorAO.avif",
    floorHeartMetallic: "/texture/floorHeart_Metallic.avif",
    floorHeartColor: "/texture/floorHeartColor.avif",
    floorHeartRoughness: "/texture/floorHeart_Roughness.avif",
    floorHeartEmissive: "/texture/floorHeart_Emissive.avif",
    wingsColor: "/texture/wingsColor_.avif",
    wingsRoughness: "/texture/wingsRoughness.avif",
    godsColorAO: "/texture/godsColorAO.avif",
    hoofGlassColor: "/texture/hoofGlassColorBAO.avif",
    hoofGlassEmissive: "/texture/hoofGlassEmissiveV2.avif",
    atmBake: "/texture/atmBake1.avif",
    atmMetallic: "/texture/atmMetallicV1.avif",
    atmEmissive: "/texture/atmEmissive.avif",
    scrollColor: "/texture/ScrollColorV1.avif",
  })
}

const configureTextures = (textures, flipY = true) => {
  Object.values(textures).forEach(texture => {
    if (texture) {
      texture.flipY = flipY
      texture.minFilter = texture.magFilter = NearestFilter
    }
  })
}

export const useCastleMaterial = () => {
  const textures = useCastleTextures()
  const bg1Env = useBg1Environment()

  useMemo(() => {
    configureTextures({
      castleColor: textures.castleColor,
      castleRoughness: textures.castleRoughness,
      castleMetallic: textures.castleMetallic,
    })
  }, [textures])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.castleColor,
      roughnessMap: textures.castleRoughness,
      metalnessMap: textures.castleMetallic,
      roughness: 0.2,
      metalness: 0,
      blending: NormalBlending,
      envMap: bg1Env,
      envMapIntensity: 1,
      side: DoubleSide,
      transparent: false,
    })
  }, [textures, bg1Env])
}

export const useCastleHeartMaterial = (
  metalness = 1.1,
  roughness = 0,
  emissiveIntensity = 0.3,
  emissiveColor = "#ff0000"
) => {
  const textures = useCastleTextures()
  const bg1Env = useBg1Environment()

  useMemo(() => {
    configureTextures({ castleHeartColor: textures.castleHeartColor })
  }, [textures])

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
      envMap: bg1Env,
    })
  }, [textures, metalness, roughness, emissiveIntensity, emissiveColor, bg1Env])
}

export const useCastleHeartMaskMaterial = () => {
  const studioEnv = useStudioEnvironment()

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
        envMap: studioEnv,
        envMapIntensity: 1.5,
        emissive: new Color("#F0D060"),
        emissiveIntensity: 0.3,
      }),
    [studioEnv]
  )
}

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

export const usecastleGodsWallsMaterial = (
  materialType = "standard",
  metalness = 0.6,
  roughness = 1.6
) => {
  const textures = useCastleTextures()
  const bg1Env = useBg1Environment()

  useMemo(() => {
    configureTextures({
      godsWallColor: textures.godsWallColor,
      godsWallRoughness: textures.godsWallRoughness,
    })
  }, [textures])

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
      envMap: bg1Env,
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
  }, [textures, materialType, metalness, roughness, bg1Env])
}

export const useCastleWallsMaterial = () => {
  const textures = useCastleTextures()
  const bg1Env = useBg1Environment()

  useMemo(() => {
    configureTextures({
      wallsColor: textures.wallsColor,
      floorRoughness: textures.floorRoughness,
    })
  }, [textures])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.wallsColor,
      roughnessMap: textures.floorRoughness,
      roughness: 0.2,
      blending: NormalBlending,
      envMap: bg1Env,
      envMapIntensity: 1,
      side: DoubleSide,
      transparent: false,
      alphaTest: 0.05,
    })
  }, [textures, bg1Env])
}

export const useCastlePilarsMaterial = () => {
  const textures = useCastleTextures()
  const bg1Env = useBg1Environment()

  useMemo(() => {
    configureTextures({
      pilarsColor: textures.pilarsColor,
      pilarsRoughness: textures.pilarsRoughness,
      pilarsMetallic: textures.pilarsMetallic,
      pilarsEmissive: textures.pilarsEmissive,
    })
  }, [textures])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.pilarsColor,
      roughnessMap: textures.pilarsRoughness,
      metalnessMap: textures.pilarsMetallic,
      emissiveMap: textures.pilarsEmissive,
      emissive: new Color(0xe8b84e),
      emissiveIntensity: 2.5,
      roughness: 1,
      metalness: 0,
      blending: NormalBlending,
      envMap: bg1Env,
      envMapIntensity: 1.0,
      side: DoubleSide,
      transparent: false,
      alphaTest: 0.05,
    })
  }, [textures, bg1Env])
}

export const useFloorMaterial = () => {
  const textures = useCastleTextures()
  const bg1Env = useBg1Environment()

  useMemo(() => {
    configureTextures({
      floorAO: textures.floorAO,
      floorRoughness: textures.floorRoughness,
      floorHeartMetallic: textures.floorHeartMetallic,
    })
  }, [textures])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.floorAO,
      roughnessMap: textures.floorRoughness,
      metalnessMap: textures.floorHeartMetallic,
      roughness: 0.2,
      metalness: 1.3,
      blending: NormalBlending,
      envMap: bg1Env,
      envMapIntensity: 1,
      side: DoubleSide,
      transparent: false,
      alphaTest: 0.05,
    })
  }, [textures, bg1Env])
}

export const useMirrorFrameMaterial = () => {
  const studioEnv = useStudioEnvironment()

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
        envMap: studioEnv,
        envMapIntensity: 2.2,
        emissive: new THREE.Color("#F0D060"),
        emissiveIntensity: 0.1,
      }),
    [studioEnv]
  )
}

export const useFloorHeartMaterial = () => {
  const textures = useCastleTextures()
  const bg1Env = useBg1Environment()

  useMemo(() => {
    configureTextures({
      floorHeartColor: textures.floorHeartColor,
      floorHeartRoughness: textures.floorHeartRoughness,
      floorHeartMetallic: textures.floorHeartMetallic,
      floorHeartEmissive: textures.floorHeartEmissive,
    })
  }, [textures])

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
      envMap: bg1Env,
      envMapIntensity: 1.0,
      iridescence: 0.0,
    })
  }, [textures, bg1Env])
}

export const useWingsMaterial = () => {
  const textures = useCastleTextures()
  const bg1Env = useBg1Environment()

  useMemo(() => {
    configureTextures({
      wingsColor: textures.wingsColor,
      wingsRoughness: textures.wingsRoughness,
    })
  }, [textures])

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.wingsColor,
        roughnessMap: textures.wingsRoughness,
        roughness: 0.2,
        blending: NormalBlending,
        envMap: bg1Env,
        envMapIntensity: 1,
        side: DoubleSide,
        transparent: false,
        alphaTest: 0.05,
      }),
    [textures, bg1Env]
  )
}

export const useLogoMaterial = () => {
  const bg1Env = useBg1Environment()

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
        envMap: bg1Env,
        envMapIntensity: 1.2,
      }),
    [bg1Env]
  )
}

export const useDecorMaterial = () => {
  const studioEnv = useStudioEnvironment()

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
        envMap: studioEnv,
        envMapIntensity: 2.5,
      }),
    [studioEnv]
  )
}

export const useBowMaterial = () => {
  const studioEnv = useStudioEnvironment()

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
        envMap: studioEnv,
        envMapIntensity: 1.8,
      }),
    [studioEnv]
  )
}

export const useMirrorMaterial = () => {
  const cloudsEnv = useCloudsEnvironment()

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
        envMap: cloudsEnv,
        envMapIntensity: 2.0,
      }),
    [cloudsEnv]
  )
}

export const useHallosMaterial = () => {
  const studioEnv = useStudioEnvironment()

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
        envMap: studioEnv,
        envMapIntensity: 2.5,
        reflectivity: 0,
        emissive: new THREE.Color("#DABB46").multiplyScalar(0.1),
        emissiveIntensity: 2,
      }),
    [studioEnv]
  )
}

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

export const useHoofMaterial = () => {
  const textures = useCastleTextures()
  const bg1Env = useBg1Environment()

  useMemo(() => {
    configureTextures({
      hoofGlassColor: textures.hoofGlassColor,
      hoofGlassEmissive: textures.hoofGlassEmissive,
    })
  }, [textures])

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
        envMap: bg1Env,
        envMapIntensity: 1.0,
        reflectivity: 0.5,
      }),
    [textures, bg1Env]
  )
}

export const useAtmMaterial = () => {
  const textures = useCastleTextures()
  const bg1Env = useBg1Environment()

  useMemo(() => {
    configureTextures({
      atmBake: textures.atmBake,
      atmMetallic: textures.atmMetallic,
      atmEmissive: textures.atmEmissive,
    })
  }, [textures])

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
        envMap: bg1Env,
        envMapIntensity: 0.8,
      }),
    [textures, bg1Env]
  )
}

export const useAtmMetalMaterial = () => {
  const textures = useCastleTextures()
  const bg1Env = useBg1Environment()

  useMemo(() => {
    configureTextures({
      atmBake: textures.atmBake,
      atmEmissive: textures.atmEmissive,
    })
  }, [textures])

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
        envMap: bg1Env,
        envMapIntensity: 1.5,
      }),
    [textures, bg1Env]
  )
}

export const useScrollMaterial = () => {
  const textures = useCastleTextures()
  const bg1Env = useBg1Environment()
  const [hasError, setHasError] = useState(false)

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
          envMap: bg1Env,
          envMapIntensity: 0.3,
        }),
      [bg1Env]
    )
  }

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.scrollColor,
        roughness: 0.7,
        metalness: 0,
        side: DoubleSide,
        envMap: bg1Env,
        envMapIntensity: 0.8,
      }),
    [textures, bg1Env]
  )
}
