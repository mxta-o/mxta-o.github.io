<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import type { UIAnchor } from './types';

  export let active = false;
  export let progress = 0;
  export let anchor: UIAnchor;
  export let materialized = false;

  let root: HTMLElement | null = null;
  let previousActive = false;
  let previousMaterialized = false;
  const ENTRY_DELAY = 0.14;

  const animateIn = () => {
    if (!root) return;
    gsap.to(root, {
      autoAlpha: 1,
      '--lift': '0px',
      '--pop': 1,
      delay: ENTRY_DELAY,
      duration: 0.7,
      ease: 'power2.out',
      pointerEvents: 'auto'
    });
  };

  const animateOut = () => {
    if (!root) return;
    gsap.to(root, {
      autoAlpha: 0,
      '--lift': '18px',
      '--pop': 0.94,
      duration: 0.5,
      ease: 'power2.in',
      pointerEvents: 'none'
    });
  };

  onMount(() => {
    gsap.set(root, { autoAlpha: 0, '--lift': '18px', '--pop': 0.94, pointerEvents: 'none' });
    if (active && materialized) animateIn();
    previousActive = active;
    previousMaterialized = materialized;
  });

  $: if (root && (active !== previousActive || materialized !== previousMaterialized)) {
    previousActive = active;
    previousMaterialized = materialized;
    if (active && materialized) animateIn();
    else animateOut();
  }

  $: if (root && active && materialized) {
    const easedProgress = gsap.parseEase('power1.out')(progress);
    gsap.to(root, {
      '--lift': `${gsap.utils.interpolate(9, -3, easedProgress)}px`,
      '--pop': gsap.utils.interpolate(0.96, 1.02, easedProgress),
      duration: 0.24,
      ease: 'power1.out',
      overwrite: 'auto'
    });
  }
</script>

<section
  bind:this={root}
  class="panel"
  aria-hidden={!active}
  style:--anchor-x={`${anchor.x}px`}
  style:--anchor-y={`${anchor.y}px`}
  style:--anchor-opacity={anchor.opacity}
  style:--anchor-scale={anchor.scale}
  style:visibility={anchor.visible ? 'visible' : 'hidden'}
>
  <p class="eyebrow">Checkpoint 03</p>
  <h2>Experience · Circe</h2>
  <p class="copy">Shipping full-stack features, improving API reliability, and delivering smoother frontend flows in a collaborative team environment.</p>
</section>

<style>
  .panel {
    position: absolute;
    left: 0;
    top: 0;
    transform: translate3d(calc(var(--anchor-x) - 50%), calc(var(--anchor-y) - 50% + var(--lift, 0px)), 0)
      scale(calc(var(--anchor-scale, 1) * var(--pop, 1)));
    opacity: var(--anchor-opacity, 0);
    width: min(32rem, calc(100vw - 2.2rem));
    padding: clamp(1rem, 2.2vw, 1.9rem);
    border-radius: 1rem;
    border: 1px solid rgba(110, 156, 255, 0.3);
    background: linear-gradient(145deg, rgba(7, 11, 30, 0.8), rgba(5, 8, 24, 0.58));
    backdrop-filter: blur(8px);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.33);
  }

  .eyebrow {
    font-family: 'Space Grotesk', sans-serif;
    color: rgba(176, 196, 255, 0.9);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-size: 0.72rem;
    margin-bottom: 0.45rem;
  }

  h2 {
    font-family: 'Space Grotesk', sans-serif;
    margin: 0;
    font-size: clamp(1.3rem, 4vw, 2.1rem);
    line-height: 1.08;
  }

  .copy {
    margin-top: 0.6rem;
    color: rgba(215, 226, 255, 0.84);
    font-size: clamp(0.9rem, 1.9vw, 1.06rem);
    max-width: 54ch;
  }
</style>
