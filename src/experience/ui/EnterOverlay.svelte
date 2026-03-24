<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { AudioManager } from '../../lib/audio';

  const dispatch = createEventDispatcher();
  let visible = false;

  function enableAndClose() {
    try {
      AudioManager.enableOnUserGesture();
    } catch (e) {}
    visible = false;
  }

  function onOutroEnd() {
    if (typeof window !== 'undefined') {
      (window as any).__siteEntered = true;
      window.dispatchEvent(new CustomEvent('site:entered'));
    }
    dispatch('entered');
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') visible = false;
  }

  onMount(() => {
    // If the site was already entered earlier, don't show the overlay
    if (typeof window !== 'undefined' && (window as any).__siteEntered) {
      visible = false;
      return () => {};
    }

    // Trigger fade-in by enabling visibility after mount
    visible = true;
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    background: rgba(2, 6, 23, 0.65);
    transition: opacity 180ms ease;
  }

  .text {
    color: #ffffff;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.25rem;
    letter-spacing: 0.05em;
    opacity: 0.95;
    user-select: none;
  }

  @media (min-width: 768px) {
    .text { font-size: 1.5rem; }
  }

</style>

{#if visible}
  <button
    class="overlay"
    type="button"
    in:fade={{ duration: 280 }}
    out:fade={{ duration: 220 }}
    on:click={enableAndClose}
    on:outroend={onOutroEnd}
    aria-label="Enter site"
  >
    <div class="text">click to enter</div>
  </button>
{/if}
