<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
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
  import Work from './ui/Work.svelte';
  import Projects from './ui/Projects.svelte';
  import Vision from './ui/Vision.svelte';
  import Contact from './ui/Contact.svelte';
  import LinkConfirm from './ui/LinkConfirm.svelte';
  import { scrollSettling } from './ui/scrollMotion';
  import { HIDDEN_ANCHOR, type UIAnchor } from './ui/types';
  import { AudioManager } from '../lib/audio';

  const SECTION_ORDER: CheckpointId[] = ['intro', 'about', 'experience', 'projects', 'vision', 'contact'];

  const CHECKPOINT_ANCHORS: Record<CheckpointId, THREE.Vector3> = {
    intro: new THREE.Vector3(-14, 3, 26),
    about: new THREE.Vector3(10.8, 4.4, 24),
    experience: new THREE.Vector3(3.5, 4.5, -20),
    projects: new THREE.Vector3(8, 4.2, -34),
    vision: new THREE.Vector3(1, 12, -67),
    contact: new THREE.Vector3(0, 17.2, 0.9)
  };

  const GALAXY_CENTER = new THREE.Vector3(10.5, 0, 0);
  const NAV_ITEMS: Array<{
    id: string;
    label: string;
    section: CheckpointId;
    sectionProgress: number;
  }> = [
    { id: 'home', label: 'home', section: 'intro', sectionProgress: 0 },
    { id: 'about', label: 'about', section: 'about', sectionProgress: 0.322 },
    { id: 'work', label: 'work', section: 'experience', sectionProgress: 0.215 },
    { id: 'projects', label: 'projects', section: 'projects', sectionProgress: 0.238 },
    { id: 'vision', label: 'vision', section: 'vision', sectionProgress: 0.316 },
    { id: 'contact', label: 'contact', section: 'contact', sectionProgress: 1 }
  ];

  const checkpointSystem = new CheckpointSystem();

  let canvas: HTMLCanvasElement | null = null;
  let activeSection: CheckpointId = 'intro';
  let sectionProgress = 0;
  let lookActive = false;
  let showDebugHud = false;
  let showSettings = false;
  const AUDIO_ASSETS = {
    ambience: '/audio/ambience.mp3',
    cardRender: '/audio/card-render.mp3'
  };
  let ambienceVolume = 0.35;
  let sfxVolume = 0.7;
  const AUDIO_STORAGE_KEYS = {
    ambienceVolume: 'experience.audio.ambienceVolume',
    sfxVolume: 'experience.audio.sfxVolume'
  } as const;
  let galaxyInnerColor = '#ffb870';
  let galaxyOuterColor = '#6ca2ff';
  let innerInput = galaxyInnerColor;
  let outerInput = galaxyOuterColor;
  const CONTENT_ENTRY = 0.1;
  const CONTENT_EXIT = 0.82;
  const ABOUT_CONTENT_EXIT = 0.463;
  const EXPERIENCE_CONTENT_EXIT = 0.563;

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

  let contentActive: Record<CheckpointId, boolean> = {
    intro: true,
    about: false,
    experience: false,
    projects: false,
    vision: false,
    contact: false
  };
  let previousContentActive: Record<CheckpointId, boolean> = {
    intro: true,
    about: false,
    experience: false,
    projects: false,
    vision: false,
    contact: false
  };

  let scrollController: ScrollController | null = null;
  let galaxyController: GalaxyController | null = null;
  let iconControllers: Record<CheckpointId, IconController | null> = {
    intro: null,
    about: null,
    experience: null,
    projects: null,
    vision: null,
    contact: null
  };

  // Whether the user has entered the site (cleared overlay). Controls UI render timing.
  let siteEntered = false;

  const isValidHex = (value: string) => /^#([0-9a-fA-F]{6})$/.test(value);

  const navigateTo = (section: CheckpointId, sectionTarget = 0.5) => {
    const target = checkpointSystem.getProgressAtSection(section, sectionTarget);
    scrollController?.setProgress(target);
  };

  const applyParticleColors = () => {
    galaxyController?.setColors(galaxyInnerColor, galaxyOuterColor);
    SECTION_ORDER.forEach((id) => {
      const icon = iconControllers[id];
      if (!icon) return;
      icon.setColors({
        inner: galaxyInnerColor,
        outer: galaxyOuterColor
      });
    });
  };

  const commitColor = (kind: 'inner' | 'outer', value: string) => {
    if (!isValidHex(value)) return;
    if (kind === 'inner') {
      galaxyInnerColor = value;
      innerInput = value;
    } else {
      galaxyOuterColor = value;
      outerInput = value;
    }
    applyParticleColors();
  };

  const handleInnerColorInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement | null;
    if (!target) return;
    commitColor('inner', target.value);
  };

  const handleOuterColorInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement | null;
    if (!target) return;
    commitColor('outer', target.value);
  };

  const clampVolume = (value: number) => THREE.MathUtils.clamp(value, 0, 1);

  const parseStoredVolume = (value: string | null, fallback: number) => {
    if (value === null) return fallback;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return fallback;
    return clampVolume(parsed);
  };

  const persistAudioSettings = () => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(AUDIO_STORAGE_KEYS.ambienceVolume, ambienceVolume.toString());
    localStorage.setItem(AUDIO_STORAGE_KEYS.sfxVolume, sfxVolume.toString());
  };

  const setSfxVolume = (value: number) => {
    sfxVolume = clampVolume(value);
    AudioManager.setSfxVolume(sfxVolume);
    persistAudioSettings();
  };

  const setAmbienceVolume = (value: number) => {
    ambienceVolume = clampVolume(value);
    AudioManager.setAmbienceVolume(ambienceVolume);
    persistAudioSettings();
  };

  const handleSfxVolumeInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement | null;
    if (!target) return;
    setSfxVolume(Number(target.value));
  };

  const handleAmbienceVolumeInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement | null;
    if (!target) return;
    setAmbienceVolume(Number(target.value));
  };

  const projectToScreen = (camera: THREE.PerspectiveCamera, worldPoint: THREE.Vector3): UIAnchor => {
    const projected = worldPoint.clone().project(camera);
    // Relaxed bounds to be more tolerant on narrow/mobile viewports
    const inDepthRange = projected.z > -1.3 && projected.z < 1.2;
    const inViewport =
      projected.x > -1.12 && projected.x < 1.12 && projected.y > -1.12 && projected.y < 1.12;
    const inView = inDepthRange && inViewport;

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

  // Delay heavy initialization until user has entered the site (gesture + overlay fade)
  function initExperience() {
    if (!canvas) return () => {};

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    if (typeof localStorage !== 'undefined') {
      ambienceVolume = parseStoredVolume(
        localStorage.getItem(AUDIO_STORAGE_KEYS.ambienceVolume),
        ambienceVolume
      );
      sfxVolume = parseStoredVolume(localStorage.getItem(AUDIO_STORAGE_KEYS.sfxVolume), sfxVolume);
    }

    AudioManager.preload(AUDIO_ASSETS.ambience);
    AudioManager.preload(AUDIO_ASSETS.cardRender);
    AudioManager.setSfxVolume(sfxVolume);
    AudioManager.setAmbience(AUDIO_ASSETS.ambience, { loop: true, volume: ambienceVolume });
    // Start ambience only after user gesture (site:entered) — play now
    AudioManager.playAmbience();

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#01030b', 42, 200);

    const camera = createPortfolioCamera(window.innerWidth / window.innerHeight);
    const renderer = createRenderer(canvas);

    const galaxy: GalaxyController = createGalaxy({
      particleCount: 25000,
      innerColor: galaxyInnerColor,
      outerColor: galaxyOuterColor
    });
    scene.add(galaxy.points);
    galaxy.points.position.x = 10.5;
    galaxyController = galaxy;

    const galaxyMaterial = galaxy.points.material as THREE.PointsMaterial;
    galaxyMaterial.opacity = 1;

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
    iconControllers = icons;

    SECTION_ORDER.forEach((id) => {
      if (icons[id]) {
        scene.add(icons[id].points);
      }
    });

    const scroll = new ScrollController();
    scrollController = scroll;
    const checkpoints = checkpointSystem;
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

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      if (!lookActive) return;
      pointerTarget.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerTarget.y = (event.clientY / window.innerHeight - 0.5) * -2;
    };

    const onPointerDown = (event: PointerEvent) => {
      // Retry ambience start on first interactions in case autoplay was blocked.
      AudioManager.playAmbience();
      // Touch drags drive scroll progress, not camera look.
      if (event.pointerType === 'touch') return;
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
    let lastSettling = false;

    const tick = (time: number) => {
      const deltaSeconds = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;

      scroll.update(deltaSeconds);

      if (scroll.isSettling !== lastSettling) {
        lastSettling = scroll.isSettling;
        scrollSettling.set(lastSettling);
      }

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

      const inContentWindow = (p: number) => p >= CONTENT_ENTRY && p <= CONTENT_EXIT;
      const inAboutWindow = (p: number) => p >= CONTENT_ENTRY && p <= ABOUT_CONTENT_EXIT;
      const inExperienceWindow = (p: number) => p >= CONTENT_ENTRY && p <= EXPERIENCE_CONTENT_EXIT;

      contentActive = {
        intro: activeSection === 'intro' && sectionProgress <= 0.96,
        about: activeSection === 'about' && inAboutWindow(sectionProgress),
        experience: activeSection === 'experience' && inExperienceWindow(sectionProgress),
        projects: activeSection === 'projects' && inContentWindow(sectionProgress),
        vision: activeSection === 'vision' && inContentWindow(sectionProgress),
        contact: activeSection === 'contact' && sectionProgress >= 0.08
      };

      if (
        (contentActive.about && !previousContentActive.about) ||
        (contentActive.experience && !previousContentActive.experience) ||
        (contentActive.projects && !previousContentActive.projects) ||
        (contentActive.vision && !previousContentActive.vision) ||
        (contentActive.contact && !previousContentActive.contact)
      ) {
        AudioManager.playSfx(AUDIO_ASSETS.cardRender);
      }
      previousContentActive = { ...contentActive };

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

        // If the world point projects off-screen, allow the currently active section
        // a small grace period (based on sectionProgress) so it can transition out
        // smoothly on narrow/mobile viewports.
        if (!base.visible) {
          if (id === activeSection && sectionProgress < 0.22) {
            projectedAnchors[id] = {
              x: window.innerWidth * 0.5,
              y: window.innerHeight * 0.6,
              scale: THREE.MathUtils.clamp(0.8 * (1 - sectionProgress * 0.5), 0.36, 0.92),
              opacity: THREE.MathUtils.clamp(1 - sectionProgress * 1.6, 0.3, 1),
              visible: true
            };
            return;
          }

          projectedAnchors[id] = HIDDEN_ANCHOR;
          return;
        }

        if (focusWeight < 0.05) {
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
      const activeIndex = SECTION_ORDER.indexOf(activeSection);
      const aboutIndex = SECTION_ORDER.indexOf('about');
      const experienceIndex = SECTION_ORDER.indexOf('experience');
      const projectsIndex = SECTION_ORDER.indexOf('projects');

      if (!projectedAnchors.about.visible || activeIndex > aboutIndex) {
        visibilityBoundReady.about = false;
      }
      if (!projectedAnchors.experience.visible || activeIndex > experienceIndex) {
        visibilityBoundReady.experience = false;
      }
      if (
        !projectedAnchors.projects.visible ||
        activeIndex > projectsIndex ||
        (activeSection === 'vision' && sectionProgress > 0.05)
      ) {
        visibilityBoundReady.projects = false;
      }
      if (activeSection !== 'vision' || sectionProgress >= 0.68) {
        visibilityBoundReady.vision = false;
      }

      clusterReady = visibilityBoundReady;
      uiAnchors = projectedAnchors;

      galaxy.update(deltaSeconds, scroll.progress);
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
      scrollController = null;

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
      galaxyController = null;
      iconControllers = {
        intro: null,
        about: null,
        experience: null,
        projects: null,
        vision: null,
        contact: null
      };

      renderer.dispose();
      AudioManager.stopAmbience();
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      
    };
  }

  onMount(() => {
    let cleanup: (() => void) | null = null;

    const start = () => {
      siteEntered = true;
      const fn = initExperience();
      if (typeof fn === 'function') cleanup = fn;
    };

    if ((window as any).__siteEntered) {
      siteEntered = true;
      start();
    } else {
      window.addEventListener('site:entered', start, { once: true });
    }

    return () => {
      if (cleanup) cleanup();
      window.removeEventListener('site:entered', start);
    };
  });
</script>

<div class="experience-root">
  <canvas bind:this={canvas} class="experience-canvas" class:look-active={lookActive} aria-hidden="true"></canvas>

  <div class="control-layer">
    {#if siteEntered}
      <nav class="top-nav" aria-label="Scene Navigation">
        {#each NAV_ITEMS as item}
          <button
            class="nav-link"
            class:is-current={activeSection === item.section}
            on:click={() => navigateTo(item.section, item.sectionProgress)}
            type="button"
          >
            {item.label}
          </button>
        {/each}
      </nav>

      <button class="settings-trigger" type="button" on:click={() => (showSettings = !showSettings)}>
        settings
      </button>

      {#if showSettings}
        <section
          class="settings-modal"
          role="dialog"
          aria-label="Experience Settings"
          in:fade={{ duration: 180 }}
          out:fade={{ duration: 180 }}
        >
          <div class="settings-head">
            <h2>settings</h2>
            <button type="button" class="close-btn" on:click={() => (showSettings = false)}>x</button>
          </div>

        <label class="check-row">
          <input type="checkbox" bind:checked={showDebugHud} />
          <span>show debug window</span>
        </label>

        <div class="slider-group">
          <div class="slider-head">
            <p>ambience volume</p>
            <span>{Math.round(ambienceVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={ambienceVolume}
            on:input={handleAmbienceVolumeInput}
          />
        </div>

        <div class="slider-group">
          <div class="slider-head">
            <p>sfx volume</p>
            <span>{Math.round(sfxVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={sfxVolume}
            on:input={handleSfxVolumeInput}
          />
        </div>

        <div class="color-group">
          <p>particle inner color</p>
          <div class="color-controls">
            <input
              type="color"
              bind:value={galaxyInnerColor}
              on:input={handleInnerColorInput}
            />
            <input
              type="text"
              bind:value={innerInput}
              placeholder="#ffb870"
              on:blur={() => commitColor('inner', innerInput)}
              on:keydown={(e) => e.key === 'Enter' && commitColor('inner', innerInput)}
            />
          </div>
        </div>

        <div class="color-group">
          <p>particle outer color</p>
          <div class="color-controls">
            <input
              type="color"
              bind:value={galaxyOuterColor}
              on:input={handleOuterColorInput}
            />
            <input
              type="text"
              bind:value={outerInput}
              placeholder="#6ca2ff"
              on:blur={() => commitColor('outer', outerInput)}
              on:keydown={(e) => e.key === 'Enter' && commitColor('outer', outerInput)}
            />
          </div>
        </div>
      </section>
    {/if}
    {/if}
  </div>

  <div class="ui-layer">
    {#if siteEntered}
      <Intro
        active={activeSection === 'intro'}
        progress={sectionProgress}
        anchor={uiAnchors.intro}
        materialized={true}
      />
    {/if}
    <About
      active={contentActive.about}
      progress={sectionProgress}
      anchor={uiAnchors.about}
      materialized={clusterReady.about}
    />
    <Work
      active={contentActive.experience}
      progress={sectionProgress}
      anchor={uiAnchors.experience}
      materialized={clusterReady.experience}
    />
    <Projects
      active={contentActive.projects}
      progress={sectionProgress}
      anchor={uiAnchors.projects}
      materialized={clusterReady.projects}
    />
    <Vision
      active={contentActive.vision}
      progress={sectionProgress}
      anchor={uiAnchors.vision}
      materialized={clusterReady.vision}
    />
    <Contact
      active={contentActive.contact}
      progress={sectionProgress}
      anchor={uiAnchors.contact}
      materialized={clusterReady.contact}
    />

    {#if showDebugHud}
      <aside class="debug-hud" aria-live="polite">
        <p>activeSection: {activeSection}</p>
        <p>sectionProgress: {sectionProgress.toFixed(3)}</p>
        <p>content about/exp/proj/vision/contact: {contentActive.about ? '1' : '0'}/{contentActive.experience ? '1' : '0'}/{contentActive.projects ? '1' : '0'}/{contentActive.vision ? '1' : '0'}/{contentActive.contact ? '1' : '0'}</p>
        <p>about: m={clusterReady.about ? '1' : '0'} v={uiAnchors.about.visible ? '1' : '0'} x={Math.round(uiAnchors.about.x)} y={Math.round(uiAnchors.about.y)}</p>
        <p>exp: m={clusterReady.experience ? '1' : '0'} v={uiAnchors.experience.visible ? '1' : '0'} x={Math.round(uiAnchors.experience.x)} y={Math.round(uiAnchors.experience.y)}</p>
        <p>proj: m={clusterReady.projects ? '1' : '0'} v={uiAnchors.projects.visible ? '1' : '0'} x={Math.round(uiAnchors.projects.x)} y={Math.round(uiAnchors.projects.y)}</p>
        <p>vision: m={clusterReady.vision ? '1' : '0'} v={uiAnchors.vision.visible ? '1' : '0'} x={Math.round(uiAnchors.vision.x)} y={Math.round(uiAnchors.vision.y)}</p>
        <p>contact: m={clusterReady.contact ? '1' : '0'} v={uiAnchors.contact.visible ? '1' : '0'} x={Math.round(uiAnchors.contact.x)} y={Math.round(uiAnchors.contact.y)}</p>
      </aside>
    {/if}
  </div>

  <div class="intro-mask" style={`opacity:${introMaskOpacity}`}></div>

  <LinkConfirm />
</div>

<style>
  .experience-root {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    background: radial-gradient(circle at 50% 45%, #0a1030 0%, #02030a 55%, #000 100%);
    overflow: hidden;
    touch-action: none;
    overscroll-behavior: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  .experience-canvas {
    width: 100%;
    height: 100%;
    display: block;
    cursor: grab;
    touch-action: none;
  }

  .experience-canvas.look-active {
    cursor: grabbing;
  }

  .ui-layer {
    position: absolute;
    inset: 0;
    pointer-events: auto;
    z-index: 30;
    touch-action: none;
  }

  .control-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 80;
    touch-action: none;
  }

  .top-nav {
    position: absolute;
    top: 1.05rem;
    right: 1rem;
    display: flex;
    gap: 0.85rem;
    pointer-events: auto;
  }

  .nav-link {
    border: 0;
    background: transparent;
    color: rgba(222, 231, 244, 0.68);
    font: 400 1.05rem/1 'Space Grotesk', sans-serif;
    letter-spacing: -0.01em;
    text-transform: lowercase;
    padding: 0;
    border-bottom: 1px solid rgba(223, 236, 255, 0.14);
    cursor: pointer;
    transition: color 180ms ease, border-color 180ms ease;
  }

  .nav-link:hover,
  .nav-link.is-current {
    color: rgba(238, 244, 255, 0.9);
    border-color: rgba(230, 240, 255, 0.55);
  }

  .settings-trigger {
    position: absolute;
    right: 1.05rem;
    bottom: 0.82rem;
    border: 0;
    background: transparent;
    color: rgba(224, 232, 246, 0.74);
    font: 400 1.1rem/1 'Space Grotesk', sans-serif;
    letter-spacing: -0.01em;
    border-bottom: 1px solid rgba(223, 236, 255, 0.18);
    cursor: pointer;
    pointer-events: auto;
  }

  .settings-modal {
    position: absolute;
    right: 1rem;
    bottom: 2.75rem;
    width: min(92vw, 23rem);
    padding: 0.8rem 0.85rem;
    border: 1px solid rgba(209, 227, 255, 0.45);
    background: rgba(2, 8, 24, 0.82);
    backdrop-filter: blur(6px);
    pointer-events: auto;
  }

  .settings-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.55rem;
  }

  .settings-head h2 {
    margin: 0;
    color: rgba(235, 243, 255, 0.9);
    font: 500 1rem/1 'Space Grotesk', sans-serif;
    text-transform: lowercase;
  }

  .close-btn {
    border: 0;
    background: transparent;
    color: rgba(224, 235, 255, 0.8);
    font: 500 1rem/1 'Space Grotesk', sans-serif;
    cursor: pointer;
  }

  .check-row {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    color: rgba(220, 232, 251, 0.84);
    font: 400 0.92rem/1.2 'Space Grotesk', sans-serif;
    text-transform: lowercase;
    margin-bottom: 0.8rem;
  }

  .check-row input[type='checkbox'] {
    appearance: none;
    width: 14px;
    height: 14px;
    border: 1px solid rgba(222, 234, 255, 0.75);
    background: transparent;
    cursor: pointer;
  }

  .check-row input[type='checkbox']:checked {
    background: rgba(248, 252, 255, 0.95);
  }

  .color-group {
    margin-bottom: 0.72rem;
  }

  .slider-group {
    margin: 0 0 0.72rem;
  }

  .slider-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.34rem;
  }

  .slider-head p,
  .slider-head span {
    margin: 0;
    color: rgba(216, 230, 252, 0.84);
    font: 400 0.82rem/1.2 'Space Grotesk', sans-serif;
    text-transform: lowercase;
  }

  .slider-group input[type='range'] {
    width: 100%;
    accent-color: #dfeeff;
    cursor: pointer;
  }

  .color-group p {
    margin: 0 0 0.36rem;
    color: rgba(216, 230, 252, 0.84);
    font: 400 0.82rem/1.2 'Space Grotesk', sans-serif;
    text-transform: lowercase;
  }

  .color-controls {
    display: flex;
    gap: 0.45rem;
  }

  .color-controls input[type='color'] {
    width: 44px;
    height: 28px;
    border: 1px solid rgba(220, 233, 255, 0.55);
    background: transparent;
    padding: 0;
    cursor: pointer;
  }

  .color-controls input[type='text'] {
    flex: 1;
    height: 28px;
    border: 1px solid rgba(220, 233, 255, 0.35);
    background: rgba(6, 12, 28, 0.8);
    color: rgba(233, 242, 255, 0.9);
    padding: 0 0.45rem;
    font: 400 0.83rem/1 'Space Grotesk', sans-serif;
    text-transform: lowercase;
  }

  .intro-mask {
    position: absolute;
    inset: 0;
    background: #000;
    pointer-events: none;
    z-index: 5;
  }

  .debug-hud {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    z-index: 210;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.72);
    border: 1px solid rgba(180, 210, 255, 0.52);
    color: #d8e7ff;
    padding: 0.5rem 0.6rem;
    font: 11.5px/1.25 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
      'Courier New', monospace;
    max-width: min(92vw, 52rem);
    white-space: normal;
  }

  .debug-hud p {
    margin: 0;
  }
</style>
