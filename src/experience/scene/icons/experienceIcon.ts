import * as THREE from 'three';
import { createParticleIcon, type IconColorSet, type IconController } from './iconCore';

const DEFAULT_COLORS: IconColorSet = {
  inner: '#ffc993',
  outer: '#7eb7ff'
};

export function create(anchor: THREE.Vector3, colors: IconColorSet = DEFAULT_COLORS): IconController {
  const layers = 7;
  const ringPoints = 34;

  return createParticleIcon({
    anchor,
    count: layers * ringPoints * 6,
    colors,
    pointSize: 0.055,
    scatterRadius: [6, 18],
    blendOpacity: [0.12, 0.95],
    materializeThreshold: 0.7,
    settleSpeed: 15,
    buildShape: (index) => {
      const ringSlot = Math.floor(index / 6);
      const layer = ringSlot % layers;
      const ringIndex = Math.floor(ringSlot / layers) % ringPoints;
      const jitterBand = index % 6;

      const layerT = layer / Math.max(1, layers - 1);
      const y = THREE.MathUtils.lerp(-3.1, 3.1, layerT) + Math.sin(jitterBand * 1.2) * 0.08;
      const angle = (ringIndex / ringPoints) * Math.PI * 2 + layerT * 0.6;
      const radius = 1.4 + Math.sin(layerT * Math.PI) * 2.2 + Math.sin(jitterBand * 0.7) * 0.06;

      const x = Math.cos(angle) * radius + Math.cos(y * 0.8) * 0.14;
      const z = Math.sin(angle) * radius + Math.sin(y * 0.9) * 0.16;
      return [x, y, z];
    },
    deformShape: (dynamicLocal, baseLocal, progress, timeSeconds) => {
      const pulse = 0.02 + progress * 0.08;
      for (let i = 0; i < dynamicLocal.length; i += 3) {
        const x = baseLocal[i];
        const y = baseLocal[i + 1];
        const z = baseLocal[i + 2];
        const spin = Math.atan2(z, x) + Math.sin(timeSeconds * 0.95 + i * 0.002) * 0.035;
        const radius = Math.sqrt(x * x + z * z);

        dynamicLocal[i] = Math.cos(spin) * radius + Math.sin(timeSeconds * 1.5 + y * 0.9) * pulse;
        dynamicLocal[i + 1] = y + Math.sin(timeSeconds * 1.8 + radius * 1.1 + i * 0.001) * (pulse * 0.9);
        dynamicLocal[i + 2] = Math.sin(spin) * radius + Math.cos(timeSeconds * 1.3 + y) * (pulse * 0.85);
      }
    }
  });
}
