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
  leftTitle="About"
  leftLines={[
    "Based in Toronto, I'm a computer science major specializing in full stack and cloud development.",
    "Fueled by systems thinking and caffeine, I build, break, and debug modern apps.",
    "BASc Computer Science at York University, expected April 2028."
  ]}
  rightTitle="Quick Stats"
  rightLines={[
    '106 GitHub contributions in the last 12 months',
    '67 plus tabs open at all times',
    '89 cans of Monster consumed',
    '12 unfinished projects in the backlog'
  ]}
  leftStyle="left: clamp(1rem, 3vw, 2rem); top: clamp(1.1rem, 5vh, 2.4rem);"
  rightStyle="left: clamp(1rem, 3vw, 2rem); top: clamp(53vh, 54vh, 60vh);"
  leftWidth="clamp(22rem, 43vw, 42rem)"
  rightWidth="clamp(22rem, 43vw, 42rem)"
/>
