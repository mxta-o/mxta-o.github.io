import * as THREE from 'three';
import { createParticleIcon, type IconColorSet, type IconController } from './iconCore';

const DEFAULT_COLORS: IconColorSet = {
  inner: '#ffc993',
  outer: '#7eb7ff'
};

export function create(anchor: THREE.Vector3, colors: IconColorSet = DEFAULT_COLORS): IconController {
  const globeCount = 4000;
  const orbitCount = 420;
  const connectorCount = 400;
  const totalCount = globeCount + orbitCount + connectorCount;

  return createParticleIcon({
    anchor,
    count: totalCount,
    colors,
    pointSize: 0.058,
    scatterRadius: [6, 18],
    blendOpacity: [0.12, 0.95],
    materializeThreshold: 0.62,
    settleSpeed: 16,
    buildShape: (index) => {
      if (index < globeCount) {
        const t = index / Math.max(1, globeCount - 1);
        const phi = Math.acos(1 - 2 * t);
        const theta = Math.PI * (1 + Math.sqrt(5)) * index;
        const radius = 2.85 + Math.sin(index * 0.08) * 0.14;
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        return [x, y, z];
      }

      if (index < globeCount + orbitCount) {
        const i = index - globeCount;
        const orbitIndex = i % 3;
        const ringT = (i / Math.max(1, orbitCount - 1)) * Math.PI * 2;
        const ringRadius = 3.9 + Math.sin(i * 0.2) * 0.12;
        const tilt = orbitIndex === 0 ? 0.28 : orbitIndex === 1 ? -0.55 : 1.05;

        const base = new THREE.Vector3(
          Math.cos(ringT) * ringRadius,
          Math.sin(ringT * 0.7) * 0.15,
          Math.sin(ringT) * ringRadius
        );
        base.applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
        return [base.x, base.y, base.z];
      }

      const i = index - globeCount - orbitCount;
      const lineT = (i % 15) / 14;
      const pairIndex = Math.floor(i / 15);
      const a = (pairIndex * 1.1 + 0.3) % (Math.PI * 2);
      const b = (pairIndex * 1.9 + 1.1) % (Math.PI * 2);
      const yA = Math.sin(pairIndex * 0.47) * 1.95;
      const yB = Math.cos(pairIndex * 0.39) * 1.95;
      const rA = 2.55 + Math.sin(pairIndex * 0.3) * 0.18;
      const rB = 2.55 + Math.cos(pairIndex * 0.33) * 0.18;
      const p1 = new THREE.Vector3(Math.cos(a) * rA, yA, Math.sin(a) * rA);
      const p2 = new THREE.Vector3(Math.cos(b) * rB, yB, Math.sin(b) * rB);
      const p = p1.lerp(p2, lineT);
      return [p.x, p.y, p.z];
    },
    deformShape: (dynamicLocal, baseLocal, progress, timeSeconds) => {
      const pulse = 0.03 + progress * 0.06;
      for (let i = 0; i < dynamicLocal.length; i += 3) {
        const x = baseLocal[i];
        const y = baseLocal[i + 1];
        const z = baseLocal[i + 2];
        const spin = Math.atan2(z, x) + Math.sin(timeSeconds * 0.9 + i * 0.0018) * 0.04;
        const radius = Math.sqrt(x * x + z * z);
        const orbitDrift = Math.sin(timeSeconds * 1.2 + y * 0.6 + i * 0.001) * pulse;

        dynamicLocal[i] = Math.cos(spin) * radius + orbitDrift;
        dynamicLocal[i + 1] = y + Math.sin(timeSeconds * 1.7 + radius * 1.15 + i * 0.001) * (pulse * 0.9);
        dynamicLocal[i + 2] = Math.sin(spin) * radius + Math.cos(timeSeconds * 1.35 + y) * (pulse * 0.85);
      }
    }
  });
}
