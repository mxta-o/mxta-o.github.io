<script context="module" lang="ts">
  import { writable } from 'svelte/store';

  type PendingLink = {
    label: string;
    href: string;
    newTab: boolean;
  };

  const pendingLink = writable<PendingLink | null>(null);

  export const requestLinkOpen = (label: string, href: string, newTab = true) => {
    pendingLink.set({ label, href, newTab });
  };
</script>

<script lang="ts">
  import { fade, scale } from 'svelte/transition';

  let confirmButton: HTMLButtonElement | null = null;

  const cancel = () => pendingLink.set(null);

  const confirm = () => {
    const link = $pendingLink;
    if (!link) return;
    pendingLink.set(null);

    if (link.href.startsWith('mailto:')) {
      window.location.href = link.href;
      return;
    }

    if (link.newTab) {
      window.open(link.href, '_blank', 'noopener,noreferrer');
      return;
    }

    window.location.assign(link.href);
  };

  const prettyTarget = (href: string) =>
    href.startsWith('mailto:') ? href.slice('mailto:'.length) : href.replace(/^https?:\/\//, '');

  const onKeydown = (event: KeyboardEvent) => {
    if ($pendingLink && event.key === 'Escape') cancel();
  };

  $: if (confirmButton) confirmButton.focus();
</script>

<svelte:window on:keydown={onKeydown} />

{#if $pendingLink}
  <div class="scrim" transition:fade={{ duration: 160 }} data-scroll-exempt>
    <button type="button" class="scrim-hit" aria-label="Cancel" on:click={cancel}></button>

    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-confirm-title"
      transition:scale={{ duration: 180, start: 0.94 }}
    >
      <h2 id="link-confirm-title">Open {$pendingLink.label}?</h2>
      <p class="target">{prettyTarget($pendingLink.href)}</p>

      <div class="actions">
        <button type="button" class="ghost" on:click={cancel}>Cancel</button>
        <button type="button" class="primary" bind:this={confirmButton} on:click={confirm}>
          Open
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .scrim {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(1rem, 6vw, 2rem);
    background: rgba(1, 3, 11, 0.72);
    backdrop-filter: blur(3px);
    z-index: 200;
    pointer-events: auto;
  }

  .scrim-hit {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    padding: 0;
    background: transparent;
    cursor: default;
  }

  .dialog {
    position: relative;
    width: min(22rem, 100%);
    padding: clamp(1.1rem, 4vw, 1.5rem);
    background: rgba(2, 6, 18, 0.92);
    border: 2px solid rgba(235, 244, 255, 0.92);
    box-shadow: 0 0 0 1px rgba(120, 166, 255, 0.2), 0 18px 50px rgba(0, 0, 0, 0.55);
    color: rgba(235, 242, 255, 0.94);
  }

  h2 {
    margin: 0 0 0.45rem;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: clamp(1.05rem, 4.2vw, 1.25rem);
    letter-spacing: -0.01em;
    color: rgba(240, 246, 255, 0.98);
  }

  .target {
    margin: 0 0 1.15rem;
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(0.76rem, 3.2vw, 0.88rem);
    line-height: 1.3;
    color: rgba(224, 236, 255, 0.62);
    word-break: break-all;
  }

  .actions {
    display: flex;
    gap: 0.6rem;
    justify-content: flex-end;
  }

  .actions button {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(0.82rem, 3.4vw, 0.92rem);
    padding: 0.55rem 1.05rem;
    border-radius: 999px;
    cursor: pointer;
    touch-action: manipulation;
  }

  .ghost {
    border: 1px solid rgba(223, 235, 255, 0.32);
    background: transparent;
    color: rgba(224, 236, 255, 0.78);
  }

  .primary {
    border: 1px solid rgba(235, 244, 255, 0.92);
    background: rgba(235, 244, 255, 0.94);
    color: #02030a;
    font-weight: 600;
  }
</style>
