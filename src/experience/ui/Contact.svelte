<script lang="ts">
  import BranchCards from './BranchCards.svelte';
  import type { UIAnchor } from './types';

  export let active = false;
  export let progress = 0;
  export let anchor: UIAnchor;
  export let materialized = false;
</script>

<BranchCards
  {active}
  {progress}
  {anchor}
  {materialized}
  leftTitle="Tech Stack"
  leftLines={[
    'Languages: Java, Python, C, JavaScript, TypeScript.',
    'Frameworks: React, FastAPI, Astro, Svelte, Three.js, Flask.',
    'Cloud and tooling: PostgreSQL, AWS, Docker, GitHub Actions.'
  ]}
  rightTitle="Connect"
  rightLines={[
    'LinkedIn: jaelan-cruz',
    'GitHub: mxta-o',
    'Discord: .ehlan',
    'Email: jaelancruz@yahoo.com'
  ]}
  leftStyle="left: clamp(1rem, 3vw, 2rem); top: clamp(10vh, 14vh, 18vh);"
  rightStyle="right: clamp(1rem, 3vw, 2rem); top: clamp(56vh, 60vh, 65vh);"
  leftWidth="clamp(20rem, 34vw, 35rem)"
  rightWidth="clamp(20rem, 30vw, 30rem)"
/>
