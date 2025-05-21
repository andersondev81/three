import React, { useMemo, useRef, useEffect } from "react"
import { Cloud } from "@react-three/drei"
import PropTypes from "prop-types"
import * as THREE from "three"

const DEFAULT_PROPS = {
  position: [0, 0, 0],
  scale: [0.2, 0.2, 0.2],
  opacity: 0.6,
  speed: 0,
  width: 1,
  depth: 1,
  segments: 15,
  color: "#ffffff",
  fade: 15,
  concentration: 0.2,
  windDirection: 0,
  castShadow: false,
  randomness: 0.2,
  sizeAttenuation: true,
  fixedSeed: 5,
  layers: 2,
  density: 0.6,
  bounds: [7, 1, 1],
  cloudLightIntensity: 0.0,
}

const CloudSimple = React.memo(
  ({
    position = DEFAULT_PROPS.position,
    scale = DEFAULT_PROPS.scale,
    opacity = DEFAULT_PROPS.opacity,
    speed = DEFAULT_PROPS.speed,
    width = DEFAULT_PROPS.width,
    depth = DEFAULT_PROPS.depth,
    height,
    segments = DEFAULT_PROPS.segments,
    color = DEFAULT_PROPS.color,
    fade = DEFAULT_PROPS.fade,
    concentration = DEFAULT_PROPS.concentration,
    windDirection = DEFAULT_PROPS.windDirection,
    castShadow = DEFAULT_PROPS.castShadow,
    randomness = DEFAULT_PROPS.randomness,
    sizeAttenuation = DEFAULT_PROPS.sizeAttenuation,
    fixedSeed = DEFAULT_PROPS.fixedSeed,
    layers = DEFAULT_PROPS.layers,
    density = DEFAULT_PROPS.density,
    bounds = DEFAULT_PROPS.bounds,
    cloudLightIntensity = DEFAULT_PROPS.cloudLightIntensity,
    ...rest
  }) => {
    const cloudRef = useRef()
    const groupRef = useRef()
    const calculatedHeight = useMemo(
      () => height ?? width * 0.5,
      [height, width]
    )

    const normalizedScale = useMemo(() => {
      const baseScale = Array.isArray(scale)
        ? [...scale]
        : [scale, scale, scale]
      return [
        baseScale[0] * concentration * density,
        baseScale[1] * density,
        baseScale[2] * concentration * density,
      ]
    }, [scale, concentration, density])

    const cloudMaterial = useMemo(() => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: Math.min(opacity, 0.8),
        roughness: 0.2,
        metalness: 0,
        side: THREE.DoubleSide,
      })
    }, [color, opacity])

    useEffect(() => {
      if (cloudRef.current) {
        cloudRef.current.rotation.y = windDirection
        cloudRef.current.rotation.x = (position[0] * 0.02) % Math.PI
        cloudRef.current.rotation.z = (position[2] * 0.02) % Math.PI
      }
    }, [windDirection, position])

    const renderCloudLayers = useMemo(() => {
      return Array.from({ length: layers }).map((_, i) => {
        const layerScale = 1 + i * 0.15
        const layerOpacity = opacity * (1 - i * 0.15)
        const layerPosition = [
          position[0] + (Math.random() - 0.5) * randomness * 2,
          position[1] + (Math.random() - 0.5) * randomness,
          position[2] + (Math.random() - 0.5) * randomness * 2,
        ]

        return (
          <Cloud
            key={`cloud-layer-${i}`}
            ref={i === 0 ? cloudRef : null}
            seed={fixedSeed + i}
            opacity={layerOpacity}
            speed={speed * (0.8 + Math.random() * 0.4)}
            width={width * layerScale}
            depth={depth * layerScale}
            height={calculatedHeight * layerScale}
            segments={segments}
            color={color}
            fade={fade}
            castShadow={i === 0 && castShadow}
            material={cloudMaterial}
            position={layerPosition}
            bounds={bounds}
          />
        )
      })
    }, [
      layers,
      opacity,
      speed,
      width,
      depth,
      calculatedHeight,
      segments,
      color,
      fade,
      castShadow,
      cloudMaterial,
      fixedSeed,
      randomness,
      position,
    ])

    return (
      <group
        ref={groupRef}
        position={position}
        scale={normalizedScale}
        {...rest}
      >
        {renderCloudLayers}
      </group>
    )
  }
)

CloudSimple.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number),
  scale: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.number),
  ]),
  opacity: PropTypes.number,
  speed: PropTypes.number,
  width: PropTypes.number,
  depth: PropTypes.number,
  height: PropTypes.number,
  segments: PropTypes.number,
  color: PropTypes.string,
  fade: PropTypes.number,
  concentration: PropTypes.number,
  windDirection: PropTypes.number,
  castShadow: PropTypes.bool,
  randomness: PropTypes.number,
  sizeAttenuation: PropTypes.bool,
  fixedSeed: PropTypes.number,
  layers: PropTypes.number,
  density: PropTypes.number,
  bounds: PropTypes.arrayOf(PropTypes.number),
  cloudLightIntensity: PropTypes.number,
}

CloudSimple.displayName = "CloudSimple"
export default CloudSimple
