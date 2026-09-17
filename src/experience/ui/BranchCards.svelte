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
  export let headerTitle = '';
  export let headerLines: string[] = [];
  export let leftHref: string = '';
  export let rightHref: string = '';
  export let leftTags: string[] = [];
  export let rightTags: string[] = [];
  export let rightProgress: { label: string; value: number }[] = [];
  export let leftStyle = '';
  export let rightStyle = '';
  export let headerStyle = '';
  export let showAnchor = true;
  export let compact = false;
  export let leftWidth = 'clamp(20rem, 34vw, 38rem)';
  export let rightWidth = 'clamp(20rem, 34vw, 38rem)';
  export let headerWidth = 'clamp(14rem, 24vw, 24rem)';
  export let floatSpeed = 3;
  export let leftFloatAmplitude = 6;
  export let rightFloatAmplitude = 5;
  export let headerFloatAmplitude = 2.6;
  export let floatPhaseOffset = 1.1;
  export let headerFloatPhaseOffset = 2.1;

  let root: HTMLElement | null = null;
  let leftCard: HTMLElement | null = null;
  let rightCard: HTMLElement | null = null;
  let headerCard: HTMLElement | null = null;

  let trunkPath = '';
  let leftPath = '';
  let rightPath = '';
  let headerPath = '';
  let trunkLength = 1;
  let leftLength = 1;
  let rightLength = 1;
  let headerLength = 1;
  let viewportWidth = 1;
  let viewportHeight = 1;
  let animationTime = 0;
  let rafId = 0;
  let renderGate = false;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let progressTimers: Array<ReturnType<typeof setTimeout>> = [];
  let displayedProgress: number[] = [];
  let wasVisible = false;

  const clearProgressTimers = () => {
    progressTimers.forEach((t) => clearTimeout(t));
    progressTimers = [];
  };

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
    if (!root) return;

    const source = { x: anchor.x, y: anchor.y };
    let leftPort: { x: number; y: number } | null = null;
    let rightPort: { x: number; y: number } | null = null;

    if (hasLeftCard) {
      if (!leftCard) return;
      leftPort = getCardPort(leftCard.getBoundingClientRect(), source);
    }

    if (hasRightCard) {
      if (!rightCard) return;
      rightPort = getCardPort(rightCard.getBoundingClientRect(), source);
    }

    const branchPorts = [leftPort, rightPort].filter((port): port is { x: number; y: number } => Boolean(port));

    const nx = viewportWidth > 1 ? (source.x / viewportWidth - 0.5) * 2 : 0;
    const ny = viewportHeight > 1 ? (source.y / viewportHeight - 0.5) * 2 : 0;
    const sway = Math.sin(timeSeconds * 1.5 + nx * 1.8) * 9;
    const lift = Math.cos(timeSeconds * 1.25 + ny * 1.7) * 7;

    const branchMid =
      branchPorts.length > 0
        ? {
            x:
              source.x +
              (branchPorts.reduce((sum, port) => sum + port.x, 0) / branchPorts.length - source.x) * 0.32 +
              nx * 24 +
              sway,
            y:
              source.y +
              (branchPorts.reduce((sum, port) => sum + port.y, 0) / branchPorts.length - source.y) * 0.24 -
              18 +
              ny * 14 +
              lift
          }
        : {
            x: source.x + nx * 24 + sway,
            y: source.y - 28 + ny * 14 + lift
          };

    const trunkC1 = {
      x: source.x + nx * 16 + sway * 0.25,
      y: source.y - 16 + ny * 8
    };
    const trunkC2 = {
      x: branchMid.x - nx * 12,
      y: branchMid.y + 10 - ny * 6
    };

    trunkPath = `M ${fmt(source.x)} ${fmt(source.y)} C ${fmt(trunkC1.x)} ${fmt(trunkC1.y)} ${fmt(trunkC2.x)} ${fmt(trunkC2.y)} ${fmt(branchMid.x)} ${fmt(branchMid.y)}`;
    if (leftPort) {
      const leftC1 = {
        x: branchMid.x - 28 + Math.sin(timeSeconds * 1.9) * 4,
        y: branchMid.y + 10
      };
      const leftC2 = {
        x: leftPort.x + 24,
        y: leftPort.y - 8
      };
      leftPath = `M ${fmt(branchMid.x)} ${fmt(branchMid.y)} C ${fmt(leftC1.x)} ${fmt(leftC1.y)} ${fmt(leftC2.x)} ${fmt(leftC2.y)} ${fmt(leftPort.x)} ${fmt(leftPort.y)}`;
      leftLength = Math.max(1, distance(branchMid, leftPort) * 1.18);
    } else {
      leftPath = '';
      leftLength = 1;
    }

    if (rightPort) {
      const rightC1 = {
        x: branchMid.x + 28 + Math.cos(timeSeconds * 1.75) * 4,
        y: branchMid.y + 10
      };
      const rightC2 = {
        x: rightPort.x - 24,
        y: rightPort.y - 8
      };
      rightPath = `M ${fmt(branchMid.x)} ${fmt(branchMid.y)} C ${fmt(rightC1.x)} ${fmt(rightC1.y)} ${fmt(rightC2.x)} ${fmt(rightC2.y)} ${fmt(rightPort.x)} ${fmt(rightPort.y)}`;
      rightLength = Math.max(1, distance(branchMid, rightPort) * 1.18);
    } else {
      rightPath = '';
      rightLength = 1;
    }

    trunkLength = Math.max(1, distance(source, branchMid) * 1.22);

    if (headerTitle && headerCard) {
      const headerRect = headerCard.getBoundingClientRect();
      const headerPort = getCardPort(headerRect, source);
      const headerC1 = {
        x: branchMid.x + 18 + Math.sin(timeSeconds * 1.6) * 3,
        y: branchMid.y - 18
      };
      const headerC2 = {
        x: headerPort.x - 20,
        y: headerPort.y + 8
      };

      headerPath = `M ${fmt(branchMid.x)} ${fmt(branchMid.y)} C ${fmt(headerC1.x)} ${fmt(headerC1.y)} ${fmt(headerC2.x)} ${fmt(headerC2.y)} ${fmt(headerPort.x)} ${fmt(headerPort.y)}`;
      headerLength = Math.max(1, distance(branchMid, headerPort) * 1.18);
    } else {
      headerPath = '';
      headerLength = 1;
    }
  };

  $: sectionT = clamp01(progress);
  $: hasLeftCard = leftTitle.trim().length > 0 || leftLines.length > 0;
  $: hasRightCard = rightTitle.trim().length > 0 || rightLines.length > 0;
  // Visibility is controlled by parent content-active windows.
  $: visibleState = active;
  $: trunkReveal = visibleState ? clamp01(sectionT / 0.22) : 0;
  $: branchReveal = visibleState ? clamp01((sectionT - 0.04) / 0.2) : 0;
  $: frameReveal = visibleState ? 1 : 0;
  $: cardLift = visibleState ? (1 - clamp01(sectionT / 0.24)) * 7 : 12;
  $: cardOpacity = visibleState ? 1 : 0;
  $: leftIdleFloat = visibleState ? Math.sin(animationTime * floatSpeed) * leftFloatAmplitude : 0;
  $: rightIdleFloat = visibleState
    ? Math.sin(animationTime * floatSpeed + floatPhaseOffset) * rightFloatAmplitude
    : 0;
  $: headerIdleFloat = visibleState
    ? Math.sin(animationTime * floatSpeed + headerFloatPhaseOffset) * headerFloatAmplitude
    : 0;

  $: trunkDashOffset = trunkLength * (1 - trunkReveal);
  $: leftDashOffset = leftLength * (1 - branchReveal);
  $: rightDashOffset = rightLength * (1 - branchReveal);
  $: headerDashOffset = headerLength * (1 - branchReveal);

  $: framePerimeterLeft = leftCard
    ? Math.max(1, 2 * (leftCard.clientWidth + leftCard.clientHeight - 4))
    : 1;
  $: framePerimeterRight = rightCard
    ? Math.max(1, 2 * (rightCard.clientWidth + rightCard.clientHeight - 4))
    : 1;
  $: framePerimeterHeader = headerCard
    ? Math.max(1, 2 * (headerCard.clientWidth + headerCard.clientHeight - 4))
    : 1;
  $: frameDashLeft = framePerimeterLeft * (1 - frameReveal);
  $: frameDashRight = framePerimeterRight * (1 - frameReveal);
  $: frameDashHeader = framePerimeterHeader * (1 - frameReveal);

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
      // clear any progress animation timers
      progressTimers.forEach((t) => clearTimeout(t));
      progressTimers = [];
    };
  });

  // initialize displayedProgress when rightProgress data changes
  $: if (rightProgress) {
    displayedProgress = rightProgress.map(() => 0);
  }

  // animate progress fills on visible state transitions
  $: if (rightProgress !== undefined) {
    if (visibleState && !wasVisible && rightProgress.length > 0) {
      // entering visible: start staggered timers
      clearProgressTimers();
      displayedProgress = rightProgress.map(() => 0);
      rightProgress.forEach((item, i) => {
        const delay = 120 + i * 140;
        const t = setTimeout(() => {
          displayedProgress[i] = Math.max(0, Math.min(100, item.value));
          displayedProgress = displayedProgress.slice();
        }, delay);
        progressTimers.push(t);
      });
      wasVisible = true;
    } else if (!visibleState && wasVisible) {
      // leaving visible: reset and clear timers
      clearProgressTimers();
      displayedProgress = rightProgress.map(() => 0);
      wasVisible = false;
    }
  }

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

  $: if (root && active) {
    requestAnimationFrame(() => recalculatePaths(animationTime));
  }
