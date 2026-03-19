<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import * as THREE from 'three';
  import { createGalaxy, type GalaxyController } from './scene/galaxy';
  import { createPortfolioCamera, updateCameraFromProgress } from './scene/camera';
  import { createRenderer, resizeRenderer } from './scene/renderer';
  import { create as createAboutIcon } from './scene/icons/aboutIcon';
  import { create as createExperienceIcon } from './scene/icons/experienceIcon';
  import { create as createProjectsIcon } from './scene/icons/projectsIcon';
  import { create as createVisionIcon } from './scene/icons/visionIcon';
  import { create as createContactIcon } from './scene/icons/contactIcon';
  import type { IconController } from './scene/icons/iconCore';
  import { ScrollController } from './systems/scrollController';
  import { CheckpointSystem, type CheckpointId } from './systems/checkpointSystem';
  import Intro from './ui/Intro.svelte';
  import About from './ui/About.svelte';
  import ExperienceSection from './ui/ExperienceSection.svelte';
  import Projects from './ui/Projects.svelte';
  import Vision from './ui/Vision.svelte';
  import Contact from './ui/Contact.svelte';
  import { HIDDEN_ANCHOR, type UIAnchor } from './ui/types';

  const SECTION_ORDER: CheckpointId[] = ['intro', 'about', 'experience', 'projects', 'vision', 'contact'];

  const CHECKPOINT_ANCHORS: Record<CheckpointId, THREE.Vector3> = {
    intro: new THREE.Vector3(-7.5, 8.2, 52),
    about: new THREE.Vector3(10.8, 4.4, 24),
    experience: new THREE.Vector3(2.2, 3.7, -3),
    projects: new THREE.Vector3(10, 4.2, -34),
    vision: new THREE.Vector3(35, 8.2, -29),
    contact: new THREE.Vector3(0, 17.2, 0.9)
  };

  const GALAXY_CENTER = new THREE.Vector3(10.5, 0, 0);

  let canvas: HTMLCanvasElement | null = null;
  let activeSection: CheckpointId = 'intro';
  let sectionProgress = 0;
  let lookActive = false;

  let introMaskOpacity = 1;
  let uiAnchors: Record<CheckpointId, UIAnchor> = {
    intro: HIDDEN_ANCHOR,
    about: HIDDEN_ANCHOR,
    experience: HIDDEN_ANCHOR,
    projects: HIDDEN_ANCHOR,
    vision: HIDDEN_ANCHOR,
    contact: HIDDEN_ANCHOR
  };

  let clusterReady: Record<CheckpointId, boolean> = {
    intro: true,
    about: false,
    experience: false,
    projects: false,
    vision: false,
    contact: false
  };

  const projectToScreen = (camera: THREE.PerspectiveCamera, worldPoint: THREE.Vector3): UIAnchor => {
    const projected = worldPoint.clone().project(camera);
    const inView = projected.z > -1.2 && projected.z < 1.1;

    if (!inView) {
      return { ...HIDDEN_ANCHOR };
    }

    const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
    const distance = camera.position.distanceTo(worldPoint);
    const scale = THREE.MathUtils.clamp(1.04 - distance / 74, 0.36, 0.92);
    const opacity = THREE.MathUtils.clamp(1 - Math.max(0, projected.z) * 0.86, 0.3, 1);

    return {
      x,
      y,
      scale,
      opacity,
      visible: true
    };
  };

  onMount(() => {
    if (!canvas) return;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#01030b', 42, 200);

    const camera = createPortfolioCamera(window.innerWidth / window.innerHeight);
    const renderer = createRenderer(canvas);

    const galaxy: GalaxyController = createGalaxy({ particleCount: 50000 });
    scene.add(galaxy.points);
    galaxy.points.position.x = 10.5;

    const galaxyMaterial = galaxy.points.material as THREE.PointsMaterial;
    galaxyMaterial.opacity = 0;

    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 1800;
    const starsPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i += 1) {
      const i3 = i * 3;
      const radius = THREE.MathUtils.randFloat(120, 220);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
      starsPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      starsPositions[i3 + 1] = radius * Math.cos(phi);
      starsPositions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: '#9cb8ff',
      size: 0.2,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const starsBasePositions = starsPositions.slice();
    const starsAttr = starsGeometry.getAttribute('position') as THREE.BufferAttribute;
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    const ambient = new THREE.AmbientLight('#9fb8ff', 0.28);
    const pointA = new THREE.PointLight('#ffb870', 2, 180);
    pointA.position.set(0, 8, 30);
    const pointB = new THREE.PointLight('#6ca2ff', 1.3, 220);
    pointB.position.set(-16, -4, 90);
    scene.add(ambient, pointA, pointB);

    const iconColors = {
      inner: '#ffcc90',
      outer: '#87b6ff'
    };

    const icons: Record<CheckpointId, IconController | null> = {
      intro: null,
      about: createAboutIcon(CHECKPOINT_ANCHORS.about, iconColors),
      experience: createExperienceIcon(CHECKPOINT_ANCHORS.experience, iconColors),
      projects: createProjectsIcon(CHECKPOINT_ANCHORS.projects, iconColors),
      vision: createVisionIcon(CHECKPOINT_ANCHORS.vision, iconColors),
      contact: createContactIcon(CHECKPOINT_ANCHORS.contact, iconColors)
    };

    SECTION_ORDER.forEach((id) => {
      if (icons[id]) {
        scene.add(icons[id].points);
      }
    });

    const scroll = new ScrollController();
    const checkpoints = new CheckpointSystem();
    scroll.mount();

    let pointerTarget = { x: 0, y: 0 };
    let pointerSmooth = { x: 0, y: 0 };

    const introState = {
      mask: 1,
      arrival: 1,
      reveal: 0
    };

    const introTimeline = gsap
      .timeline()
      .to(introState, {
        mask: 0,
        duration: 1.35,
        ease: 'power2.inOut',
        onUpdate: () => {
          introMaskOpacity = introState.mask;
        }
      })
      .to(
        introState,
        {
          reveal: 1,
          duration: 2.2,
          ease: 'power2.out',
          onUpdate: () => {
            galaxyMaterial.opacity = 0.9 * introState.reveal;
            starsMaterial.opacity = 0.75 * introState.reveal;
          }
        },
        0.12
      )
      .to(
        introState,
        {
          arrival: 0,
          duration: 2.8,
          ease: 'power3.out'
        },
        0.3
      );

    const getNextSection = (id: CheckpointId): CheckpointId | null => {
      const index = SECTION_ORDER.indexOf(id);
      if (index < 0 || index === SECTION_ORDER.length - 1) return null;
      return SECTION_ORDER[index + 1];
    };

    const getFocusWeight = (id: CheckpointId, current: CheckpointId, currentProgress: number) => {
      if (id === current) {
        return THREE.MathUtils.lerp(0.72, 1, currentProgress);
      }

      const next = getNextSection(current);
      if (next && id === next) {
        return THREE.MathUtils.clamp((currentProgress - 0.9) / 0.1, 0, 1) * 0.24;
      }

      return 0.04;
    };

    const onPointerMove = (event: MouseEvent) => {
      if (!lookActive) return;
      pointerTarget.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerTarget.y = (event.clientY / window.innerHeight - 0.5) * -2;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      lookActive = true;
    };

    const onPointerUp = () => {
      lookActive = false;
      pointerTarget.x = 0;
      pointerTarget.y = 0;
    };

    const onResize = () => resizeRenderer(renderer, camera);

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('blur', onPointerUp);
    window.addEventListener('resize', onResize);

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (time: number) => {
      const deltaSeconds = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;

      scroll.update(deltaSeconds);

      checkpoints.update(scroll.progress, (current, previous) => {
        activeSection = current;

        const previousIcon = icons[previous];
        if (previousIcon) {
          previousIcon.animateOut();
        }

        const currentIcon = icons[current];
        if (currentIcon) {
          currentIcon.animateIn();
        }

        window.dispatchEvent(
          new CustomEvent('experience:section-exit', {
            detail: {
              id: previous,
              to: current
            }
          })
        );

        window.dispatchEvent(
          new CustomEvent('experience:section-enter', {
            detail: {
              id: current,
              from: previous
            }
          })
        );
      });

      sectionProgress = checkpoints.getSectionProgress(scroll.progress, activeSection);

      pointerSmooth.x = THREE.MathUtils.lerp(pointerSmooth.x, pointerTarget.x, 0.07);
      pointerSmooth.y = THREE.MathUtils.lerp(pointerSmooth.y, pointerTarget.y, 0.07);

      updateCameraFromProgress(
        camera,
        scroll.progress,
        pointerSmooth,
        activeSection,
        sectionProgress,
        GALAXY_CENTER
      );

      if (introState.arrival > 0.001) {
        camera.position.z += 34 * introState.arrival;
        camera.position.y += 5.2 * introState.arrival;
      }

      camera.position.x += Math.sin(time * 0.00045) * 0.22;
      camera.position.y += Math.cos(time * 0.00038) * 0.16;

      const nextClusterReady = { ...clusterReady };
      SECTION_ORDER.forEach((id) => {
        const icon = icons[id];

        if (!icon) {
          nextClusterReady[id] = id === 'intro';
          return;
        }

        const iconProgress = id === activeSection ? sectionProgress : 0;
        icon.update(iconProgress);
        nextClusterReady[id] = icon.isMaterialized();
      });

      const introLikeVision = activeSection === 'vision';
      const visionRenderBlend = introLikeVision
        ? THREE.MathUtils.smoothstep(sectionProgress, 0.08, 0.34) *
          (1 - THREE.MathUtils.smoothstep(sectionProgress, 0.82, 1))
        : 0;

      scene.fog.near = THREE.MathUtils.lerp(42, 55, visionRenderBlend);
      scene.fog.far = THREE.MathUtils.lerp(200, 235, visionRenderBlend);
      starsMaterial.size = THREE.MathUtils.lerp(0.2, 0.24, visionRenderBlend);
      galaxyMaterial.size = THREE.MathUtils.lerp(0.042, 0.047, visionRenderBlend);

      const activeAnchor =
        activeSection === 'projects' || activeSection === 'vision' || activeSection === 'contact'
          ? GALAXY_CENTER
          : CHECKPOINT_ANCHORS[activeSection];
      const disableSectionPull = activeSection === 'intro' || activeSection === 'vision' || activeSection === 'contact';
      const starPull = disableSectionPull ? 0 : 0.8 + sectionProgress * 2.6;
      for (let i = 0; i < starsCount; i += 1) {
        const i3 = i * 3;

        const bx = starsBasePositions[i3];
        const by = starsBasePositions[i3 + 1];
        const bz = starsBasePositions[i3 + 2];

        const dx = activeAnchor.x - bx;
        const dy = activeAnchor.y - by;
        const dz = activeAnchor.z - bz;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), 0.001);
        const falloff = THREE.MathUtils.clamp(1 - dist / 170, 0, 1);

        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;

        const wave = Math.sin(time * 0.00042 + i * 0.13) * 0.46;
        const tx = bx + nx * starPull * falloff * 8 + wave * falloff;
        const ty = by + ny * starPull * falloff * 8 + Math.cos(time * 0.00038 + i * 0.09) * falloff * 0.26;
        const tz = bz + nz * starPull * falloff * 8 - wave * falloff;

        starsPositions[i3] = THREE.MathUtils.lerp(starsPositions[i3], tx, 0.028);
        starsPositions[i3 + 1] = THREE.MathUtils.lerp(starsPositions[i3 + 1], ty, 0.028);
        starsPositions[i3 + 2] = THREE.MathUtils.lerp(starsPositions[i3 + 2], tz, 0.028);
      }
      starsAttr.needsUpdate = true;

      const twinkle = 0.58 + Math.sin(time * 0.0023) * 0.18;
      starsMaterial.opacity = (0.34 + twinkle * 0.45) * introState.reveal;

      const projectedAnchors = { ...uiAnchors };
      SECTION_ORDER.forEach((id) => {
        const base = projectToScreen(camera, CHECKPOINT_ANCHORS[id]);
        const focusWeight = getFocusWeight(id, activeSection, sectionProgress);

        if (!base.visible || focusWeight < 0.05) {
          projectedAnchors[id] = HIDDEN_ANCHOR;
          return;
        }

        projectedAnchors[id] = {
          ...base,
          opacity: base.opacity * THREE.MathUtils.lerp(0.16, 1, focusWeight),
          scale: base.scale * THREE.MathUtils.lerp(0.72, 1.04, focusWeight),
          visible: true
        };
      });

      const visibilityBoundReady = { ...nextClusterReady };
      if (!projectedAnchors.about.visible) {
        visibilityBoundReady.about = false;
      }
      if (!projectedAnchors.experience.visible) {
        visibilityBoundReady.experience = false;
      }

      clusterReady = visibilityBoundReady;
      uiAnchors = projectedAnchors;

      galaxy.update(deltaSeconds);
      renderer.render(scene, camera);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      introTimeline.kill();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('blur', onPointerUp);
      window.removeEventListener('resize', onResize);

      scroll.unmount();

      SECTION_ORDER.forEach((id) => {
        const icon = icons[id];
        if (icon) {
          scene.remove(icon.points);
          icon.dispose();
        }
      });

      scene.remove(stars);
      starsGeometry.dispose();
      starsMaterial.dispose();

      galaxy.dispose();
      scene.remove(galaxy.points);

      renderer.dispose();
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  });
</script>

