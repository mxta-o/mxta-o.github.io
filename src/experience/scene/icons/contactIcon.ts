import * as THREE from 'three';
import { createParticleIcon, type IconColorSet, type IconController } from './iconCore';

const DEFAULT_COLORS: IconColorSet = {
  inner: '#ffd8a5',
  outer: '#9ac8ff'
};

export function create(anchor: THREE.Vector3, colors: IconColorSet = DEFAULT_COLORS): IconController {
  const ringCount = 4;
  const pointsPerRing = 260;
  const stemCount = 260;
  const total = ringCount * pointsPerRing + stemCount;

  return createParticleIcon({
    anchor,
    count: total,
    colors,
    pointSize: 0.05,
    scatterRadius: [14, 46],
    blendOpacity: [0.12, 0.98],
    buildShape: (index) => {
      const ringParticles = ringCount * pointsPerRing;
      if (index < ringParticles) {
        const ring = Math.floor(index / pointsPerRing);
        const id = index % pointsPerRing;
        const t = id / pointsPerRing;
        const angle = t * Math.PI * 2;
        const radius = 1.4 + ring * 1.1;
        return [Math.cos(angle) * radius, (ring - 1.5) * 0.28, Math.sin(angle) * radius];
      }

      const stemIndex = index - ringParticles;
      const t = stemIndex / Math.max(1, stemCount - 1);
      const y = -3.4 + t * 6.8;
      const x = Math.sin(t * Math.PI * 6) * 0.25;
      return [x, y, 0];
    },
    deformShape: (dynamicLocal, baseLocal, progress, timeSeconds) => {
      const pulsePhase = (Math.sin(timeSeconds * 3.1) + 1) * 0.5;
      const pulseStrength = 0.06 + progress * 0.12;

      for (let i = 0; i < dynamicLocal.length; i += 3) {
        const x = baseLocal[i];
        const y = baseLocal[i + 1];
        const z = baseLocal[i + 2];
        const radius = Math.sqrt(x * x + z * z);
        const ringWave = Math.sin(radius * 1.4 - pulsePhase * Math.PI * 2) * pulseStrength;

        dynamicLocal[i] = x + (radius > 0.4 ? (x / radius) * ringWave : 0);
        dynamicLocal[i + 1] = y + Math.sin(timeSeconds * 2.2 + i * 0.004) * 0.05;
        dynamicLocal[i + 2] = z + (radius > 0.4 ? (z / radius) * ringWave : 0);
      }
    }
  });
}
