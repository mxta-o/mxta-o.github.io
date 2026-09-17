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
    "I'm a third year student studying computer science @YorkU in Toronto ᕙ(  •̀ ᗜ •́  )ᕗ ",
    "mainly experienced in full-stack dev, but I'm currently expanding towards different domains.",
    "outside of SWE, i wind down by tending to my hobbies, whether its gymming, gaming, or playing piano",
    "that also includes listening to a loooot.. of music, and playing with my dog ( ᐛ )و"
  ]}
  rightTitle="Technical Mastery"
  rightProgress={[
    { label: 'Frontend Mastery', value: 75 },
    { label: 'Backend Mastery', value: 78 },
    { label: 'Caffeine Consumption', value: 98 }
  ]}
  leftStyle={ABOUT_LEFT_STYLE}
  rightStyle={ABOUT_RIGHT_STYLE}
  leftWidth="clamp(22rem, 43vw, 42rem)"
  rightWidth="clamp(22rem, 43vw, 42rem)"
/>
