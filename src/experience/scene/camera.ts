import * as THREE from 'three';

export type ParallaxInput = {
	x: number;
	y: number;
};

const cameraPath = new THREE.CatmullRomCurve3([
	new THREE.Vector3(-12, 12.6, 90),
	new THREE.Vector3(15, 6.2, 44),
	new THREE.Vector3(5.6, 3.5, 18),
	new THREE.Vector3(-3.2, 2.4, 7.6),
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
	parallax: ParallaxInput
) {
	const safeProgress = THREE.MathUtils.clamp(progress, 0, 1);
	const point = cameraPath.getPointAt(safeProgress);
	const lookTarget = cameraPath.getPointAt(Math.min(1, safeProgress + 0.03));
	const topDownBlend = THREE.MathUtils.smoothstep(safeProgress, 0.87, 1);
	const topDownTarget = new THREE.Vector3(0, 0, 0);
	lookTarget.lerp(topDownTarget, topDownBlend);

	const parallaxScale = 1.8;
	camera.position.set(
		point.x + parallax.x * parallaxScale,
		point.y + parallax.y * (parallaxScale * 0.8),
		point.z
	);

	camera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z - 2.5);
}
