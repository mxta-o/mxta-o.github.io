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
  leftTitle="jamSpace"
  leftLines={[
    'Flask productivity platform with modular blueprint architecture.',
    'Refactored 600 plus lines of calendar logic into a unified planner.',
    'Removed 1000 plus lines of obsolete code through cleanup and reorganization.',
    'Enhanced UX with 300 plus lines of custom CSS and JavaScript.'
  ]}
  rightTitle="PixelCraft"
  rightLines={[
    'Java image processing tool with 8 plus transformation filters.',
    'Reflection-based architecture for dynamic filter extension.',
    'Command-line and Bash automation for high-volume batch workflows.'
  ]}
  leftStyle="left: clamp(1rem, 3vw, 2rem); top: clamp(3vh, 7vh, 5.4rem);"
  rightStyle="right: clamp(1rem, 3vw, 2rem); top: clamp(60vh, 62vh, 68vh);"
  leftWidth="clamp(21rem, 34vw, 36rem)"
  rightWidth="clamp(21rem, 34vw, 36rem)"
/>
