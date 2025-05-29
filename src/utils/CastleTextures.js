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

// Castle Main Material
export const useCastleMaterial = () => {
  const textures = useTexture({
    map: "/texture/castleColor.avif",
    roughnessMap: "/texture/castleRoughnessV1.avif",
    metalnessMap: "/texture/castleMetallicV1.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.map,
      roughnessMap: textures.roughnessMap,
      metalnessMap: textures.metalnessMap,
      roughness: 0.2,
      metalness: 0,
      blending: NormalBlending,
      envMap: clouds,
      envMapIntensity: 1,
      side: DoubleSide,
      transparent: false,
    })
  }, [textures, clouds])
}

// Heart Back Wall Material
export const useCastleHeartMaterial = (
  metalness = 1.1,
  roughness = 0,
  emissiveIntensity = 0.3,
  emissiveColor = "#ff0000"
) => {
  const textures = useTexture({
    map: "/texture/castleHeart_Base_colorAO.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.map,
      side: DoubleSide,
      transparent: false,
      alphaTest: 0.05,
      ...(textures.roughnessMap && { roughnessMap: textures.roughnessMap }),
      roughness: roughness,
      metalness: metalness,
      ...(textures.metalnessMap && { metalnessMap: textures.metalnessMap }),
      ...(textures.emissiveMap && { emissiveMap: textures.emissiveMap }),
      emissive: new Color(emissiveColor),
      emissiveIntensity: emissiveIntensity,
      blending: NormalBlending,
      envMap: clouds,
    })
  }, [textures, metalness, roughness, emissiveIntensity, emissiveColor, clouds])
}

// Castle Heart Mask Material
export const useCastleHeartMaskMaterial = () => {
  const clouds = useTexture("/images/studio.jpg")

  useEffect(() => {
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [clouds])

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
        envMap: clouds,
        envMapIntensity: 1.5,
        emissive: new Color("#F0D060"),
        emissiveIntensity: 0.3,
      }),
    [clouds]
  )
}

// Heart Lights Material
export const useCastleLightsMaterial = () => {
  const { emissiveMap } = useTexture({
    emissiveMap: "/texture/castleLights_Emissive.avif",
  })

  return useMemo(
    () =>
      new MeshStandardMaterial({
        emissive: new Color("#fff"),
        emissiveIntensity: 1,
        emissiveMap: emissiveMap,
        side: DoubleSide,
      }),
    [emissiveMap]
  )
}

// Gods Walls Material
export const usecastleGodsWallsMaterial = (
  materialType = "standard",
  metalness = 0.6,
  roughness = 1.6
) => {
  const textures = useTexture({
    map: "/texture/GodsWallColor.avif",
    roughnessMap: "/texture/castleGodsWall_Roughness.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(() => {
    const commonProps = {
      map: textures.map,
      side: DoubleSide,
      transparent: false,
    }

    const pbrProps = {
      ...commonProps,
      roughnessMap: textures.roughnessMap,
      roughness: roughness,
      metalness: metalness,
      blending: NormalBlending,
      envMap: clouds,
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
  }, [textures, materialType, metalness, roughness, clouds])
}

// Castle Walls Material
export const useCastleWallsMaterial = (metalness = 0, roughness = 1) => {
  const textures = useTexture({
    map: "/texture/WallsColor.avif",
    roughnessMap: "/texture/floor_Roughness.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.map,
      roughnessMap: textures.roughnessMap,
      roughness: 0.2,
      blending: NormalBlending,
      envMap: clouds,
      envMapIntensity: 1,
      side: DoubleSide,
      transparent: false,
      alphaTest: 0.05,
    })
  }, [textures, clouds])
}

// Castle Pilars Material
export const useCastlePilarsMaterial = (metalness = 0, roughness = 1) => {
  const textures = useTexture({
    map: "/texture/PilarsColor.avif",
    roughnessMap: "/texture/castlePilars_Roughness.avif",
    metalnessMap: "/texture/castlePilars_Metallic.avif",
    emissiveMap: "/texture/castlePilars_Emissive.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.map,
      roughnessMap: textures.roughnessMap,
      metalnessMap: textures.metalnessMap,
      emissiveMap: textures.emissiveMap,
      emissive: new Color(0xe8b84e),
      emissiveIntensity: 2.5,
      roughness: roughness,
      metalness: metalness,
      blending: NormalBlending,
      envMap: clouds,
      envMapIntensity: 1.0,
      side: DoubleSide,
      transparent: false,
      alphaTest: 0.05,
    })
  }, [textures, clouds])
}

