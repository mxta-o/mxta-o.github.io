<script lang="ts">
  import { onMount } from 'svelte';
  import type { UIAnchor } from './types';

  export let active = false;
  export let progress = 0;
  export let anchor: UIAnchor;
  export let materialized = false;
  $: void materialized;

  export let leftTitle = '';
  export let leftLines: string[] = [];
  export let rightTitle = '';
  export let rightLines: string[] = [];
  export let leftStyle = '';
  export let rightStyle = '';
  export let leftWidth = 'clamp(20rem, 34vw, 38rem)';
  export let rightWidth = 'clamp(20rem, 34vw, 38rem)';

  let root: HTMLElement | null = null;
  let leftCard: HTMLElement | null = null;
  let rightCard: HTMLElement | null = null;

  let trunkPath = '';
  let leftPath = '';
  let rightPath = '';
  let trunkLength = 1;
  let leftLength = 1;
  let rightLength = 1;
  let viewportWidth = 1;
  let viewportHeight = 1;
  let animationTime = 0;
  let rafId = 0;
  let renderGate = false;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
  const fmt = (value: number) => value.toFixed(2);

  const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCardPort = (cardRect: DOMRect, source: { x: number; y: number }) => {
    const centerX = cardRect.left + cardRect.width * 0.5;
    const centerY = cardRect.top + cardRect.height * 0.5;
    const connectFromLeft = centerX > source.x;

    return {
      x: connectFromLeft ? cardRect.left : cardRect.right,
      y: Math.min(cardRect.bottom - 18, Math.max(cardRect.top + 18, centerY))
    };
  };

  const recalculatePaths = (timeSeconds = animationTime) => {
    if (!root || !leftCard || !rightCard) return;

    const source = { x: anchor.x, y: anchor.y };
    const leftRect = leftCard.getBoundingClientRect();
    const rightRect = rightCard.getBoundingClientRect();

    const leftPort = getCardPort(leftRect, source);
    const rightPort = getCardPort(rightRect, source);

    const nx = viewportWidth > 1 ? (source.x / viewportWidth - 0.5) * 2 : 0;
    const ny = viewportHeight > 1 ? (source.y / viewportHeight - 0.5) * 2 : 0;
    const sway = Math.sin(timeSeconds * 1.5 + nx * 1.8) * 9;
    const lift = Math.cos(timeSeconds * 1.25 + ny * 1.7) * 7;

    const branchMid = {
      x: source.x + (leftPort.x + rightPort.x - source.x * 2) * 0.16 + nx * 24 + sway,
      y: source.y + (leftPort.y + rightPort.y - source.y * 2) * 0.08 - 18 + ny * 14 + lift
    };

    const trunkC1 = {
      x: source.x + nx * 16 + sway * 0.25,
      y: source.y - 16 + ny * 8
    };
    const trunkC2 = {
      x: branchMid.x - nx * 12,
      y: branchMid.y + 10 - ny * 6
    };

    const leftC1 = {
      x: branchMid.x - 28 + Math.sin(timeSeconds * 1.9) * 4,
      y: branchMid.y + 10
    };
    const leftC2 = {
      x: leftPort.x + 24,
      y: leftPort.y - 8
    };

    const rightC1 = {
      x: branchMid.x + 28 + Math.cos(timeSeconds * 1.75) * 4,
      y: branchMid.y + 10
    };
    const rightC2 = {
      x: rightPort.x - 24,
      y: rightPort.y - 8
    };

    trunkPath = `M ${fmt(source.x)} ${fmt(source.y)} C ${fmt(trunkC1.x)} ${fmt(trunkC1.y)} ${fmt(trunkC2.x)} ${fmt(trunkC2.y)} ${fmt(branchMid.x)} ${fmt(branchMid.y)}`;
    leftPath = `M ${fmt(branchMid.x)} ${fmt(branchMid.y)} C ${fmt(leftC1.x)} ${fmt(leftC1.y)} ${fmt(leftC2.x)} ${fmt(leftC2.y)} ${fmt(leftPort.x)} ${fmt(leftPort.y)}`;
    rightPath = `M ${fmt(branchMid.x)} ${fmt(branchMid.y)} C ${fmt(rightC1.x)} ${fmt(rightC1.y)} ${fmt(rightC2.x)} ${fmt(rightC2.y)} ${fmt(rightPort.x)} ${fmt(rightPort.y)}`;

    trunkLength = Math.max(1, distance(source, branchMid) * 1.22);
    leftLength = Math.max(1, distance(branchMid, leftPort) * 1.18);
    rightLength = Math.max(1, distance(branchMid, rightPort) * 1.18);
  };

  $: sectionT = clamp01(progress);
  // Visibility is controlled by parent content-active windows.
  $: visibleState = active;
  $: trunkReveal = visibleState ? clamp01(sectionT / 0.22) : 0;
  $: branchReveal = visibleState ? clamp01((sectionT - 0.04) / 0.2) : 0;
  $: frameReveal = visibleState ? 1 : 0;
  $: cardLift = visibleState ? (1 - clamp01(sectionT / 0.24)) * 7 : 12;
  $: cardOpacity = visibleState ? 1 : 0;

  $: trunkDashOffset = trunkLength * (1 - trunkReveal);
  $: leftDashOffset = leftLength * (1 - branchReveal);
  $: rightDashOffset = rightLength * (1 - branchReveal);

  $: framePerimeterLeft = leftCard
    ? Math.max(1, 2 * (leftCard.clientWidth + leftCard.clientHeight - 4))
    : 1;
  $: framePerimeterRight = rightCard
    ? Math.max(1, 2 * (rightCard.clientWidth + rightCard.clientHeight - 4))
    : 1;
  $: frameDashLeft = framePerimeterLeft * (1 - frameReveal);
  $: frameDashRight = framePerimeterRight * (1 - frameReveal);

  onMount(() => {
    const syncViewport = () => {
      viewportWidth = Math.max(1, window.innerWidth || 1);
      viewportHeight = Math.max(1, window.innerHeight || 1);
      recalculatePaths(animationTime);
    };

    const animate = (nowMs: number) => {
      animationTime = nowMs * 0.001;
      if (visibleState) {
        recalculatePaths(animationTime);
      }
      rafId = requestAnimationFrame(animate);
    };

    const onResize = () => syncViewport();
    syncViewport();
    window.addEventListener('resize', onResize);
    requestAnimationFrame(syncViewport);
    rafId = requestAnimationFrame(animate);

    return () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  });

  $: {
    if (visibleState) {
      renderGate = true;
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    } else if (renderGate && !hideTimer) {
      hideTimer = setTimeout(() => {
        renderGate = false;
        hideTimer = null;
      }, 380);
    }
  }

  $: if (root && leftCard && rightCard && active) {
    requestAnimationFrame(() => recalculatePaths(animationTime));
  }
