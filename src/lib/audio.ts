// Lightweight AudioManager for site ambience and SFX
// Usage:
// - Place audio files under `public/audio/` (e.g. `public/audio/ambience.mp3`, `public/audio/click.wav`).
// - Import the singleton and call `AudioManager.setAmbience('/audio/ambience.mp3')` then `AudioManager.playAmbience()`
// - For SFX call `AudioManager.playSfx('/audio/click.wav')`
// Note: browsers block autoplay until a user gesture; call `AudioManager.enableOnUserGesture()` from a root component

type AmbienceOpts = {
  loop?: boolean;
  volume?: number; // 0..1
};

class _AudioManager {
  private ambience: HTMLAudioElement | null = null;
  private ambienceSrc = '';
  private ambienceVolume = 0.6;
  private sfxVolume = 1;
  private muted = false;

  // simple pool for short-lived SFX; not optimized but fine for small sites
  playSfx(src: string, opts?: { volume?: number }) {
    try {
      const a = new Audio(src);
      a.preload = 'auto';
      a.volume = (opts?.volume ?? this.sfxVolume) * (this.muted ? 0 : 1);
      // don't await play(); let promise rejection be silent
      a.play().catch(() => {
        // autoplay blocked or other error
      });
      // remove reference on end
      a.addEventListener('ended', () => {
        try {
          a.src = '';
        } catch {}
      });
      return a;
    } catch (e) {
      // degrade silently
      return null;
    }
  }

  setAmbience(src: string, opts?: AmbienceOpts) {
    if (this.ambience) {
      this.ambience.pause();
      try {
        this.ambience.src = '';
      } catch {}
      this.ambience = null;
    }

    this.ambienceSrc = src;
    this.ambienceVolume = opts?.volume ?? this.ambienceVolume;

    const a = new Audio(src);
    a.preload = 'auto';
    a.loop = opts?.loop ?? true;
    a.volume = this.ambienceVolume * (this.muted ? 0 : 1);
    this.ambience = a;
    return a;
  }

  async playAmbience() {
    if (!this.ambience && this.ambienceSrc) {
      this.setAmbience(this.ambienceSrc, { loop: true, volume: this.ambienceVolume });
    }
    if (!this.ambience) return;
    try {
      await this.ambience.play();
    } catch (e) {
      // autoplay blocked until user gesture
    }
  }

  stopAmbience() {
    if (!this.ambience) return;
    this.ambience.pause();
    try {
      this.ambience.currentTime = 0;
    } catch {}
  }

  setAmbienceVolume(v: number) {
    this.ambienceVolume = Math.max(0, Math.min(1, v));
    if (this.ambience) this.ambience.volume = this.ambienceVolume * (this.muted ? 0 : 1);
  }

  setSfxVolume(v: number) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
  }

  mute() {
    this.muted = true;
    if (this.ambience) this.ambience.volume = 0;
  }

  unmute() {
    this.muted = false;
    if (this.ambience) this.ambience.volume = this.ambienceVolume;
  }

  toggleMute() {
    if (this.muted) this.unmute();
    else this.mute();
  }

  // For sites that need to wait for a user gesture to start audio (recommended).
  // Call this from a root component (on first click/tap) to attempt to resume playback.
  enableOnUserGesture() {
    if (typeof window === 'undefined') return;
    const resume = async () => {
      try {
        // try to play a silent buffer to unlock autoplay policies
        if (this.ambience) await this.ambience.play();
      } catch {}
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
    };
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
  }

  // convenience: preload an asset
  preload(src: string) {
    try {
      const a = new Audio();
      a.src = src;
      a.preload = 'auto';
      return a;
    } catch {
      return null;
    }
  }
}

export const AudioManager = new _AudioManager();

export default AudioManager;