<div class="experience-root">
  <canvas bind:this={canvas} class="experience-canvas" class:look-active={lookActive} aria-hidden="true"></canvas>

  <div class="ui-layer">
    <Intro
      active={activeSection === 'intro'}
      progress={sectionProgress}
      anchor={uiAnchors.intro}
      materialized={true}
    />
    <About
      active={activeSection === 'about'}
      progress={sectionProgress}
      anchor={uiAnchors.about}
      materialized={clusterReady.about}
    />
    <ExperienceSection
      active={activeSection === 'experience'}
      progress={sectionProgress}
      anchor={uiAnchors.experience}
      materialized={clusterReady.experience}
    />
    <Projects
      active={activeSection === 'projects'}
      progress={sectionProgress}
      anchor={uiAnchors.projects}
      materialized={clusterReady.projects}
    />
    <Vision
      active={activeSection === 'vision'}
      progress={sectionProgress}
      anchor={uiAnchors.vision}
      materialized={clusterReady.vision}
    />
    <Contact
      active={activeSection === 'contact'}
      progress={sectionProgress}
      anchor={uiAnchors.contact}
      materialized={clusterReady.contact}
    />
  </div>

  <div class="intro-mask" style={`opacity:${introMaskOpacity}`}></div>
</div>

<style>
  .experience-root {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(circle at 50% 45%, #0a1030 0%, #02030a 55%, #000 100%);
    overflow: hidden;
  }

  .experience-canvas {
    width: 100%;
    height: 100%;
    display: block;
    cursor: grab;
  }

  .experience-canvas.look-active {
    cursor: grabbing;
  }

  .ui-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 3;
  }

  .intro-mask {
    position: absolute;
    inset: 0;
    background: #000;
    pointer-events: none;
    z-index: 5;
  }
</style>
