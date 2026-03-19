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
      duration: 0.68,
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
      '--lift': `${gsap.utils.interpolate(9, -2, easedProgress)}px`,
      '--pop': gsap.utils.interpolate(0.96, 1.02, easedProgress),
      duration: 0.24,
      ease: 'power1.out',
      overwrite: 'auto'
    });
  }
</script>

<section
  bind:this={root}
  class="contact-stage"
  aria-hidden={!active}
  style:--anchor-x={`${anchor.x}px`}
  style:--anchor-y={`${anchor.y}px`}
  style:--anchor-opacity={anchor.opacity}
  style:--anchor-scale={anchor.scale}
  style:visibility={anchor.visible ? 'visible' : 'hidden'}
>
  <p class="edge-copy left">more about myself</p>
  <p class="edge-copy right">contact info</p>

</section>

<style>
  .contact-stage {
    position: absolute;
    inset: 0;
    opacity: var(--anchor-opacity, 0);
  }

  .panel {
    position: absolute;
    left: var(--anchor-x);
    top: var(--anchor-y);
    transform: translate3d(-50%, calc(-50% + var(--lift, 0px)), 0)
      scale(calc(var(--anchor-scale, 1) * var(--pop, 1)));
    width: min(31rem, calc(100vw - 2.4rem));
    padding: clamp(1rem, 2.2vw, 1.9rem);
    border-radius: 1rem;
    border: 1px solid rgba(117, 162, 255, 0.34);
    background: linear-gradient(145deg, rgba(5, 10, 29, 0.82), rgba(4, 9, 27, 0.6));
    backdrop-filter: blur(10px);
    box-shadow: 0 20px 52px rgba(0, 0, 0, 0.38);
  }

  .edge-copy {
    position: absolute;
    top: clamp(1.1rem, 2.6vw, 2rem);
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    color: rgba(236, 242, 255, 0.92);
    letter-spacing: -0.01em;
    font-size: clamp(1rem, 2.4vw, 2.1rem);
    text-shadow: 0 2px 14px rgba(0, 0, 0, 0.44);
  }

  .edge-copy.left {
    left: clamp(1rem, 3vw, 2rem);
  }

  .edge-copy.right {
    right: clamp(1rem, 3vw, 2rem);
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
    max-width: 50ch;
  }

  @media (max-width: 760px) {
    .edge-copy {
      font-size: clamp(0.9rem, 4.8vw, 1.4rem);
    }

    .edge-copy.right {
      top: clamp(3.6rem, 9vw, 4.7rem);
    }
  }
</style>
