<script lang="ts">
  import type { UIAnchor } from './types';

  export let active = false;
  export let progress = 0;
  export let anchor: UIAnchor;
  export let materialized = false;

  // Keep prop contract stable with parent while position is now screen-fixed.
  $: void anchor;
  $: void materialized;

  const VISION_EXIT_START = 0.9;
  const VISION_EXIT_SPAN = 0.1;

  $: sectionProgress = Math.min(1, Math.max(0, progress));
  $: motionT = Math.min(1, Math.max(0, sectionProgress / VISION_EXIT_START));
  $: lift = 9 + (-11 * motionT);
  $: pop = 0.96 + 0.06 * motionT;
  $: fadeLead = active
    ? Math.min(1, Math.max(0, (sectionProgress - VISION_EXIT_START) / VISION_EXIT_SPAN))
    : 1;
  $: overlayOpacity = active ? 1 - fadeLead : 0;
  $: overlayVisibility = active ? 'visible' : 'hidden';
  $: overlayTransform = `translate3d(0, ${lift}px, 0) scale(${pop})`;
</script>

<section
  class="vision-overlay"
  class:active={active}
  aria-hidden={!active}
  style:opacity={overlayOpacity}
  style:visibility={overlayVisibility}
  style:transform={overlayTransform}
>
  <h1>My Vision</h1>
  <div class="subtitles">
    <p class="subtitle">i don't just write code.</p>
    <p class="subtitle">i orchestrate systems that scale beyond me.</p>
  </div>
</section>

<style>
  .vision-overlay {
    position: absolute;
    left: clamp(1.2rem, 8vw, 4.6rem);
    top: clamp(30vh, 20vh, 36vh);
    opacity: 1;
    width: min(54rem, calc(100vw - 3rem));
    padding: clamp(0.4rem, 1.2vw, 0.8rem);
    text-shadow: 0 4px 22px rgba(0, 0, 0, 0.58);
    pointer-events: none;
    transition: opacity 220ms ease;
  }

  h1 {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 500;
    font-size: clamp(2.1rem, 7.1vw, 5.2rem);
    letter-spacing: -0.02em;
    line-height: 0.98;
    margin-bottom: 1.5rem;
    color: rgba(241, 246, 255, 0.98);
  }

  .subtitle {
    font-size: clamp(1rem, 2.35vw, 2rem);
    letter-spacing: -0.01em;
    color: rgba(226, 236, 255, 0.86);
    text-transform: lowercase;
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 420ms cubic-bezier(.2,.9,.3,1), transform 420ms cubic-bezier(.2,.9,.3,1);
  }

  .vision-overlay.active .subtitle {
    opacity: 1;
    transform: translateY(0);
  }

  /* stagger lines */
  .subtitles .subtitle:nth-child(1) { transition-delay: 140ms; }
  .subtitles .subtitle:nth-child(2) { transition-delay: 300ms; }

  @media (prefers-reduced-motion: reduce) {
    .subtitle { transition: none !important; transform: none !important; }
  }

  @media (max-width: 700px) {
    .vision-overlay {
      left: clamp(1rem, 4vw, 1.4rem);
      top: clamp(24vh, 32vh, 38vh);
      width: min(92vw, 34rem);
    }
  }
</style>
