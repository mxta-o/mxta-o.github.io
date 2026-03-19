import * as THREE from 'three';
import { createParticleIcon, type IconColorSet, type IconController } from './iconCore';

const DEFAULT_COLORS: IconColorSet = {
  inner: '#ffd7a5',
  outer: '#8cc2ff'
};

const NODES: Array<[number, number, number]> = [
  [-4.6, 1.6, -0.5],
  [-2.4, 3.1, 0],
  [-0.6, 1.4, 0.7],
  [1.2, 3.5, -0.3],
  [3.6, 2.2, 0.5],
  [4.3, -0.2, -0.6],
  [1.7, -2.2, 0.4],
  [-1.4, -2.8, -0.5],
  [-3.8, -1.5, 0.3]
];

const EDGES: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 0],
  [1, 7],
  [2, 6],
  [3, 5]
];

export function create(anchor: THREE.Vector3, colors: IconColorSet = DEFAULT_COLORS): IconController {
  const count = 1400;

  return createParticleIcon({
    anchor,
    count,
    colors,
    pointSize: 0.048,
    scatterRadius: [12, 42],
    blendOpacity: [0.12, 0.98],
    buildShape: (index, total) => {
      const nodePart = Math.floor(total * 0.33);
      if (index < nodePart) {
        const node = NODES[index % NODES.length];
        const a = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 0.65) * 0.42;
        return [node[0] + Math.cos(a) * r, node[1] + Math.sin(a) * r, node[2] + (Math.random() - 0.5) * 0.24];
      }

      const edgeIndex = (index - nodePart) % EDGES.length;
      const edge = EDGES[edgeIndex];
      const from = NODES[edge[0]];
      const to = NODES[edge[1]];
      const t = Math.random();
      const jitter = (Math.random() - 0.5) * 0.12;
      return [
        THREE.MathUtils.lerp(from[0], to[0], t) + jitter,
        THREE.MathUtils.lerp(from[1], to[1], t) - jitter,
        THREE.MathUtils.lerp(from[2], to[2], t) + (Math.random() - 0.5) * 0.2
      ];
    },
    deformShape: (dynamicLocal, baseLocal, progress, timeSeconds) => {
      const twinkle = 0.04 + progress * 0.08;
      for (let i = 0; i < dynamicLocal.length; i += 3) {
        dynamicLocal[i] = baseLocal[i] + Math.sin(timeSeconds * 1.8 + i * 0.004) * twinkle;
        dynamicLocal[i + 1] = baseLocal[i + 1] + Math.cos(timeSeconds * 1.4 + i * 0.003) * twinkle;
        dynamicLocal[i + 2] = baseLocal[i + 2] + Math.sin(timeSeconds * 1.2 + i * 0.005) * (twinkle * 0.7);
      }
    }
  });
}
