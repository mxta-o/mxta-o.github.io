import * as THREE from 'three';
import type { CheckpointId } from '../systems/checkpointSystem';

export type ParallaxInput = {
	x: number;
	y: number;
};

const cameraPath = new THREE.CatmullRomCurve3([
	new THREE.Vector3(-12, 12.6, 90),
	new THREE.Vector3(8.6, 6.2, 38),
	new THREE.Vector3(0.4, 4.8, 8),
	new THREE.Vector3(5.2, 5.1, -24),
	new THREE.Vector3(12, 12.6, -90),
	new THREE.Vector3(0, 42, 0.8)
]);

export function createPortfolioCamera(aspect: number): THREE.PerspectiveCamera {
	const camera = new THREE.PerspectiveCamera(62, aspect, 0.1, 300);
	camera.position.set(-12, 12.6, 90);
	return camera;
}

export function updateCameraFromProgress(
	camera: THREE.PerspectiveCamera,
	progress: number,
	parallax: ParallaxInput,
	activeSection: CheckpointId,
	sectionProgress: number,
	galaxyCenter: THREE.Vector3
) {
	const safeProgress = THREE.MathUtils.clamp(progress, 0, 1);
	const point = cameraPath.getPointAt(safeProgress);
	const lookTarget = cameraPath.getPointAt(Math.min(1, safeProgress + 0.03));
	const centerFacing =
		activeSection === 'projects' || activeSection === 'vision' || activeSection === 'contact';

	if (centerFacing) {
		const centerBlend =
			activeSection === 'projects'
				? THREE.MathUtils.smoothstep(sectionProgress, 0, 0.22)
				: 1;
		lookTarget.lerp(galaxyCenter, centerBlend);
	}

	if (activeSection === 'vision') {
		const inBlend = THREE.MathUtils.smoothstep(sectionProgress, 0.08, 0.34);
		const outBlend = 1 - THREE.MathUtils.smoothstep(sectionProgress, 0.8, 1);
		const visionBlend = inBlend * outBlend;
		lookTarget.lerp(galaxyCenter, visionBlend * 0.95);
	}

	const topDownBlend = THREE.MathUtils.smoothstep(safeProgress, 0.9, 1);
	const topDownTarget = galaxyCenter;
	lookTarget.lerp(topDownTarget, topDownBlend);

	const parallaxScale = 1.8;
	camera.position.set(
		point.x + parallax.x * parallaxScale,
		point.y + parallax.y * (parallaxScale * 0.8),
		point.z
	);

	const lookOffsetZ = centerFacing ? 0 : -2.5;
	camera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z + lookOffsetZ);
}
