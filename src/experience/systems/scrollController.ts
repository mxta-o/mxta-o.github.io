import * as THREE from 'three';

export class ScrollController {
  private targetProgress = 0;
  private currentProgress = 0;

  private readonly wheelHandler = (event: WheelEvent) => {
    event.preventDefault();
    this.targetProgress = THREE.MathUtils.clamp(
      this.targetProgress + event.deltaY * 0.00045,
      0,
      1
    );
  };

  private readonly keyHandler = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault();
      this.targetProgress = THREE.MathUtils.clamp(this.targetProgress + 0.04, 0, 1);
    }

    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      this.targetProgress = THREE.MathUtils.clamp(this.targetProgress - 0.04, 0, 1);
    }
  };

  mount() {
    window.addEventListener('wheel', this.wheelHandler, { passive: false });
    window.addEventListener('keydown', this.keyHandler);
  }

  unmount() {
    window.removeEventListener('wheel', this.wheelHandler);
    window.removeEventListener('keydown', this.keyHandler);
  }

  update(deltaSeconds: number) {
    const smoothFactor = 1 - Math.exp(-deltaSeconds * 7);
    this.currentProgress = THREE.MathUtils.lerp(
      this.currentProgress,
      this.targetProgress,
      smoothFactor
    );
  }

  get progress() {
    return this.currentProgress;
  }
}
