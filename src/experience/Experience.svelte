<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import * as THREE from 'three';
  import { createGalaxy, type GalaxyController } from './scene/galaxy';
  import { createPortfolioCamera, updateCameraFromProgress } from './scene/camera';
  import { createRenderer, resizeRenderer } from './scene/renderer';
  import { ScrollController } from './systems/scrollController';
  import { CheckpointSystem, type CheckpointId } from './systems/checkpointSystem';
  import Intro from './ui/Intro.svelte';
  import About from './ui/About.svelte';
  import ExperienceSection from './ui/ExperienceSection.svelte';
  import Projects from './ui/Projects.svelte';
  import Contact from './ui/Contact.svelte';
  import { HIDDEN_ANCHOR, type UIAnchor } from './ui/types';

  type ClusterState = {
    points: THREE.Points;
    scatter: Float32Array;
    target: Float32Array;
    current: Float32Array;
    mix: number;
    targetMix: number;
  };

  const SECTION_ORDER: CheckpointId[] = ['intro', 'about', 'experience', 'projects', 'contact'];

  const CHECKPOINT_ANCHORS: Record<CheckpointId, THREE.Vector3> = {
    intro: new THREE.Vector3(-7.5, 8.2, 52),
    about: new THREE.Vector3(15.2, 4.8, 34),
    experience: new THREE.Vector3(5.8, 3, 14.5),
    projects: new THREE.Vector3(-3.4, 2.5, 6.4),
    contact: new THREE.Vector3(0, 17.2, 0.9)
  };

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
    contact: HIDDEN_ANCHOR
  };

  let clusterReady: Record<CheckpointId, boolean> = {
    intro: false,
    about: false,
    experience: false,
    projects: false,
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

  const createCheckpointCluster = (
    anchor: THREE.Vector3,
    count: number,
    innerColor: THREE.Color,
    outerColor: THREE.Color
  ): ClusterState => {
    const geometry = new THREE.BufferGeometry();
    const scatter = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const current = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      const scatterRadius = THREE.MathUtils.randFloat(12, 48);
      const scatterAngle = Math.random() * Math.PI * 2;
      const scatterHeight = THREE.MathUtils.randFloatSpread(9);

      scatter[i3] = Math.cos(scatterAngle) * scatterRadius;
      scatter[i3 + 1] = scatterHeight;
      scatter[i3 + 2] = Math.sin(scatterAngle) * scatterRadius;

      const localRadius = Math.pow(Math.random(), 0.58) * 4.4;
      const localTheta = Math.random() * Math.PI * 2;
      const localPhi = Math.acos(2 * Math.random() - 1);

      target[i3] = anchor.x + localRadius * Math.sin(localPhi) * Math.cos(localTheta);
      target[i3 + 1] = anchor.y + localRadius * Math.cos(localPhi) * 0.5;
      target[i3 + 2] = anchor.z + localRadius * Math.sin(localPhi) * Math.sin(localTheta);

      current[i3] = scatter[i3];
      current[i3 + 1] = scatter[i3 + 1];
      current[i3 + 2] = scatter[i3 + 2];

      color.copy(innerColor).lerp(outerColor, Math.random());
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(current, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.048,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      opacity: 0.98
    });

    const points = new THREE.Points(geometry, material);

    return {
      points,
      scatter,
      target,
      current,
      mix: 0,
      targetMix: 0
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

    const clusterColorIn = new THREE.Color('#ffcc90');
    const clusterColorOut = new THREE.Color('#87b6ff');

    const clusters: Record<CheckpointId, ClusterState> = {
      intro: createCheckpointCluster(CHECKPOINT_ANCHORS.intro, 0, clusterColorIn, clusterColorOut),
      about: createCheckpointCluster(CHECKPOINT_ANCHORS.about, 1500, clusterColorIn, clusterColorOut),
      experience: createCheckpointCluster(CHECKPOINT_ANCHORS.experience, 1600, clusterColorIn, clusterColorOut),
      projects: createCheckpointCluster(CHECKPOINT_ANCHORS.projects, 1500, clusterColorIn, clusterColorOut),
      contact: createCheckpointCluster(CHECKPOINT_ANCHORS.contact, 0, clusterColorIn, clusterColorOut)
    };

    SECTION_ORDER.forEach((id) => {
      scene.add(clusters[id].points);
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

      pointerSmooth.x = THREE.MathUtils.lerp(pointerSmooth.x, pointerTarget.x, 0.07);
      pointerSmooth.y = THREE.MathUtils.lerp(pointerSmooth.y, pointerTarget.y, 0.07);

      updateCameraFromProgress(camera, scroll.progress, pointerSmooth);

      if (introState.arrival > 0.001) {
        camera.position.z += 34 * introState.arrival;
        camera.position.y += 5.2 * introState.arrival;
      }

      camera.position.x += Math.sin(time * 0.00045) * 0.22;
      camera.position.y += Math.cos(time * 0.00038) * 0.16;

      checkpoints.update(scroll.progress, (current, previous) => {
        activeSection = current;

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

      SECTION_ORDER.forEach((id) => {
        clusters[id].targetMix = id === activeSection ? 1 : 0;
      });

      const nextSection = getNextSection(activeSection);
      if (nextSection) {
        // Keep the next section dormant until late in the current checkpoint.
        const preWarm = THREE.MathUtils.clamp((sectionProgress - 0.86) / 0.14, 0, 1) * 0.18;
        clusters[nextSection].targetMix = Math.max(clusters[nextSection].targetMix, preWarm);
      }

      const nextClusterReady = { ...clusterReady };
      SECTION_ORDER.forEach((id) => {
        const state = clusters[id];
        state.mix += (state.targetMix - state.mix) * (1 - Math.exp(-deltaSeconds * 6.2));

        for (let i = 0; i < state.current.length; i += 1) {
          state.current[i] = THREE.MathUtils.lerp(state.scatter[i], state.target[i], state.mix);
        }

        const attr = state.points.geometry.attributes.position as THREE.BufferAttribute;
        attr.needsUpdate = true;

        const material = state.points.material as THREE.PointsMaterial;
        material.opacity = 0.18 + state.mix * 0.9;
        material.size = 0.035 + state.mix * 0.02;

        nextClusterReady[id] = state.mix > 0.62;
      });
      clusterReady = nextClusterReady;

      const activeAnchor = CHECKPOINT_ANCHORS[activeSection];
      const disableSectionPull = activeSection === 'intro' || activeSection === 'contact';
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
        const state = clusters[id];
        scene.remove(state.points);
        state.points.geometry.dispose();
        (state.points.material as THREE.Material).dispose();
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
    <Contact
      active={activeSection === 'contact'}
      progress={sectionProgress}
      anchor={uiAnchors.contact}
      materialized={true}
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
