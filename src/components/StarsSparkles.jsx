// Fix for StarsSparkles.jsx
import React, { useRef, useMemo, useEffect, useState } from "react" // Added useState to the imports
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"

/**
 * Creates a fallback particle texture if the provided texture is not available
 * @returns {THREE.Texture} Generated texture
 */
const createFallbackTexture = () => {
  const size = 64
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")

  // Create a radial gradient for a soft particle effect
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  )

  gradient.addColorStop(0, "rgba(255, 255, 255, 1)")
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.5)")
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)")

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/**
 * StarsSparkles component that renders efficient particle systems with different settings for mobile
 *
 * @param {Object} props
 * @param {number} props.count - Number of particles
 * @param {number|number[]} props.size - Size of particles or array of sizes
 * @param {number} props.speed - Animation speed
 * @param {string} props.color - Particle color
 * @param {number} props.opacity - Overall opacity
 * @param {Array} props.scale - Scale of the entire particle system
 * @param {Array} props.position - Position of the particle system
 * @param {boolean} props.castShadow - Whether particles cast shadows
 * @param {boolean} props.receiveShadow - Whether particles receive shadows
 * @param {string} props.texture - Optional custom texture path
 */
const StarsSparkles = ({
  count = 100,
  size = 4,
  speed = 0.01,
  color = "#ffffff",
  opacity = 0.5,
  scale = [1, 1, 1],
  position = [0, 0, 0],
  castShadow = false,
  receiveShadow = false,
  texture = null,
}) => {
  const bufferRef = useRef()

  // Try to load texture, with error handling
  const [particleTexture, setParticleTexture] = useState(null)

  useEffect(() => {
    const loadTexture = async () => {
      try {
        if (texture) {
          // Try to load the provided texture
          const textureLoader = new THREE.TextureLoader()
          const loadedTexture = await new Promise((resolve, reject) => {
            textureLoader.load(
              texture,
              resolve,
              undefined, // onProgress
              reject
            )
          })
          setParticleTexture(loadedTexture)
        } else {
          // No texture provided, create fallback
          setParticleTexture(createFallbackTexture())
        }
      } catch (error) {
        console.warn(`Failed to load particle texture: ${error.message}`)
        // Create fallback texture on error
        setParticleTexture(createFallbackTexture())
      }
    }

    loadTexture()
  }, [texture])

  // Detect if device is mobile
  const isMobile = useMemo(() => {
    if (typeof navigator === "undefined") return false
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    return (
      mobileRegex.test(userAgent) ||
      (typeof window !== "undefined" && window.innerWidth < 768)
    )
  }, [])

  // Adjust parameters for mobile
  const adjustedCount = isMobile ? Math.floor(count * 0.5) : count
  const adjustedSize = isMobile
    ? Array.isArray(size)
      ? size.map(s => s * 0.8)
      : size * 0.8
    : size

  // Create particles
  const particles = useMemo(() => {
    const temp = []
    const sizes = []

    // Generate random particles
    for (let i = 0; i < adjustedCount; i++) {
      // Calculate a random position within a spherical volume
      const x = (Math.random() - 0.5) * 2
      const y = (Math.random() - 0.5) * 2
      const z = (Math.random() - 0.5) * 2

      // Push position coordinates
      temp.push(x, y, z)

      // Handle size (either single value or array of random sizes)
      if (Array.isArray(adjustedSize)) {
        const randomSize =
          adjustedSize[Math.floor(Math.random() * adjustedSize.length)]
        sizes.push(randomSize)
      } else {
        sizes.push(adjustedSize)
      }
    }

    return { positions: new Float32Array(temp), sizes: new Float32Array(sizes) }
  }, [adjustedCount, adjustedSize])

  // Animation
  useFrame(state => {
    if (!bufferRef.current) return

    const time = state.clock.getElapsedTime()
    const positionArray = bufferRef.current.geometry.attributes.position.array

    // Animate particles
    for (let i = 0; i < adjustedCount; i++) {
      const i3 = i * 3

      // Apply subtle sine wave movement
      positionArray[i3 + 1] += Math.sin((time + i) * speed) * 0.005

      // Optional: add more complex animations based on device capability
      if (!isMobile) {
        positionArray[i3] += Math.cos((time + i) * speed * 0.8) * 0.003
        positionArray[i3 + 2] +=
          Math.sin((time + i * 1.5) * speed * 0.5) * 0.004
      }
    }

    bufferRef.current.geometry.attributes.position.needsUpdate = true
  })

  // Apply optimizations based on device capabilities
  useEffect(() => {
    if (bufferRef.current) {
      // Optimize for mobile
      if (isMobile) {
        bufferRef.current.material.depthWrite = false
        bufferRef.current.material.sizeAttenuation = false
      }
    }
  }, [isMobile])

  // Don't render until texture is ready
  if (!particleTexture) return null

  return (
    <points
      ref={bufferRef}
      position={position}
      scale={scale}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particles.sizes.length}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1}
        sizeAttenuation={true}
        map={particleTexture}
        alphaTest={0.01}
        transparent={true}
        opacity={opacity}
        color={color}
        toneMapped={false}
        vertexColors={false}
        depthWrite={true}
      />
    </points>
  )
}

export default StarsSparkles
