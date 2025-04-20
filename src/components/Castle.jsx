import React from "react"
import { useGLTF } from "@react-three/drei"

export function Castle(props) {
  // Renomeado de "Model" para "Castle"
  const { nodes, materials } = useGLTF("/models/Castle.glb")
  return (
    <group {...props} dispose={null}>
      <mesh
        geometry={nodes.HeartVid.geometry}
        material={nodes.HeartVid.material}
      />
      <mesh geometry={nodes.water.geometry} material={nodes.water.material} />
      <mesh geometry={nodes.stairs.geometry} material={nodes.stairs.material} />
      <mesh geometry={nodes.gods.geometry} material={nodes.gods.material} />
      <mesh
        geometry={nodes.LogoCupid.geometry}
        material={nodes.LogoCupid.material}
        position={[0.001, 4.18, -0.006]}
      />
      <mesh
        geometry={nodes.bow.geometry}
        material={nodes.bow.material}
        position={[-0.011, 1.262, -2.117]}
      />
      <mesh
        geometry={nodes.MirrorFrame.geometry}
        material={nodes.MirrorFrame.material}
      />
      <mesh geometry={nodes.wings.geometry} material={nodes.wings.material} />
      <mesh
        geometry={nodes.hoofGlass.geometry}
        material={nodes.hoofGlass.material}
      />
      <mesh geometry={nodes.Mirror.geometry} material={nodes.Mirror.material} />
      <mesh geometry={nodes.scroll.geometry} material={nodes.scroll.material} />
      <mesh geometry={nodes.Hallos.geometry} material={nodes.Hallos.material} />
      <mesh geometry={nodes.atm.geometry} material={nodes.atm.material} />
      <mesh geometry={nodes.floor.geometry} material={nodes.floor.material} />
      <mesh geometry={nodes.castle.geometry} material={nodes.castle.material} />
      <mesh
        geometry={nodes.castleHeart.geometry}
        material={nodes.castleHeart.material}
      />
      <mesh
        geometry={nodes.floorHeart.geometry}
        material={nodes.floorHeart.material}
      />
      <mesh
        geometry={nodes.castleLights.geometry}
        material={nodes.castleLights.material}
      />
      <mesh
        geometry={nodes.castleHeartMask.geometry}
        material={nodes.castleHeartMask.material}
      />
      <mesh geometry={nodes.decor.geometry} material={nodes.decor.material} />
      <mesh
        geometry={nodes.castleGodsWalls.geometry}
        material={nodes.castleGodsWalls.material}
      />
      <mesh
        geometry={nodes.castleWalls.geometry}
        material={nodes.castleWalls.material}
      />
      <mesh
        geometry={nodes.castlePilars.geometry}
        material={nodes.castlePilars.material}
      />
      <mesh
        geometry={nodes.atmMetal.geometry}
        material={nodes.atmMetal.material}
      />
    </group>
  )
}

useGLTF.preload("/models/Castle.glb")
