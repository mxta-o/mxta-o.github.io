<script lang="ts">
  import { onMount } from 'svelte';
  import BranchCards from './BranchCards.svelte';
  import type { UIAnchor } from './types';

  export let active = false;
  export let progress = 0;
  export let anchor: UIAnchor;
  export let materialized = false;

  // Four cards can't fit one phone screen, so mobile shows them two at a time.
  // 0.46 splits the parent's [0.1, 0.82] content window into equal halves.
  const PAGE_SPLIT = 0.46;

  let isMobile = false;

  onMount(() => {
    const query = window.matchMedia('(max-width: 900px)');
    const sync = () => (isMobile = query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  });

  $: pageOneActive = active && (!isMobile || progress < PAGE_SPLIT);
  $: pageTwoActive = active && (!isMobile || progress >= PAGE_SPLIT);

  // Position controls: tweak these constants to move the header and body cards.
  const PROJECTS_HEADER_STYLE = 'right: clamp(4rem, 10vw, 6rem); top: clamp(6rem, 8vh, 7rem);';
  const PROJECTS_LEFT_STYLE = 'left: clamp(1rem, 3vw, 2rem); top: clamp(12vh, 14vh, 16vh);';
  const PROJECTS_RIGHT_STYLE = 'right: clamp(calc(1rem - 12px), calc(4vw - 8px), calc(2.4rem - 8px)); top: clamp(calc(30vh - 8px), calc(38vh - 8px), calc(48vh - 8px));';
  const PROJECTS_LEFT_STYLE_2 = 'left: clamp(1rem, 3vw, 2rem); top: clamp(54vh, 58vh, 60vh);';
  const PROJECTS_RIGHT_STYLE_2 = 'right: clamp(1rem, 4vw, 2.4rem); top: clamp(64vh, 68vh, 72vh);';
</script>

<BranchCards
  active={pageOneActive}
  {progress}
  {anchor}
  {materialized}
  showAnchor={!isMobile}
  compact
  headerTitle="Projects"
  headerStyle={PROJECTS_HEADER_STYLE}
  headerWidth="clamp(14rem, 24vw, 24rem)"
  headerFloatAmplitude={2.6}
  leftTitle="See this portfolio's repo here :)"
  leftLines={[
    '✓ An interactive 3D portfolio you scroll through like a little universe.',
    '✓ Animated transitions and sound effects guide you between sections.'
  ]}
  leftTags={['Three.js', 'Svelte', 'Astro', 'GSAP']}
  rightTitle="jamSpace"
  rightLines={[
    '✓ An all-in-one productivity app — planner, to-do list, and focus timer in one place.',
    '✓ Drag-and-drop weekly calendar with built-in Pomodoro tracking and voice alerts.'
  ]}
  rightTags={['Flask', 'JavaScript', 'JSON storage']}
  leftHref="https://github.com/mxta-o/mxta-o.github.io"
  rightHref="https://github.com/mxta-o/jamSpace"
  leftStyle={PROJECTS_LEFT_STYLE}
  rightStyle={PROJECTS_RIGHT_STYLE}
  leftWidth="clamp(18rem, 30vw, 30rem)"
  rightWidth="clamp(18rem, 30vw, 30rem)"
/>

<BranchCards
  active={pageTwoActive}
  {progress}
  {anchor}
  {materialized}
  showAnchor={false}
  compact
  leftTitle="exposr"
  leftLines={[
    '✓ A private photo-sharing app where new pictures unlock once a week.',
    '✓ Automatic film-style effects, plus secure, protected uploads.'
  ]}
  leftTags={['Python', 'JWT Auth', 'REST API']}
  rightTitle="Legends of Sword and Wand"
  rightLines={[
    '✓ A fantasy game platform built from several connected backend services.',
    '✓ Automatically tested and containerized for reliable deployment.'
  ]}
  rightTags={['Spring Boot', 'Docker', 'CI/CD']}
  leftHref="https://github.com/mxta-o/exposr"
  rightHref="https://github.com/mxta-o/lsw-online"
  leftStyle={PROJECTS_LEFT_STYLE_2}
  rightStyle={PROJECTS_RIGHT_STYLE_2}
  leftWidth="clamp(18rem, 30vw, 30rem)"
  rightWidth="clamp(18rem, 30vw, 30rem)"
/>
