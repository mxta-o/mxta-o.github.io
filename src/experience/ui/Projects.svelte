<script lang="ts">
  import BranchCards from './BranchCards.svelte';
  import type { UIAnchor } from './types';

  export let active = false;
  export let progress = 0;
  export let anchor: UIAnchor;
  export let materialized = false;

  // Position controls: tweak these constants to move the header and body cards.
  const PROJECTS_HEADER_STYLE = 'right: clamp(5rem, 3vw, 2rem); top: clamp(8rem, 7vh, 3.8rem);';
  const PROJECTS_LEFT_STYLE = 'left: clamp(1rem, 3vw, 2rem); top: clamp(18vh, 7vh, 5.4rem);';
  const PROJECTS_RIGHT_STYLE = 'right: clamp(1rem, 3vw, 2rem); top: clamp(60vh, 62vh, 68vh);';
</script>

<BranchCards
  {active}
  {progress}
  {anchor}
  {materialized}
  headerTitle="Projects"
  headerStyle={PROJECTS_HEADER_STYLE}
  headerWidth="clamp(14rem, 24vw, 24rem)"
  headerFloatAmplitude={2.6}
  leftTitle="jamSpace"
  leftLines={[
    '✓ Flask productivity platform with modular blueprint architecture.',
    '✓ Refactored 600+ lines of calendar logic into a unified planner.',
    '✓ Removed 1000+ lines of obsolete code through cleanup and reorganization.',
    '✓ Enhanced UX with 500+ lines of custom CSS and JavaScript.'
  ]}
  rightTitle="PixelCraft"
  rightLines={[
    '✓ Java image processing tool with 8+ transformation filters.',
    '✓ Reflection-based architecture for dynamic filter extension.',
    '✓ Command-line and Bash automation for high-volume batch workflows.'
  ]}
  leftHref="https://github.com/mxta-o/jamSpace"
  rightHref="https://github.com/KishanJayakumar/PixelCraft"
  leftStyle={PROJECTS_LEFT_STYLE}
  rightStyle={PROJECTS_RIGHT_STYLE}
  leftWidth="clamp(21rem, 34vw, 36rem)"
  rightWidth="clamp(21rem, 34vw, 36rem)"
/>
