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
  leftTitle="Fullstack Engineer at Circe"
  leftLines={[
    'Contract Part-Time · Dec 2025 to Present',
    'Collaborated with 6 plus contributors on a production React Native app.',
    'Built and hardened profile and preferences APIs with FastAPI and PostgreSQL.',
    'Implemented 5 login and sign-up flows with realtime validation and error handling.',
    'Refactored user-facing features across 8 plus files to improve maintainability.'
  ]}
  rightTitle="Trajectory"
  rightLines={[
    'Current focus: reliable full-stack delivery with clean architecture.',
    'Strength: transforming unstable flows into maintainable systems.',
    'Building toward cloud-native, production-scale engineering.'
  ]}
  leftStyle="left: clamp(1rem, 2.8vw, 2rem); top: clamp(1.2rem, 8vh, 4rem);"
  rightStyle="right: clamp(1rem, 4vw, 2.4rem); top: clamp(56vh, 60vh, 66vh);"
  leftWidth="clamp(22rem, 34vw, 36rem)"
  rightWidth="clamp(18rem, 28vw, 26rem)"
/>
