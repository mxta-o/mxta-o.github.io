import * as THREE from 'three';
import { createParticleIcon, type IconColorSet, type IconController } from './iconCore';

const DEFAULT_COLORS: IconColorSet = {
  inner: '#ffe1b5',
  outer: '#9ecfff'
};

export function create(anchor: THREE.Vector3, colors: IconColorSet = DEFAULT_COLORS): IconController {
  return createParticleIcon({
    anchor,
    count: 2860,
    colors,
    pointSize: 0.053,
    scatterRadius: [12, 44],
    blendOpacity: [0.12, 0.98],
    buildShape: (index) => {
      const bubbleCount = 2048;
      const tailCount = 410;
      const ringCount = 380;

      if (index < bubbleCount) {
        const t = index / Math.max(1, bubbleCount - 1);
        const phi = Math.acos(1 - 2 * t);
        const theta = Math.PI * (1 + Math.sqrt(5)) * index;
        const squash = 0.78;
        const radius = 3.35 + Math.sin(index * 0.09) * 0.18;
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi) * squash + 0.42;
        const z = radius * Math.sin(phi) * Math.sin(theta);
        return [x, y, z];
      }

      if (index < bubbleCount + tailCount) {
        const i = index - bubbleCount;
        const bubbleIndex = Math.floor(i / 70);
        const inBubble = i % 70;
        const a = (inBubble / 70) * Math.PI * 2;
        const r = bubbleIndex === 0 ? 0.78 : bubbleIndex === 1 ? 0.56 : 0.4;
        const cx = -2.9 - bubbleIndex * 1.05;
        const cy = -2.1 - bubbleIndex * 0.94;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        const z = Math.sin(a * 1.6 + bubbleIndex) * 0.2;
        return [x, y, z];
      }

      if (index < bubbleCount + tailCount + ringCount) {
        const i = index - bubbleCount - tailCount;
        const t = i / Math.max(1, ringCount - 1);
        const a = t * Math.PI * 2;
        const r = 4.35 + Math.sin(i * 0.14) * 0.06;
        const x = Math.cos(a) * r;
        const y = Math.sin(a * 2) * 0.22;
        const z = Math.sin(a) * r;
        return [x, y, z];
      }

      const i = index - bubbleCount - tailCount - ringCount;
      const arm = Math.floor(i / 32);
      const t = (i % 32) / 31;
      const span = 4.2;
      if (arm % 2 === 0) {
        const x = THREE.MathUtils.lerp(-span, span, t);
        return [x, 0, arm === 0 ? 0 : 0.22];
      }
      const z = THREE.MathUtils.lerp(-span, span, t);
      return [0.22, 0, z];
    },
    deformShape: (dynamicLocal, baseLocal, progress, timeSeconds) => {
      const orbit = 0.04 + progress * 0.08;
      for (let i = 0; i < dynamicLocal.length; i += 3) {
        const x = baseLocal[i];
        const y = baseLocal[i + 1];
        const z = baseLocal[i + 2];
        const r = Math.sqrt(x * x + z * z) || 0.0001;
        const ang = Math.atan2(z, x) + Math.sin(timeSeconds * 0.95 + i * 0.003) * 0.03;
        dynamicLocal[i] = Math.cos(ang) * r;
        dynamicLocal[i + 1] = y + Math.sin(timeSeconds * 1.45 + i * 0.002 + r) * orbit;
        dynamicLocal[i + 2] = Math.sin(ang) * r + Math.cos(timeSeconds * 1.2 + y) * (orbit * 0.36);
      }
    }
  });
}