</script>

  <section
    bind:this={root}
    class="branch-stage"
    class:compact={compact}
    class:is-exiting={!visibleState && renderGate}
    aria-hidden={!renderGate}
    style:opacity={visibleState ? 1 : 0}
    style:visibility={renderGate ? 'visible' : 'hidden'}
  >
  {#if showAnchor}
    <div
      class="anchor-core"
      style:opacity={visibleState ? 1 : 0}
      style:transform={`translate3d(${anchor.x}px, ${anchor.y}px, 0) translate(-50%, -50%) scale(${0.74 + trunkReveal * 0.34})`}
    >
      <span class="core-dot"></span>
      <span class="core-ring"></span>
    </div>
  {/if}

  <svg class="wire-layer" viewBox={`0 0 ${viewportWidth} ${viewportHeight}`} preserveAspectRatio="none" aria-hidden="true">
    <path
      class="wire"
      d={trunkPath}
      style:stroke-dasharray={trunkLength}
      style:stroke-dashoffset={trunkDashOffset}
    />
    {#if hasLeftCard}
      <path
        class="wire"
        d={leftPath}
        style:stroke-dasharray={leftLength}
        style:stroke-dashoffset={leftDashOffset}
      />
    {/if}
    {#if hasRightCard}
      <path
        class="wire"
        d={rightPath}
        style:stroke-dasharray={rightLength}
        style:stroke-dashoffset={rightDashOffset}
      />
    {/if}
    {#if headerTitle}
      <path
        class="wire"
        d={headerPath}
        style:stroke-dasharray={headerLength}
        style:stroke-dashoffset={headerDashOffset}
      />
    {/if}
  </svg>

    {#if hasLeftCard}
    <article
      bind:this={leftCard}
      class="info-card"
      style={leftStyle}
      style:width={leftWidth}
      style:transform={`translate3d(0, ${cardLift + leftIdleFloat}px, 0)`}
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
        <h3>
          {#if leftHref}
            <a class="title-link" href={leftHref} target="_blank" rel="noopener noreferrer">
              <span>{leftTitle}</span>
              <svg class="repo-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.41 7.86 10.94.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.3-1.69-1.3-1.69-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.76.41-1.27.75-1.56-2.55-.29-5.24-1.28-5.24-5.72 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.45-2.69 5.43-5.25 5.71.42.36.8 1.08.8 2.18 0 1.57-.01 2.84-.01 3.23 0 .31.21.68.8.56C20.71 21.41 24 17.09 24 12c0-6.35-5.15-11.5-12-11.5z" />
              </svg>
            </a>
          {:else}
            {leftTitle}
          {/if}
        </h3>
      {/if}
      <div class="copy-wrap">
        {#each leftLines as line}
          {#if line.indexOf(':') > -1}
            {@const idx = line.indexOf(':')}
            <p><strong>{line.slice(0, idx + 1)}</strong> {line.slice(idx + 1).trim()}</p>
          {:else}
            <p>{line}</p>
          {/if}
        {/each}
      </div>
      {#if leftTags.length > 0}
        <div class="tag-row">
          {#each leftTags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      {/if}
    </article>
  {/if}

    {#if hasRightCard}
    <article
      bind:this={rightCard}
      class="info-card"
      style={rightStyle}
      style:width={rightWidth}
      style:transform={`translate3d(0, ${cardLift + rightIdleFloat}px, 0)`}
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
        <h3>
          {#if rightHref}
            <a class="title-link" href={rightHref} target="_blank" rel="noopener noreferrer">
              <span>{rightTitle}</span>
              <svg class="repo-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.41 7.86 10.94.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.3-1.69-1.3-1.69-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.76.41-1.27.75-1.56-2.55-.29-5.24-1.28-5.24-5.72 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.45-2.69 5.43-5.25 5.71.42.36.8 1.08.8 2.18 0 1.57-.01 2.84-.01 3.23 0 .31.21.68.8.56C20.71 21.41 24 17.09 24 12c0-6.35-5.15-11.5-12-11.5z" />
              </svg>
            </a>
          {:else}
            {rightTitle}
          {/if}
        </h3>
      {/if}

      {#if rightProgress && rightProgress.length > 0}
        <div class="progress-wrap">
          {#each rightProgress as item, i}
            <div class="progress-row">
              <div class="progress-label">{item.label}</div>
              <div class="progress-bar" aria-hidden="true">
                <div class="progress-fill" style:width={`${displayedProgress[i] ?? 0}%`}></div>
              </div>
              <div class="progress-value">{displayedProgress[i] ?? 0}%</div>
            </div>
          {/each}
        </div>
      {:else}
        <slot name="right">
          <div class="copy-wrap">
            {#each rightLines as line}
              {#if line.indexOf(':') > -1}
                {@const idx = line.indexOf(':')}
                <p><strong>{line.slice(0, idx + 1)}</strong> {line.slice(idx + 1).trim()}</p>
              {:else}
                <p>{line}</p>
              {/if}
            {/each}
          </div>
        </slot>
      {/if}
      {#if rightTags.length > 0}
        <div class="tag-row">
          {#each rightTags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      {/if}
    </article>
  {/if}

  {#if headerTitle}
    <article
      bind:this={headerCard}
      class="info-card header-card"
      style={headerStyle}
      style:width={headerWidth}
      style:transform={`translate3d(0, ${cardLift + headerIdleFloat}px, 0)`}
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
          style:stroke-dasharray={framePerimeterHeader}
          style:stroke-dashoffset={frameDashHeader}
        />
      </svg>
      <h3>{headerTitle}</h3>
      {#if headerLines.length > 0}
        <div class="copy-wrap">
          {#each headerLines as line}
            {#if line.indexOf(':') > -1}
              {@const idx = line.indexOf(':')}
              <p><strong>{line.slice(0, idx + 1)}</strong> {line.slice(idx + 1).trim()}</p>
            {:else}
              <p>{line}</p>
            {/if}
          {/each}
        </div>
      {/if}
    </article>
  {/if}
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
    pointer-events: none;
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
    background: rgba(2, 6, 18, 0.1);
    backdrop-filter: blur(2px);
    border: 2px solid rgba(235, 244, 255, 0.92);
    box-shadow: 0 0 0 1px rgba(120, 166, 255, 0.2), 0 8px 30px rgba(0, 0, 0, 0.35);
    color: rgba(235, 242, 255, 0.94);
    pointer-events: auto;
    transition: opacity 260ms ease, transform 300ms ease;
    z-index: 8;
  }

  .title-link {
    color: inherit;
    text-decoration: none;
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
    pointer-events: auto;
  }

  .repo-icon {
    opacity: 0.95;
    display: inline-block;
    vertical-align: middle;
  }

  .header-card {
    min-height: 5rem;
    z-index: 10;
  }

  .frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
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

  .progress-wrap {
    display: grid;
    gap: 1rem;
  }

  .progress-row {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
  }

  .progress-label {
    grid-column: 1 / -1;
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(0.85rem, 1.05vw, 1rem);
    color: rgba(224, 236, 255, 0.92);
  }

  .progress-bar {
    grid-column: 1 / 2;
    height: clamp(0.8rem, 1.2vw, 1.2rem);
    background: rgba(0, 0, 0, 0.64);
    border-radius: 9px;
    overflow: hidden;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03);
  }

  .progress-fill {
    height: 100%;
    background: rgba(255,255,255,0.98);
    width: 0%;
    transition: width 600ms cubic-bezier(.22,.9,.3,1);
  }

  .progress-value {
    grid-column: 2 / 3;
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(0.82rem, 1.02vw, 0.98rem);
    color: rgba(224,236,255,0.84);
    min-width: 3.2rem;
    text-align: right;
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

  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.65rem;
  }

  .tag {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(0.68rem, 0.9vw, 0.78rem);
    letter-spacing: 0.01em;
    padding: 0.22rem 0.6rem;
    border-radius: 999px;
    border: 1px solid rgba(223, 235, 255, 0.32);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(224, 236, 255, 0.72);
    white-space: nowrap;
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
    .header-card {
      display: none !important;
      pointer-events: none !important;
    }
  }

  .branch-stage.compact .info-card {
    min-height: 8rem;
    padding: clamp(0.7rem, 1.2vw, 0.95rem);
  }

  .branch-stage.compact h3 {
    font-size: clamp(0.95rem, 1.5vw, 1.45rem);
    margin: 0 0 0.55rem;
  }

  .branch-stage.compact p {
    font-size: clamp(0.78rem, 1.05vw, 1rem);
  }

  .branch-stage.compact .tag {
    font-size: clamp(0.62rem, 0.85vw, 0.72rem);
    padding: 0.18rem 0.52rem;
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