import * as THREE from 'three';
import { createParticleIcon, type IconColorSet, type IconController } from './iconCore';

const DEFAULT_COLORS: IconColorSet = {
  inner: '#ffcf98',
  outer: '#84b8ff'
};

export function create(anchor: THREE.Vector3, colors: IconColorSet = DEFAULT_COLORS): IconController {
  return createParticleIcon({
    anchor,
    count: 2500,
    colors,
    pointSize: 0.05,
    scatterRadius: [14, 44],
    blendOpacity: [0.12, 0.98],
    buildShape: (index, count) => {
      const t = index / Math.max(1, count - 1);
      const turns = 6.2;
      const theta = t * Math.PI * 2 * turns;
      const radius = 0.45 + t * 4.6;
      const coreBias = Math.pow(1 - t, 2) * 0.4;
      const x = Math.cos(theta) * (radius + coreBias);
      const y = (t - 0.5) * 1.8;
      const z = Math.sin(theta) * (radius + coreBias);
      return [x, y, z];
    },
    deformShape: (dynamicLocal, baseLocal, progress, timeSeconds) => {
      const pulse = 1 + Math.sin(timeSeconds * 2.4) * 0.03;
      const swirl = progress * 0.5;

      for (let i = 0; i < dynamicLocal.length; i += 3) {
        const x = baseLocal[i];
        const y = baseLocal[i + 1];
        const z = baseLocal[i + 2];
        const angle = Math.atan2(z, x) + swirl * 0.06;
        const radius = Math.sqrt(x * x + z * z) * pulse;
        dynamicLocal[i] = Math.cos(angle) * radius;
        dynamicLocal[i + 1] = y + Math.sin(timeSeconds * 2 + i * 0.002) * 0.06;
        dynamicLocal[i + 2] = Math.sin(angle) * radius;
      }
    }
  });
}
