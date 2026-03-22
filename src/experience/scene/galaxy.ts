import * as THREE from 'three';

export type GalaxyController = {
  points: THREE.Points;
  update: (deltaSeconds: number, depthProgress?: number) => void;
  setColors: (innerColor: string, outerColor: string) => void;
  pulse: (strength: number, duration: number) => void;
  dispose: () => void;
};

export type GalaxyOptions = {
  particleCount?: number;
  radius?: number;
  branches?: number;
  spin?: number;
  randomness?: number;
  randomnessPower?: number;
  pointSize?: number;
  innerColor?: string;
  outerColor?: string;
};

const DEFAULTS: Required<GalaxyOptions> = {
  particleCount: 50000,
  radius: 42,
  branches: 12,
  spin: 1.15,
  randomness: 1.4,
  randomnessPower: 9,
  pointSize: 0.05,
  innerColor: '#ffb870',
  outerColor: '#6ca2ff'
};

export function createGalaxy(userOptions: GalaxyOptions = {}): GalaxyController {
  const options = { ...DEFAULTS, ...userOptions };

  const positions = new Float32Array(options.particleCount * 3);
  const basePositions = new Float32Array(options.particleCount * 3);
  const noiseDirections = new Float32Array(options.particleCount * 3);
  const radiusNorm = new Float32Array(options.particleCount);
  const phaseOffsets = new Float32Array(options.particleCount);
  const colors = new Float32Array(options.particleCount * 3);

  const inside = new THREE.Color(options.innerColor);
  const outside = new THREE.Color(options.outerColor);
  const color = new THREE.Color();

  for (let i = 0; i < options.particleCount; i += 1) {
    const i3 = i * 3;
    const radius = Math.random() * options.radius;
    const branchAngle = ((i % options.branches) / options.branches) * Math.PI * 2;
    const spinAngle = radius * options.spin;

    const randomX =
      Math.pow(Math.random(), options.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      options.randomness *
      radius;
    const randomY =
      Math.pow(Math.random(), options.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      options.randomness *
      radius *
      0.16;
    const randomZ =
      Math.pow(Math.random(), options.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      options.randomness *
      radius;

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    positions[i3 + 1] = randomY;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

    basePositions[i3] = positions[i3];
    basePositions[i3 + 1] = positions[i3 + 1];
    basePositions[i3 + 2] = positions[i3 + 2];

    const nx = THREE.MathUtils.randFloatSpread(2);
    const ny = THREE.MathUtils.randFloatSpread(2);
    const nz = THREE.MathUtils.randFloatSpread(2);
    const len = Math.max(Math.sqrt(nx * nx + ny * ny + nz * nz), 0.0001);
    noiseDirections[i3] = nx / len;
    noiseDirections[i3 + 1] = ny / len;
    noiseDirections[i3 + 2] = nz / len;
    radiusNorm[i] = radius / options.radius;
    phaseOffsets[i] = Math.random() * Math.PI * 2;

    color.copy(inside).lerp(outside, radius / options.radius);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;

  const material = new THREE.PointsMaterial({
    size: options.pointSize,
    sizeAttenuation: true,
    depthWrite: false,
    transparent: true,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    opacity: 0.9
  });

  const points = new THREE.Points(geometry, material);
  const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;

  let chunkCursor = 0;
  const chunkSize = Math.max(1200, Math.floor(options.particleCount * 0.12));

  let pulseTime = 0;
  let pulseDuration = 0;
  let pulseStrength = 0;

  const pulse = (strength: number, duration: number) => {
    pulseStrength = Math.max(0, strength);
    pulseDuration = Math.max(0.001, duration);
    pulseTime = pulseDuration;
  };

  return {
    points,
    update(deltaSeconds: number, depthProgress = 0) {
      const now = performance.now() * 0.001;
      const clampedDepth = THREE.MathUtils.clamp(depthProgress, 0, 1);
      const depthChaos = THREE.MathUtils.smoothstep(clampedDepth, 0.12, 1);

      points.rotation.y += deltaSeconds * THREE.MathUtils.lerp(0.028, 0.062, depthChaos);
      points.rotation.z = Math.sin(now * 0.12) * THREE.MathUtils.lerp(0.05, 0.11, depthChaos);

      // Mutate a moving chunk each frame so deeper sections feel more turbulent without full-buffer cost.
      const start = chunkCursor;
      const end = Math.min(options.particleCount, start + chunkSize);
      // base amplitude of motion
      let baseAmp = THREE.MathUtils.lerp(0.03, 1.2, depthChaos);

      // apply pulse (temporary brightening/turbulence) if active
      if (pulseTime > 0) {
        const tNorm = 1 - Math.max(0, pulseTime) / pulseDuration; // 0..1
        const ease = Math.sin(tNorm * Math.PI * 0.5); // ease-out
        const ampBoost = 1 + pulseStrength * 0.9 * ease;
        baseAmp *= ampBoost;
        material.opacity = THREE.MathUtils.lerp(material.opacity, 0.98 + 0.02 * pulseStrength, 0.6);
        material.size = THREE.MathUtils.lerp(material.size, options.pointSize * (1.0 + 0.3 * pulseStrength), 0.6);
        pulseTime -= deltaSeconds;
      }

      for (let i = start; i < end; i += 1) {
        const i3 = i * 3;
        const radialBoost = 0.18 + radiusNorm[i] * 0.82;
        const wave = Math.sin(now * (0.8 + radiusNorm[i] * 1.6) + phaseOffsets[i]);
        const amplitude = baseAmp * radialBoost * wave;

        positions[i3] = basePositions[i3] + noiseDirections[i3] * amplitude;
        positions[i3 + 1] = basePositions[i3 + 1] + noiseDirections[i3 + 1] * amplitude * 0.72;
        positions[i3 + 2] = basePositions[i3 + 2] + noiseDirections[i3 + 2] * amplitude;
      }

      chunkCursor = end >= options.particleCount ? 0 : end;
      positionAttr.needsUpdate = true;
      material.size = THREE.MathUtils.lerp(options.pointSize, options.pointSize * 1.22, depthChaos);
      material.opacity = THREE.MathUtils.lerp(0.88, 0.98, depthChaos);
    },
    setColors(innerColor: string, outerColor: string) {
      const inner = new THREE.Color(innerColor);
      const outer = new THREE.Color(outerColor);
      const mixed = new THREE.Color();

      for (let i = 0; i < options.particleCount; i += 1) {
        const i3 = i * 3;
        mixed.copy(inner).lerp(outer, radiusNorm[i]);
        colors[i3] = mixed.r;
        colors[i3 + 1] = mixed.g;
        colors[i3 + 2] = mixed.b;
      }

      colorAttr.needsUpdate = true;
    },
    pulse,
    dispose() {
      geometry.dispose();
      material.dispose();
    }
  };
}
