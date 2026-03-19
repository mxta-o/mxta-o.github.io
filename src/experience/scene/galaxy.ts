import * as THREE from 'three';

export type GalaxyController = {
  points: THREE.Points;
  update: (deltaSeconds: number) => void;
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
  branches: 6,
  spin: 1.15,
  randomness: 0.5,
  randomnessPower: 2.4,
  pointSize: 0.042,
  innerColor: '#ffb870',
  outerColor: '#6ca2ff'
};

export function createGalaxy(userOptions: GalaxyOptions = {}): GalaxyController {
  const options = { ...DEFAULTS, ...userOptions };

  const positions = new Float32Array(options.particleCount * 3);
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

    color.copy(inside).lerp(outside, radius / options.radius);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

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

  return {
    points,
    update(deltaSeconds: number) {
      points.rotation.y += deltaSeconds * 0.03;
      points.rotation.z = Math.sin(performance.now() * 0.00012) * 0.05;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    }
  };
}
