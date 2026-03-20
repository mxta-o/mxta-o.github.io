import * as THREE from 'three';

export type IconController = {
  points: THREE.Points;
  animateIn: () => void;
  animateOut: () => void;
  update: (progress: number) => void;
  setColors: (colors: IconColorSet) => void;
  isMaterialized: () => boolean;
  dispose: () => void;
};

export type IconColorSet = {
  inner: THREE.ColorRepresentation;
  outer: THREE.ColorRepresentation;
};

type BuildShapeFn = (index: number, count: number) => [number, number, number];

type DeformShapeFn = (
  dynamicLocal: Float32Array,
  baseLocal: Float32Array,
  progress: number,
  timeSeconds: number
) => void;

type ParticleIconConfig = {
  anchor: THREE.Vector3;
  count: number;
  colors: IconColorSet;
  pointSize: number;
  scatterRadius: [number, number];
  blendOpacity: [number, number];
  materializeThreshold?: number;
  settleSpeed?: number;
  buildShape: BuildShapeFn;
  deformShape?: DeformShapeFn;
};

const randFloatSpread = (spread: number) => (Math.random() - 0.5) * spread;

export function createParticleIcon(config: ParticleIconConfig): IconController {
  const geometry = new THREE.BufferGeometry();
  const scatter = new Float32Array(config.count * 3);
  const baseLocal = new Float32Array(config.count * 3);
  const dynamicLocal = new Float32Array(config.count * 3);
  const current = new Float32Array(config.count * 3);
  const colors = new Float32Array(config.count * 3);

  const colorA = new THREE.Color(config.colors.inner);
  const colorB = new THREE.Color(config.colors.outer);
  const colorMix = new THREE.Color();
  const colorLerp: Float32Array = new Float32Array(config.count);

  for (let i = 0; i < config.count; i += 1) {
    const i3 = i * 3;
    const radius = THREE.MathUtils.randFloat(config.scatterRadius[0], config.scatterRadius[1]);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

    scatter[i3] = Math.sin(phi) * Math.cos(theta) * radius;
    scatter[i3 + 1] = Math.cos(phi) * radius * 0.55;
    scatter[i3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;

    const [lx, ly, lz] = config.buildShape(i, config.count);
    baseLocal[i3] = lx;
    baseLocal[i3 + 1] = ly;
    baseLocal[i3 + 2] = lz;
    dynamicLocal[i3] = lx;
    dynamicLocal[i3 + 1] = ly;
    dynamicLocal[i3 + 2] = lz;

    current[i3] = scatter[i3];
    current[i3 + 1] = scatter[i3 + 1];
    current[i3 + 2] = scatter[i3 + 2];

    const t = Math.random();
    colorLerp[i] = t;
    colorMix.copy(colorA).lerp(colorB, t);
    colors[i3] = colorMix.r;
    colors[i3 + 1] = colorMix.g;
    colors[i3 + 2] = colorMix.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(current, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: config.pointSize,
    sizeAttenuation: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    opacity: config.blendOpacity[0]
  });

  const points = new THREE.Points(geometry, material);

  let mix = 0;
  let targetMix = 0;
  let materialized = false;
  let lastTime = performance.now();
  const materializeThreshold = config.materializeThreshold ?? 0.92;
  const settleSpeed = config.settleSpeed ?? 8.2;

  const update = (progress: number) => {
    const now = performance.now();
    const deltaSeconds = Math.min((now - lastTime) / 1000, 0.033);
    lastTime = now;

    if (config.deformShape) {
      config.deformShape(dynamicLocal, baseLocal, progress, now * 0.001);
    }

    mix += (targetMix - mix) * (1 - Math.exp(-deltaSeconds * settleSpeed));

    for (let i = 0; i < config.count; i += 1) {
      const i3 = i * 3;
      const tx = config.anchor.x + dynamicLocal[i3];
      const ty = config.anchor.y + dynamicLocal[i3 + 1];
      const tz = config.anchor.z + dynamicLocal[i3 + 2];

      current[i3] = THREE.MathUtils.lerp(scatter[i3], tx, mix);
      current[i3 + 1] = THREE.MathUtils.lerp(scatter[i3 + 1], ty, mix);
      current[i3 + 2] = THREE.MathUtils.lerp(scatter[i3 + 2], tz, mix);
    }

    const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    positionAttr.needsUpdate = true;

    material.opacity = THREE.MathUtils.lerp(config.blendOpacity[0], config.blendOpacity[1], mix);
    material.size = config.pointSize * (0.82 + mix * 0.28);

    if (!materialized && mix >= materializeThreshold) {
      materialized = true;
    }
    if (targetMix < 0.05 && mix <= 0.1) {
      materialized = false;
    }
  };

  return {
    points,
    animateIn: () => {
      targetMix = 1;
    },
    animateOut: () => {
      targetMix = 0;
      materialized = false;
    },
    update,
    setColors: (nextColors: IconColorSet) => {
      colorA.set(nextColors.inner);
      colorB.set(nextColors.outer);
      const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;

      for (let i = 0; i < config.count; i += 1) {
        const i3 = i * 3;
        colorMix.copy(colorA).lerp(colorB, colorLerp[i]);
        colors[i3] = colorMix.r;
        colors[i3 + 1] = colorMix.g;
        colors[i3 + 2] = colorMix.b;
      }

      colorAttr.needsUpdate = true;
    },
    isMaterialized: () => materialized,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    }
  };
}

export function randomWobble(baseValue: number, phase: number, strength: number) {
  return baseValue + Math.sin(phase) * strength + randFloatSpread(strength * 0.2);
}