// Floor Material
export const useFloorMaterial = (metalness = 0, roughness = 1) => {
  const textures = useTexture({
    map: "/texture/floorAO.avif",
    roughnessMap: "/texture/floor_Roughness.avif",
    metalnessMap: "/texture/floorHeart_Metallic.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(() => {
    return new MeshStandardMaterial({
      map: textures.map,
      ...(textures.roughnessMap && { roughnessMap: textures.roughnessMap }),
      ...(textures.metalnessMap && { metalnessMap: textures.metalnessMap }),
      roughness: 0.2,
      metalness: 1.3,
      blending: NormalBlending,
      envMap: clouds,
      envMapIntensity: 1,
      side: DoubleSide,
      transparent: false,
      alphaTest: 0.05,
    })
  }, [textures, clouds])
}

// Mirror Frame Material
export const useMirrorFrameMaterial = () => {
  const clouds = useTexture("/images/studio.jpg")

  useEffect(() => {
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [clouds])

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
        envMap: clouds,
        envMapIntensity: 2.2,
        emissive: new THREE.Color("#F0D060"),
        emissiveIntensity: 0.1,
      }),
    [clouds]
  )
}

// Floor Heart Material
export const useFloorHeartMaterial = () => {
  const textures = useTexture({
    map: "/texture/floorHeartColor.avif",
    roughnessMap: "/texture/floorHeart_Roughness.avif",
    metalnessMap: "/texture/floorHeart_Metallic.avif",
    emissiveMap: "/texture/floorHeart_Emissive.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(() => {
    return new MeshPhysicalMaterial({
      map: textures.map,
      roughnessMap: textures.roughnessMap,
      metalnessMap: textures.metalnessMap,
      emissiveMap: textures.emissiveMap,
      side: DoubleSide,
      roughness: 0.0,
      metalness: 1.3,
      reflectivity: 0.0,
      emissive: new Color("#578fd7"),
      emissiveIntensity: 5,
      transparent: false,
      blending: NormalBlending,
      envMap: clouds,
      envMapIntensity: 1.0,
      iridescence: 0.0,
    })
  }, [textures, clouds])
}

// Wings Material
export const useWingsMaterial = () => {
  const textures = useTexture({
    map: "/texture/wingsColor_.avif",
    roughnessMap: "/texture/wingsRoughness.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.map,
        roughnessMap: textures.roughnessMap,
        roughness: 0.2,
        blending: NormalBlending,
        envMap: clouds,
        envMapIntensity: 1,
        side: DoubleSide,
        transparent: false,
        alphaTest: 0.05,
      }),
    [textures, clouds]
  )
}

// Logo Material
export const useLogoMaterial = () => {
  const clouds = useTexture("/images/bg1.jpg")

  useEffect(() => {
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [clouds])

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
        envMap: clouds,
        envMapIntensity: 1.2,
      }),
    [clouds]
  )
}

// Decor Material
export const useDecorMaterial = () => {
  const clouds = useTexture("/images/studio.jpg")

  useEffect(() => {
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [clouds])

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
        envMap: clouds,
        envMapIntensity: 2.5,
      }),
    [clouds]
  )
}

// Bow Material
export const useBowMaterial = () => {
  const clouds = useTexture("/images/studio.jpg")

  useEffect(() => {
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [clouds])

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
        envMap: clouds,
        envMapIntensity: 1.8,
      }),
    [clouds]
  )
}

// Mirror Material
export const useMirrorMaterial = () => {
  const clouds = useTexture("/images/clouds.jpg")

  useEffect(() => {
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [clouds])

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
        envMap: clouds,
        envMapIntensity: 2.0,
      }),
    [clouds]
  )
}

