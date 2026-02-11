<script lang="ts">
  import { T } from '@threlte/core';
  import { OrbitControls, Grid } from '@threlte/extras';
  import { spring } from 'svelte/motion';
  import * as THREE from 'three';
  
  export let type: 'sphere' | 'cube' | 'plane' = 'sphere';
  export let color: string = '#0ea5e9';
  export let animate: boolean = true;
  
  let rotation = spring({ x: 0, y: 0 }, { stiffness: 0.05, damping: 0.3 });
  let scale = spring(1, { stiffness: 0.1, damping: 0.3 });
  
  let hovered = false;
  
  $: if (hovered) {
    scale.set(1.2);
  } else {
    scale.set(1);
  }
  
  // Auto-rotate
  let time = 0;
  if (animate) {
    const interval = setInterval(() => {
      time += 0.01;
      rotation.set({ x: Math.sin(time) * 0.2, y: time });
    }, 16);
  }
  
  const handlePointerEnter = () => {
    hovered = true;
  };
  
  const handlePointerLeave = () => {
    hovered = false;
  };
</script>

<T.PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50}>
  <OrbitControls enableZoom={false} enablePan={false} />
</T.PerspectiveCamera>

<T.DirectionalLight position={[10, 10, 5]} intensity={1.5} />
<T.AmbientLight intensity={0.5} />

{#if type === 'sphere'}
  <T.Mesh
    position={[0, 0, 0]}
    rotation.x={$rotation.x}
    rotation.y={$rotation.y}
    scale={$scale}
    on:pointerenter={handlePointerEnter}
    on:pointerleave={handlePointerLeave}
  >
    <T.SphereGeometry args={[1, 64, 64]} />
    <T.MeshStandardMaterial
      color={color}
      roughness={0.2}
      metalness={0.8}
    />
  </T.Mesh>
{:else if type === 'cube'}
  <T.Mesh
    position={[0, 0, 0]}
    rotation.x={$rotation.x}
    rotation.y={$rotation.y}
    scale={$scale}
    on:pointerenter={handlePointerEnter}
    on:pointerleave={handlePointerLeave}
  >
    <T.BoxGeometry args={[1.5, 1.5, 1.5]} />
    <T.MeshStandardMaterial
      color={color}
      roughness={0.2}
      metalness={0.8}
    />
  </T.Mesh>
{:else if type === 'plane'}
  <Grid
    position.y={-0.5}
    cellColor="#0ea5e9"
    sectionColor="#0284c7"
    cellThickness={0.5}
    sectionThickness={1}
    fadeDistance={25}
    infiniteGrid={true}
  />
{/if}
