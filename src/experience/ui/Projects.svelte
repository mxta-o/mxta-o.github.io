<script lang="ts">
  import BranchCards from './BranchCards.svelte';
  import type { UIAnchor } from './types';

  export let active = false;
  export let progress = 0;
  export let anchor: UIAnchor;
  export let materialized = false;

  // Position controls: tweak these constants to move the header and body cards.
  const PROJECTS_HEADER_STYLE = 'right: clamp(4rem, 10vw, 6rem); top: clamp(6rem, 8vh, 7rem);';
  const PROJECTS_LEFT_STYLE = 'left: clamp(1rem, 3vw, 2rem); top: clamp(12vh, 14vh, 16vh);';
  const PROJECTS_RIGHT_STYLE = 'right: clamp(calc(1rem - 12px), calc(4vw - 8px), calc(2.4rem - 8px)); top: clamp(calc(30vh - 8px), calc(38vh - 8px), calc(48vh - 8px));';
  const PROJECTS_LEFT_STYLE_2 = 'left: clamp(1rem, 3vw, 2rem); top: clamp(54vh, 58vh, 60vh);';
  const PROJECTS_RIGHT_STYLE_2 = 'right: clamp(1rem, 4vw, 2.4rem); top: clamp(64vh, 68vh, 72vh);';
</script>

<BranchCards
  {active}
  {progress}
  {anchor}
  {materialized}
  compact
  headerTitle="Projects"
  headerStyle={PROJECTS_HEADER_STYLE}
  headerWidth="clamp(14rem, 24vw, 24rem)"
  headerFloatAmplitude={2.6}
  leftTitle="See this portfolio's repo here :)"
  leftLines={[
    '✓ Modular checkpoint-driven 3D experience with reusable scene systems.',
    '✓ Galaxy renders 25,000+ particles plus a 1,800-star field in one buffer.',
    '✓ GSAP timelines and AudioManager sync animations and SFX across six checkpoints.',
    '✓ Optimized runtime with chunked buffer updates and depth-based tuning.'
  ]}
  rightTitle="jamSpace"
  rightLines={[
    '✓ Flask productivity suite with five integrated apps across two blueprints.',
    '✓ Time-block planner with monthly/weekly views and AJAX navigation.',
    '✓ JSON-backed CRUD with Pomodoro stats, streak tracking, and speech alerts.'
  ]}
  leftHref="https://github.com/mxta-o/mxta-o.github.io"
  rightHref="https://github.com/mxta-o/jamSpace"
  leftStyle={PROJECTS_LEFT_STYLE}
  rightStyle={PROJECTS_RIGHT_STYLE}
  leftWidth="clamp(18rem, 30vw, 30rem)"
  rightWidth="clamp(18rem, 30vw, 30rem)"
/>

<BranchCards
  {active}
  {progress}
  {anchor}
  {materialized}
  showAnchor={false}
  compact
  leftTitle="exposr"
  leftLines={[
    '✓ Full-stack photo app with weekly reveal scheduling and polling.',
    '✓ Secure upload pipeline with size caps, EXIF freshness, and JWT auth.',
    '✓ Python image processor for 600x600 grain/light-leak/vignette effects.'
  ]}
  rightTitle="Legends of Sword and Wand"
  rightLines={[
    '✓ 8-module Spring Boot monorepo with six deployable services.',
    '✓ CI/CD with unit and Docker Compose smoke tests plus Buildx matrix.',
    '✓ Containerized stack with per-service Dockerfiles and top-level Compose.'
  ]}
  leftHref="https://github.com/mxta-o/exposr"
  rightHref="https://github.com/mxta-o/lsw-online"
  leftStyle={PROJECTS_LEFT_STYLE_2}
  rightStyle={PROJECTS_RIGHT_STYLE_2}
  leftWidth="clamp(18rem, 30vw, 30rem)"
  rightWidth="clamp(18rem, 30vw, 30rem)"
/>
