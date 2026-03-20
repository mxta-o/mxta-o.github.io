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
      '--lift': `${gsap.utils.interpolate(10, -2, easedProgress)}px`,
      '--pop': gsap.utils.interpolate(0.96, 1.02, easedProgress),
      duration: 0.25,
      ease: 'power1.out',
      overwrite: 'auto'
    });
  }
</script>

<section
  bind:this={root}
  class="intro-overlay"
  style:--anchor-x={`${anchor.x}px`}
  style:--anchor-y={`${anchor.y}px`}
  style:--anchor-opacity={anchor.opacity}
  style:--anchor-scale={Math.max(anchor.scale, 0.92)}
  style:visibility={anchor.visible ? 'visible' : 'hidden'}
>
  <h1>Hey, I&apos;m Jaelan</h1>
  <p class="subtitle">scroll to explore my universe</p>
</section>

<style>
  .intro-overlay {
    position: absolute;
    left: 0;
    top: 0;
    transform: translate3d(
        calc(var(--anchor-x) - clamp(16rem, 30vw, 30rem)),
        calc(var(--anchor-y) - clamp(8rem, 13vh, 11rem) + var(--lift, 0px)),
        0
      )
      scale(calc(var(--anchor-scale, 1) * var(--pop, 1)));
    opacity: var(--anchor-opacity, 0);
    width: min(54rem, calc(100vw - 3rem));
    padding: clamp(0.4rem, 1.2vw, 0.8rem);
    text-shadow: 0 4px 22px rgba(0, 0, 0, 0.58);
  }

  h1 {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 500;
    font-size: clamp(2.1rem, 7.1vw, 5.2rem);
    letter-spacing: -0.02em;
    line-height: 0.98;
    margin: 0;
    color: rgba(241, 246, 255, 0.98);
  }

  .subtitle {
    margin-top: 0.72rem;
    font-size: clamp(1rem, 2.35vw, 2rem);
    letter-spacing: -0.01em;
    color: rgba(226, 236, 255, 0.86);
    text-transform: lowercase;
  }
  @media (max-width: 700px) {
    .intro-overlay {
      transform: translate3d(
          calc(var(--anchor-x) - clamp(9rem, 21vw, 14rem)),
          calc(var(--anchor-y) - clamp(7rem, 11vh, 9rem) + var(--lift, 0px)),
          0
        )
        scale(calc(var(--anchor-scale, 1) * var(--pop, 1)));
      width: min(92vw, 34rem);
    }
  }
</style>
