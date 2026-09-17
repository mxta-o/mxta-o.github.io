import * as THREE from 'three';

const TOUCH_SENSITIVITY = 0.00025;
const FLICK_DECAY = 3.2;
const MAX_FLICK = 0.9;
const VELOCITY_EPSILON = 0.0004;
// Movement below this is treated as a tap so links inside cards stay clickable.
const DRAG_SLOP = 6;
const FLICK_IDLE_MS = 90;

export class ScrollController {
  private targetProgress = 0;
  private currentProgress = 0;
  private velocity = 0;

  private touchActive = false;
  private touchId: number | null = null;
  private startY = 0;
  private lastY = 0;
  private lastT = 0;
  private velocitySample = 0;
  private dragArmed = false;

  private readonly wheelHandler = (event: WheelEvent) => {
    this.velocity = 0;
    event.preventDefault();
    this.targetProgress = THREE.MathUtils.clamp(
      this.targetProgress + event.deltaY * 0.00045,
      0,
      1
    );
  };

  private readonly keyHandler = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      this.velocity = 0;
      event.preventDefault();
      this.targetProgress = THREE.MathUtils.clamp(this.targetProgress + 0.04, 0, 1);
    }

    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      this.velocity = 0;
      event.preventDefault();
      this.targetProgress = THREE.MathUtils.clamp(this.targetProgress - 0.04, 0, 1);
    }
  };

  private findTrackedTouch(event: TouchEvent) {
    if (this.touchId === null) return null;
    for (let i = 0; i < event.touches.length; i += 1) {
      if (event.touches[i].identifier === this.touchId) {
        return event.touches[i];
      }
    }
    return null;
  }

  private readonly touchStartHandler = (event: TouchEvent) => {
    if (event.touches.length !== 1) {
      this.touchActive = false;
      this.touchId = null;
      return;
    }

    const touch = event.touches[0];
    this.touchActive = true;
    this.touchId = touch.identifier;
    this.startY = touch.clientY;
    this.lastY = touch.clientY;
    this.lastT = event.timeStamp;
    this.velocity = 0;
    this.velocitySample = 0;
    this.dragArmed = false;
  };

  private readonly touchMoveHandler = (event: TouchEvent) => {
    if (!this.touchActive) return;

    const touch = this.findTrackedTouch(event);
    if (!touch) return;

    const y = touch.clientY;

    if (!this.dragArmed) {
      if (Math.abs(this.startY - y) <= DRAG_SLOP) return;
      this.dragArmed = true;
    }

    event.preventDefault();

    const delta = (this.lastY - y) * TOUCH_SENSITIVITY;
    this.targetProgress = THREE.MathUtils.clamp(this.targetProgress + delta, 0, 1);

    const deltaSeconds = Math.max((event.timeStamp - this.lastT) / 1000, 0.001);
    this.velocitySample += (delta / deltaSeconds - this.velocitySample) * 0.6;

    this.lastY = y;
    this.lastT = event.timeStamp;
  };

  private readonly touchEndHandler = (event: TouchEvent) => {
    if (!this.touchActive) return;
    if (this.findTrackedTouch(event)) return;

    // A finger that paused before lifting should stop, not coast.
    const flicked = this.dragArmed && event.timeStamp - this.lastT <= FLICK_IDLE_MS;

    this.touchActive = false;
    this.touchId = null;
    this.dragArmed = false;
    this.velocity = flicked
      ? THREE.MathUtils.clamp(this.velocitySample, -MAX_FLICK, MAX_FLICK)
      : 0;
  };

  private readonly touchCancelHandler = () => {
    this.touchActive = false;
    this.touchId = null;
    this.dragArmed = false;
    this.velocity = 0;
  };

  mount() {
    window.addEventListener('wheel', this.wheelHandler, { passive: false });
    window.addEventListener('keydown', this.keyHandler);
    window.addEventListener('touchstart', this.touchStartHandler, { passive: true });
    window.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
    window.addEventListener('touchend', this.touchEndHandler);
    window.addEventListener('touchcancel', this.touchCancelHandler);
  }

  unmount() {
    window.removeEventListener('wheel', this.wheelHandler);
    window.removeEventListener('keydown', this.keyHandler);
    window.removeEventListener('touchstart', this.touchStartHandler);
    window.removeEventListener('touchmove', this.touchMoveHandler);
    window.removeEventListener('touchend', this.touchEndHandler);
    window.removeEventListener('touchcancel', this.touchCancelHandler);
    this.velocity = 0;
    this.touchActive = false;
    this.touchId = null;
  }

  update(deltaSeconds: number) {
    if (!this.touchActive && this.velocity !== 0) {
      this.targetProgress = THREE.MathUtils.clamp(
        this.targetProgress + this.velocity * deltaSeconds,
        0,
        1
      );
      this.velocity *= Math.exp(-deltaSeconds * FLICK_DECAY);
      if (
        Math.abs(this.velocity) < VELOCITY_EPSILON ||
        this.targetProgress <= 0 ||
        this.targetProgress >= 1
      ) {
        this.velocity = 0;
      }
    }

    const smoothFactor = 1 - Math.exp(-deltaSeconds * 7);
    this.currentProgress = THREE.MathUtils.lerp(
      this.currentProgress,
      this.targetProgress,
      smoothFactor
    );
  }

  setProgress(progress: number, snapCurrent = false) {
    this.velocity = 0;
    const clamped = THREE.MathUtils.clamp(progress, 0, 1);
    this.targetProgress = clamped;
    if (snapCurrent) {
      this.currentProgress = clamped;
    }
  }

  get target() {
    return this.targetProgress;
  }

  get progress() {
    return this.currentProgress;
  }
}
