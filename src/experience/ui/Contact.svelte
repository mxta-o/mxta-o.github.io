<script lang="ts">
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
</script>

<BranchCards
  {active}
  {progress}
  {anchor}
  {materialized}
  leftTitle="Tech Stack"
  leftLines={[
    'Languages: Java, Python, C, JavaScript, TypeScript, HTML5, CSS, Bash',
    'Frameworks: React, FastAPI, Astro, Svelte, Three.js, Flask, TailwindCSS',
    'Tools: PostgreSQL, AWS, Docker, GitHub Actions, Linux'
  ]}
  rightTitle="Connect"
  rightLines={[
    'LinkedIn: jaelan-cruz',
    'GitHub: mxta-o',
    'Discord: .ehlan',
    'Email: jaelancruz@yahoo.com'
  ]}
  leftStyle={CONTACT_LEFT_STYLE}
  rightStyle={CONTACT_RIGHT_STYLE}
  leftWidth="clamp(14rem, 25vw, 20rem)"
  rightWidth="clamp(20rem, 30vw, 30rem)"
/>
