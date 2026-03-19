import * as THREE from 'three';
import { createParticleIcon, type IconColorSet, type IconController } from './iconCore';

const DEFAULT_COLORS: IconColorSet = {
  inner: '#ffe1b5',
  outer: '#9ecfff'
};

export function create(anchor: THREE.Vector3, colors: IconColorSet = DEFAULT_COLORS): IconController {
  return createParticleIcon({
    anchor,
    count: 1450,
    colors,
    pointSize: 0.05,
    scatterRadius: [14, 46],
    blendOpacity: [0.12, 0.98],
    buildShape: (index, count) => {
      const t = index / Math.max(1, count - 1);
      const angle = t * Math.PI * 8.2;
      const radius = 1 + Math.pow(t, 0.7) * 4.8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(t * Math.PI * 6) * 0.6;
      return [x, y, z];
    },
    deformShape: (dynamicLocal, baseLocal, progress, timeSeconds) => {
      const orbit = 0.03 + progress * 0.1;
      for (let i = 0; i < dynamicLocal.length; i += 3) {
        const x = baseLocal[i];
        const z = baseLocal[i + 2];
        const r = Math.sqrt(x * x + z * z) || 0.0001;
        const ang = Math.atan2(z, x) + Math.sin(timeSeconds * 0.9 + i * 0.003) * 0.025;
        dynamicLocal[i] = Math.cos(ang) * r;
        dynamicLocal[i + 1] = baseLocal[i + 1] + Math.sin(timeSeconds * 1.6 + i * 0.002) * orbit;
        dynamicLocal[i + 2] = Math.sin(ang) * r;
      }
    }
  });
}
