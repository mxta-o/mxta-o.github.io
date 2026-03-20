<script lang="ts">
  import { onMount } from 'svelte';
  import { AudioManager } from '../../lib/audio';
  let ambienceVol = 0.6;
  let sfxVol = 1;
  let muted = false;

  onMount(() => {
    // reflect defaults
    ambienceVol = 0.6;
    sfxVol = 1;
  });

  const toggle = () => {
    AudioManager.toggleMute();
    muted = !muted;
  };

  const setAmbience = (v: number) => {
    AudioManager.setAmbienceVolume(v);
    ambienceVol = v;
  };

  const setSfx = (v: number) => {
    AudioManager.setSfxVolume(v);
    sfxVol = v;
  };

  const handleAmbienceInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement | null;
    if (!target) return;
    setAmbience(Number(target.value));
  };

  const handleSfxInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement | null;
    if (!target) return;
    setSfx(Number(target.value));
  };

  const playAmbience = () => AudioManager.playAmbience();
  const stopAmbience = () => AudioManager.stopAmbience();
</script>

<div class="audio-controls">
  <button type="button" on:click={toggle}>{muted ? 'Unmute' : 'Mute'}</button>
  <div class="row">
    <label>Ambience</label>
    <input type="range" min="0" max="1" step="0.01" bind:value={ambienceVol} on:input={handleAmbienceInput} />
    <button type="button" on:click={playAmbience}>Play</button>
    <button type="button" on:click={stopAmbience}>Stop</button>
  </div>
  <div class="row">
    <label>SFX</label>
    <input type="range" min="0" max="1" step="0.01" bind:value={sfxVol} on:input={handleSfxInput} />
  </div>
</div>

<style>
  .audio-controls {
    display: inline-grid;
    gap: 0.5rem;
    align-items: center;
    font-family: 'Space Grotesk', sans-serif;
    color: rgba(232,240,255,0.95);
  }
  .row { display: flex; gap: 0.5rem; align-items: center; }
  input[type='range'] { width: 9rem; }
</style>
