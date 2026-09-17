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
    'Internship · Dec 2025 to Jul 2026',
    '• Developed and shipped production-ready frontend features using React and TypeScript, enhancing usability and performance.',
    '• Collaborated with engineers and product stakeholders to transform product concepts into polished user experiences.',
    '• Resolved user authentication issues related to AWS Cognito, ensuring a seamless user experience.',
    '• Integrated RESTful services with Python (FastAPI) and PostgreSQL to support user profile workflows.'
  ]}
  rightTitle="Trajectory"
  rightLines={[
    'Current focus:',
    '• skill refinery in backend and cloud dev',
    '• challenging projects',
    '• exploring other domains of software engineering',
    'More work coming soon.. (hopefully T_T)'
  ]}
  leftStyle={EXPERIENCE_LEFT_STYLE}
  rightStyle={EXPERIENCE_RIGHT_STYLE}
  leftWidth="clamp(22rem, 34vw, 36rem)"
  rightWidth="clamp(18rem, 28vw, 26rem)"
/>
