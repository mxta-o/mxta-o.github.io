<script lang="ts">
  import BranchCards from './BranchCards.svelte';
  import type { UIAnchor } from './types';

  export let active = false;
  export let progress = 0;
  export let anchor: UIAnchor;
  export let materialized = false;

  // Position controls: tweak these constants to move the header and body cards.
  const ABOUT_LEFT_STYLE = 'left: clamp(1rem, 3vw, 2rem); top: clamp(7rem, 5vh, 2.4rem);';
  const ABOUT_RIGHT_STYLE = 'left: clamp(9rem, 3vw, 2rem); top: clamp(60vh, 54vh, 60vh);';
</script>

<BranchCards
  {active}
  {progress}
  {anchor}
  {materialized}
  leftTitle="Overview"
  leftLines={[
    "Based in Toronto, I'm a second year university student majoring in computer science.",
    "I specialize in full-stack development, with current practice and scope focused on cloud-native architecture and AWS.",
    "Fueled by my love for code and caffeine, I build, break, and debug modern apps.. sometimes all in one sitting.."
  ]}
  rightTitle="Technical Mastery"
  rightProgress={[
    { label: 'Frontend Mastery', value: 82 },
    { label: 'Backend Mastery', value: 67 },
    { label: 'Caffeine Consumption', value: 98 }
  ]}
  leftStyle={ABOUT_LEFT_STYLE}
  rightStyle={ABOUT_RIGHT_STYLE}
  leftWidth="clamp(22rem, 43vw, 42rem)"
  rightWidth="clamp(22rem, 43vw, 42rem)"
/>