// Hallos Material
export const useHallosMaterial = () => {
  const clouds = useTexture("/images/studio.jpg")

  useEffect(() => {
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [clouds])

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
        envMap: clouds,
        envMapIntensity: 2.5,
        reflectivity: 0,
        emissive: new THREE.Color("#DABB46").multiplyScalar(0.1),
        emissiveIntensity: 2,
      }),
    [clouds]
  )
}

// Gods Material
export const useGodsMaterial = () => {
  const textures = useTexture({
    map: "/texture/godsColorAO.avif",
  })

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
        texture.colorSpace = "srgb"
      }
    })
  }, [textures])

  return useMemo(
    () =>
      new MeshBasicMaterial({
        map: textures.map,
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
  const textures = useTexture({
    map: "/texture/hoofGlassColorBAO.avif",
    emissiveMap: "/texture/hoofGlassEmissiveV2.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(
    () =>
      new MeshPhysicalMaterial({
        map: textures.map,
        emissiveMap: textures.emissiveMap,
        emissive: new Color(0x578fd7),
        emissiveIntensity: 8,
        transparent: false,
        side: DoubleSide,
        blending: NormalBlending,
        roughness: 0.2,
        metalness: 1,
        envMap: clouds,
        envMapIntensity: 1.0,
        reflectivity: 0.5,
      }),
    [textures, clouds]
  )
}

// ATM Material
export const useAtmMaterial = () => {
  const textures = useTexture({
    map: "/texture/atmBake1.avif",
    metalnessMap: "/texture/atmMetallicV1.avif",
    materialEmissive: "/texture/atmEmissive.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.map,
        metalnessMap: textures.metalnessMap,
        emissiveMap: textures.materialEmissive,
        transparent: false,
        side: DoubleSide,
        blending: NormalBlending,
        metalness: 1.5,
        roughness: 0.5,
        emissive: new Color(0xc4627d),
        emissiveIntensity: -0.5,
        envMap: clouds,
        envMapIntensity: 0.8,
      }),
    [textures, clouds]
  )
}

// ATM Metal Material
export const useAtmMetalMaterial = () => {
  const textures = useTexture({
    map: "/texture/atmBake1.avif",
    materialEmissive: "/texture/atmEmissive.avif",
  })

  const clouds = useTexture("/images/bg1.jpg")

  useMemo(() => {
    Object.values(textures).forEach(texture => {
      if (texture) {
        texture.flipY = true
        texture.minFilter = texture.magFilter = NearestFilter
      }
    })

    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [textures, clouds])

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.map,
        emissiveMap: textures.materialEmissive,
        transparent: false,
        alphaTest: 0.05,
        side: DoubleSide,
        blending: NormalBlending,
        metalness: 1.3,
        roughness: 0.05,
        emissive: new Color(0xc4627d),
        emissiveIntensity: 7.5,
        envMap: clouds,
        envMapIntensity: 1.5,
      }),
    [textures, clouds]
  )
}

// Scroll Material
export const useScrollMaterial = () => {
  const [hasError, setHasError] = useState(false)

  const textures = useTexture(
    hasError
      ? {}
      : {
          map: "/texture/ScrollColorV1.avif",
        }
  )

  const clouds = useTexture("/images/bg1.jpg")

  useEffect(() => {
    if (clouds) {
      clouds.mapping = THREE.EquirectangularReflectionMapping
    }
  }, [clouds])

  useEffect(() => {
    if (!textures.map || textures.map.image === undefined) {
      setHasError(true)
    }
  }, [textures.map])

  if (hasError) {
    return useMemo(
      () =>
        new MeshStandardMaterial({
          color: "#f0e6d2",
          roughness: 0.7,
          metalness: 0.0,
          side: DoubleSide,
          envMap: clouds,
          envMapIntensity: 0.3,
        }),
      [clouds]
    )
  }

  return useMemo(
    () =>
      new MeshStandardMaterial({
        map: textures.map,
        roughness: 0.7,
        metalness: 0,
        side: DoubleSide,
        envMap: clouds,
        envMapIntensity: 0.8,
      }),
    [textures, clouds]
  )
}
