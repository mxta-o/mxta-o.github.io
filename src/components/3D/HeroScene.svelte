<script lang="ts">
  import { T } from '@threlte/core';
  import { Grid } from '@threlte/extras';
  import { spring } from 'svelte/motion';
  import * as THREE from 'three';
  
  let cubeRotation = spring({ x: 0, y: 0 }, { stiffness: 0.05, damping: 0.3 });
  let sphereRotation = spring({ x: 0, y: 0 }, { stiffness: 0.05, damping: 0.3 });
  let squareRotation = spring({ x: 0, y: 0 }, { stiffness: 0.05, damping: 0.3 });
  
  let cubeScale = spring(1, { stiffness: 0.1, damping: 0.3 });
  let sphereScale = spring(1, { stiffness: 0.1, damping: 0.3 });
  let squareScale = spring(1, { stiffness: 0.1, damping: 0.3 });
  
  let cubeHovered = false;
  let sphereHovered = false;
  let squareHovered = false;
  
  $: if (cubeHovered) cubeScale.set(1.15); else cubeScale.set(1);
  $: if (sphereHovered) sphereScale.set(1.15); else sphereScale.set(1);
  $: if (squareHovered) squareScale.set(1.15); else squareScale.set(1);
  
  // Auto-rotate
  let time = 0;
  const interval = setInterval(() => {
    time += 0.005;
    cubeRotation.set({ x: Math.sin(time * 1.2) * 0.3, y: time * 0.8 });
    sphereRotation.set({ x: Math.cos(time) * 0.2, y: time * 0.6 });
    squareRotation.set({ x: time * 0.5, y: Math.sin(time * 0.8) * 0.3 });
  }, 16);
</script>

<T.PerspectiveCamera makeDefault position={[0, 2, 8]} fov={45} />

<T.DirectionalLight position={[5, 5, 5]} intensity={0.8} color="#7dd3fc" />
<T.DirectionalLight position={[-5, 3, -5]} intensity={0.4} color="#0ea5e9" />
<T.AmbientLight intensity={0.3} />

<!-- Grid Floor -->
<Grid
  position.y={-2}
  cellColor="#0ea5e9"
  sectionColor="#38bdf8"
  cellThickness={0.6}
  sectionThickness={1.2}
  fadeDistance={30}
  infiniteGrid={true}
  cellSize={0.5}
/>

<!-- Left Cube (wireframe) -->
<T.Mesh
  position={[-4, 0, -2]}
  rotation.x={$cubeRotation.x}
  rotation.y={$cubeRotation.y}
  scale={$cubeScale}
  on:pointerenter={() => cubeHovered = true}
  on:pointerleave={() => cubeHovered = false}
>
  <T.BoxGeometry args={[2, 2, 2]} />
  <T.MeshStandardMaterial
    color="#0ea5e9"
    wireframe={true}
    emissive="#0ea5e9"
    emissiveIntensity={0.3}
  />
</T.Mesh>

<!-- Right Sphere (wireframe) -->
<T.Mesh
  position={[4.5, 1, -1]}
  rotation.x={$sphereRotation.x}
  rotation.y={$sphereRotation.y}
  scale={$sphereScale}
  on:pointerenter={() => sphereHovered = true}
  on:pointerleave={() => sphereHovered = false}
>
  <T.SphereGeometry args={[1.2, 32, 32]} />
  <T.MeshStandardMaterial
    color="#7dd3fc"
    wireframe={true}
    emissive="#7dd3fc"
    emissiveIntensity={0.3}
  />
</T.Mesh>

<!-- Right Bottom Square (wireframe) -->
<T.Mesh
  position={[3.5, -0.8, 1]}
  rotation.x={$squareRotation.x}
  rotation.y={$squareRotation.y}
  scale={$squareScale}
  on:pointerenter={() => squareHovered = true}
  on:pointerleave={() => squareHovered = false}
>
  <T.BoxGeometry args={[1.5, 1.5, 1.5]} />
  <T.MeshStandardMaterial
    color="#0ea5e9"
    wireframe={true}
    emissive="#0ea5e9"
    emissiveIntensity={0.3}
  />
</T.Mesh>

<!-- Additional floating elements for depth -->
<T.Mesh position={[-2, 2, -5]} rotation.z={0.5}>
  <T.TorusGeometry args={[0.8, 0.2, 16, 32]} />
  <T.MeshStandardMaterial
    color="#38bdf8"
    wireframe={true}
    emissive="#38bdf8"
    emissiveIntensity={0.2}
  />
</T.Mesh>
