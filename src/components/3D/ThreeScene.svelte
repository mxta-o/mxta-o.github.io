<script lang="ts">
  import { Canvas } from '@threlte/core';
  import Scene from './Scene.svelte';
  
  export let type: 'sphere' | 'cube' | 'plane' = 'sphere';
  export let color: string = '#0ea5e9';
  export let animate: boolean = true;
</script>

<div class="w-full h-full">
  <Canvas>
    <Scene {type} {color} {animate} />
  </Canvas>
</div>