</script>

<section
  bind:this={root}
  class="branch-stage"
  class:is-exiting={!visibleState && renderGate}
  aria-hidden={!renderGate}
  style:opacity={visibleState ? 1 : 0}
  style:visibility={renderGate ? 'visible' : 'hidden'}
>
  <div
    class="anchor-core"
    style:opacity={visibleState ? 1 : 0}
    style:transform={`translate3d(${anchor.x}px, ${anchor.y}px, 0) translate(-50%, -50%) scale(${0.74 + trunkReveal * 0.34})`}
  >
    <span class="core-dot"></span>
    <span class="core-ring"></span>
  </div>

  <svg class="wire-layer" viewBox={`0 0 ${viewportWidth} ${viewportHeight}`} preserveAspectRatio="none" aria-hidden="true">
    <path
      class="wire"
      d={trunkPath}
      style:stroke-dasharray={trunkLength}
      style:stroke-dashoffset={trunkDashOffset}
    />
    <path
      class="wire"
      d={leftPath}
      style:stroke-dasharray={leftLength}
      style:stroke-dashoffset={leftDashOffset}
    />
    <path
      class="wire"
      d={rightPath}
      style:stroke-dasharray={rightLength}
      style:stroke-dashoffset={rightDashOffset}
    />
  </svg>

  <article
    bind:this={leftCard}
    class="info-card"
    style={leftStyle}
    style:width={leftWidth}
    style:transform={`translate3d(0, ${cardLift}px, 0)`}
    style:opacity={cardOpacity}
  >
    <svg class="frame" aria-hidden="true">
      <rect
        x="1"
        y="1"
        width="calc(100% - 2px)"
        height="calc(100% - 2px)"
        rx="2"
        ry="2"
        style:stroke-dasharray={framePerimeterLeft}
        style:stroke-dashoffset={frameDashLeft}
      />
    </svg>
    {#if leftTitle}
      <h3>{leftTitle}</h3>
    {/if}
    <div class="copy-wrap">
      {#each leftLines as line}
        <p>{line}</p>
      {/each}
    </div>
  </article>

  <article
    bind:this={rightCard}
    class="info-card"
    style={rightStyle}
    style:width={rightWidth}
    style:transform={`translate3d(0, ${cardLift}px, 0)`}
    style:opacity={cardOpacity}
  >
    <svg class="frame" aria-hidden="true">
      <rect
        x="1"
        y="1"
        width="calc(100% - 2px)"
        height="calc(100% - 2px)"
        rx="2"
        ry="2"
        style:stroke-dasharray={framePerimeterRight}
        style:stroke-dashoffset={frameDashRight}
      />
    </svg>
    {#if rightTitle}
      <h3>{rightTitle}</h3>
    {/if}
    <div class="copy-wrap">
      {#each rightLines as line}
        <p>{line}</p>
      {/each}
    </div>
  </article>
</section>

<style>
  .branch-stage {
    position: absolute;
    inset: 0;
    pointer-events: none;
    transition: opacity 320ms ease, filter 320ms ease, transform 320ms ease;
    z-index: 50;
  }

  .branch-stage.is-exiting {
    filter: blur(2.2px);
    transform: translate3d(0, -4px, 0) scale(0.995);
  }

  .wire-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .anchor-core {
    position: absolute;
    width: 32px;
    height: 32px;
    pointer-events: none;
    z-index: 70;
    transition: opacity 220ms ease;
  }

  .core-dot {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 8px;
    height: 8px;
    transform: translate(-50%, -50%);
    border-radius: 999px;
    background: rgba(245, 250, 255, 0.96);
    box-shadow: 0 0 10px rgba(176, 204, 255, 0.9);
  }

  .core-ring {
    position: absolute;
    inset: 3px;
    border: 1.5px solid rgba(225, 237, 255, 0.86);
    border-radius: 999px;
    animation: branch-ring-spin 5.6s linear infinite;
  }

  .wire {
    fill: none;
    stroke: rgba(214, 228, 255, 0.74);
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: stroke-dashoffset 260ms ease;
    filter: drop-shadow(0 0 4px rgba(167, 193, 255, 0.3));
  }

  .info-card {
    position: absolute;
    min-height: 9.5rem;
    padding: clamp(0.9rem, 1.8vw, 1.2rem);
    background: rgba(2, 6, 18, 0.4);
    backdrop-filter: blur(2px);
    border: 2px solid rgba(235, 244, 255, 0.92);
    box-shadow: 0 0 0 1px rgba(120, 166, 255, 0.2), 0 8px 30px rgba(0, 0, 0, 0.35);
    color: rgba(235, 242, 255, 0.94);
    pointer-events: none;
    transition: opacity 260ms ease, transform 300ms ease;
    z-index: 8;
  }

  .frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .frame rect {
    fill: transparent;
    stroke: rgba(223, 235, 255, 0.86);
    stroke-width: 1.8;
    vector-effect: non-scaling-stroke;
    transition: stroke-dashoffset 320ms ease;
  }

  h3 {
    margin: 0 0 0.7rem;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    letter-spacing: -0.01em;
    font-size: clamp(1.05rem, 1.8vw, 1.9rem);
    color: rgba(240, 246, 255, 0.98);
  }

  .copy-wrap {
    display: grid;
    gap: 0.36rem;
  }

  p {
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    letter-spacing: -0.005em;
    line-height: 1.26;
    font-size: clamp(0.84rem, 1.25vw, 1.18rem);
    color: rgba(224, 236, 255, 0.94);
    text-wrap: pretty;
  }

  @media (max-width: 900px) {
    .wire {
      stroke-width: 1.1;
    }

    .info-card {
      width: min(90vw, 35rem) !important;
      left: clamp(0.8rem, 4vw, 1.2rem) !important;
      right: auto !important;
    }
  }

  @keyframes branch-ring-spin {
    from {
      transform: rotate(0deg) scale(1);
    }
    50% {
      transform: rotate(180deg) scale(1.06);
    }
    to {
      transform: rotate(360deg) scale(1);
    }
  }
</style>