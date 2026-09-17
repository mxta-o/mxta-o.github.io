<script lang="ts">
  import { onDestroy } from 'svelte';
  import BranchCards from './BranchCards.svelte';
  import type { UIAnchor } from './types';

  export let active = false;
  export let progress = 0;
  export let anchor: UIAnchor;
  export let materialized = false;

  // Position controls: tweak these constants to move the header and body cards.
  const CONTACT_HEADER_STYLE = 'right: clamp(1rem, 3vw, 2rem); top: clamp(1.2rem, 8vh, 4rem);';
  const CONTACT_LEFT_STYLE = 'left: clamp(1rem, 3vw, 2rem); top: clamp(10vh, 14vh, 18vh);';
  const CONTACT_RIGHT_STYLE = 'right: clamp(1rem, 3vw, 2rem); top: clamp(56vh, 60vh, 65vh);';

  // Direct URLs for contact pills — edit these targets as needed.
  const urls: Record<string, string> = {
    linkedin: 'https://linkedin.com/in/jaelan-cruz/',
    github: 'https://github.com/mxta-o',
    resume: '/resume.pdf',
    instagram: 'https://instagram.com/jxelxn.sh/',
    // keep the raw username in connectLinks for copying
    discord: '.ehlan',
    email: 'mailto:jaelancruz@yahoo.com'
  };

  // Note: connectLinks may include a `clipboard` flag to indicate
  // the button should copy text instead of navigating.
  const connectLinks: Array<{ label: string; href: string; newTab?: boolean; clipboard?: boolean }> = [
    { label: 'LinkedIn', href: urls.linkedin, newTab: true },
    { label: 'GitHub', href: urls.github, newTab: true },
    { label: 'Resume', href: urls.resume, newTab: true },
    { label: 'Instagram', href: urls.instagram, newTab: true },
    { label: 'Discord', href: urls.discord, newTab: false, clipboard: true },
    { label: 'Email', href: urls.email, newTab: false }
  ];

  let toast = '';
  let showToast = false;
  let toastTimeout: number | null = null;

  const showTempToast = (message: string, ms = 2200) => {
    toast = message;
    showToast = true;
    if (toastTimeout) window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      showToast = false;
      toastTimeout = null;
    }, ms);
  };

  onDestroy(() => {
    if (toastTimeout) window.clearTimeout(toastTimeout);
  });

  const handleCopyDiscord = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(urls.discord);
        showTempToast(`Copied ${urls.discord} to clipboard`);
      } catch (e) {
        showTempToast('Copy failed — select and copy manually');
      }
    } else {
      showTempToast('Copy not supported in this browser');
    }
  };

  const handleConnectClick = (href: string, newTab = true) => {
    if (typeof window === 'undefined') return;

    if (href.startsWith('mailto:')) {
      window.location.href = href;
      return;
    }

    if (newTab) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }

    window.location.assign(href);
  };
</script>

<BranchCards
  {active}
  {progress}
  {anchor}
  {materialized}
  leftTitle="Tech Stack"
  leftLines={[
    'Languages: Java, Python, C, C++, JavaScript, TypeScript, SQL, HTML5, CSS, Bash',
    'Frameworks: React, FastAPI, Astro, Svelte, Three.js, Flask, TailwindCSS, OpenGL, WebGL, GSAP, Expo',
    'Tools: PostgreSQL, AWS, Docker, Linux, Maven, JUnit.. more on my github :)'
  ]}
  rightTitle="Connect"
  rightLines={[]}
  leftStyle={CONTACT_LEFT_STYLE}
  rightStyle={CONTACT_RIGHT_STYLE}
  leftWidth="clamp(14rem, 25vw, 20rem)"
  rightWidth="clamp(20rem, 30vw, 30rem)"
>
  <div slot="right" class="contact-grid">
    {#each connectLinks as link}
      <button
        class="contact-pill"
        type="button"
        on:click={() => (link.clipboard ? handleCopyDiscord() : handleConnectClick(link.href, link.newTab ?? true))}
      >
        {link.label}
      </button>
    {/each}

    <div
      class="toast"
      aria-live="polite"
      aria-atomic="true"
      class:visible={showToast}
    >
      {toast}
    </div>
  </div>

</BranchCards>

<style>
  .contact-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.6rem;
    align-items: center;
    position: relative;
    z-index: 2;
  }

  .contact-pill {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 0.48rem 0.6rem;
    background: transparent;
    border: 1px solid rgba(240, 246, 255, 0.06);
    color: rgba(232, 240, 255, 0.95);
    text-decoration: none;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.95rem;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease,
      transform 140ms ease;
  }

  .contact-pill:hover,
  .contact-pill:focus-visible {
    background: rgba(205, 223, 255, 0.09);
    border-color: rgba(227, 238, 255, 0.48);
    color: rgba(246, 250, 255, 1);
    transform: translate3d(0, -1px, 0);
    outline: none;
  }

  .contact-pill:active {
    transform: translate3d(0, 0, 0) scale(0.985);
  }

  .toast {
    position: absolute;
    left: 50%;
    transform: translateX(-50%) translateY(8px);
    bottom: -2.8rem;
    background: rgba(20, 24, 30, 0.92);
    color: rgba(232, 240, 255, 0.98);
    padding: 0.36rem 0.64rem;
    border-radius: 6px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.85rem;
    opacity: 0;
    pointer-events: none;
    transition: opacity 160ms ease, transform 160ms ease;
    white-space: nowrap;
    z-index: 50;
  }

  .toast.visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
</style>
