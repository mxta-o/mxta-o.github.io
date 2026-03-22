<script lang="ts">
  import BranchCards from './BranchCards.svelte';
  import type { UIAnchor } from './types';

  export let active = false;
  export let progress = 0;
  export let anchor: UIAnchor;
  export let materialized = false;

  // Position controls: tweak these constants to move the header and body cards.
  
  const EXPERIENCE_HEADER_STYLE = 'right: clamp(5rem, 12vw, 8rem); top: clamp(6rem, 10vh, 8rem);';
  const EXPERIENCE_LEFT_STYLE = 'left: clamp(1rem, 2.8vw, 2rem); top: clamp(8rem, 12vh, 10rem);';
  const EXPERIENCE_RIGHT_STYLE = 'right: clamp(1rem, 4vw, 2.4rem); top: clamp(56vh, 60vh, 66vh);';
</script>

<BranchCards
  {active}
  {progress}
  {anchor}
  {materialized}
  headerTitle="Work"
  headerStyle={EXPERIENCE_HEADER_STYLE}
  headerWidth="clamp(14rem, 12vw, 12rem)"
  headerFloatAmplitude={4}
  leftTitle="Fullstack Engineer @ Circe"
  leftLines={[
    'Contract Part-Time · Dec 2025 to Present',
    '• Collaborated with 6 plus contributors on a production-grade React Native app.',
    '• Built and hardened profile and preferences APIs with FastAPI and PostgreSQL.',
    '• Implemented 5 login and sign-up flows with realtime validation and error handling.',
    '• Refactored user-facing features across 15+ files to improve maintainability.'
  ]}
  rightTitle="Trajectory"
  rightLines={[
    'Current focus:',
    '• skill refinery in AWS and cloud development',
    '• more backend heavy projects',
    '• transforming unstable flows into maintainable systems',
    'More work coming soon.. (hopefully)'
  ]}
  leftStyle={EXPERIENCE_LEFT_STYLE}
  rightStyle={EXPERIENCE_RIGHT_STYLE}
  leftWidth="clamp(22rem, 34vw, 36rem)"
  rightWidth="clamp(18rem, 28vw, 26rem)"
/>
