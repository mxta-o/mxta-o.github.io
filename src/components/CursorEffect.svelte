<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    // ── Hide native cursor ──
    document.body.style.cursor = 'none';

    const dotEl = document.getElementById('cursor-dot') as HTMLElement;
    const ringEl = document.getElementById('cursor-ring') as HTMLElement;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;
    let hovered = false;
    let clicking = false;

    // ── Trail canvas ──
    let ctx: any, f: any, pos: any = { x: mouseX, y: mouseY }, lines: any[] = [];
    const E = {
      friction: 0.5,
      trails: 25,
      size: 50,
      dampening: 0.25,
      tension: 0.98,
    };

    // ── Trail node & line classes ──
    function TrailNode(this: any) { this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; }

    function Oscillator(this: any, e: any) {
      this.phase = e.phase || 0;
      this.offset = e.offset || 0;
      this.frequency = e.frequency || 0.001;
      this.amplitude = e.amplitude || 1;
    }
    Oscillator.prototype.update = function () {
      this.phase += this.frequency;
      return this.offset + Math.sin(this.phase) * this.amplitude;
    };

    function TrailLine(this: any, e: any) {
      this.spring = e.spring + 0.1 * Math.random() - 0.02;
      this.friction = E.friction + 0.01 * Math.random() - 0.002;
      this.nodes = [];
      for (let i = 0; i < E.size; i++) {
        const t = new (TrailNode as any)();
        t.x = pos.x; t.y = pos.y;
        this.nodes.push(t);
      }
    }
    TrailLine.prototype.update = function () {
      let e = this.spring, t = this.nodes[0];
      t.vx += (pos.x - t.x) * e;
      t.vy += (pos.y - t.y) * e;
      for (let i = 0; i < this.nodes.length; i++) {
        t = this.nodes[i];
        if (i > 0) {
          const n = this.nodes[i - 1];
          t.vx += (n.x - t.x) * e;
          t.vy += (n.y - t.y) * e;
          t.vx += n.vx * E.dampening;
          t.vy += n.vy * E.dampening;
        }
        t.vx *= this.friction;
        t.vy *= this.friction;
        t.x += t.vx;
        t.y += t.vy;
        e *= E.tension;
      }
    };
    TrailLine.prototype.draw = function () {
      let n = this.nodes[0].x, i = this.nodes[0].y;
      ctx.beginPath();
      ctx.moveTo(n, i);
      for (let a = 1, o = this.nodes.length - 2; a < o; a++) {
        const e = this.nodes[a], t = this.nodes[a + 1];
        n = 0.5 * (e.x + t.x);
        i = 0.5 * (e.y + t.y);
        ctx.quadraticCurveTo(e.x, e.y, n, i);
      }
      const e = this.nodes[this.nodes.length - 2], t = this.nodes[this.nodes.length - 1];
      ctx.quadraticCurveTo(e.x, e.y, t.x, t.y);
      ctx.stroke();
      ctx.closePath();
    };

    // ── Burst particles ──
    interface Particle { x: number; y: number; vx: number; vy: number; life: number; }
    let particles: Particle[] = [];

    function spawnBurst(x: number, y: number) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
        const speed = 2.5 + Math.random() * 3;
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1 });
      }
    }

    // ── Event handlers ──
    function onMove(e: MouseEvent | TouchEvent) {
      if ((e as TouchEvent).touches) {
        pos.x = mouseX = (e as TouchEvent).touches[0].clientX;
        pos.y = mouseY = (e as TouchEvent).touches[0].clientY;
      } else {
        pos.x = mouseX = (e as MouseEvent).clientX;
        pos.y = mouseY = (e as MouseEvent).clientY;
      }
      // Restart the loop if it was paused by a smooth scroll
      if (performance.now() - lastRafTime > 100) restartIfNeeded();
    }
    function onMousedown(e: MouseEvent) { clicking = true; spawnBurst(e.clientX, e.clientY); }
    function onMouseup() { clicking = false; }

    const onEnterInteractive = () => { hovered = true; };
    const onLeaveInteractive = () => { hovered = false; };
    function bindInteractiveElements() {
      document.querySelectorAll('a, button, [role="button"]').forEach(el => {
        el.addEventListener('mouseenter', onEnterInteractive);
        el.addEventListener('mouseleave', onLeaveInteractive);
      });
    }

    // ── Main render loop ──
    let running = true;
    let rafId = 0;
    let lastRafTime = 0;
    function render() {
      if (!running) return;
      lastRafTime = performance.now();

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      // Trail
      ctx.strokeStyle = 'hsla(199, 89%, 48%, 0.2)';
      ctx.lineWidth = 1;
      for (const line of lines) { line.update(); line.draw(); }

      // Burst particles
      particles = particles.filter(p => p.life > 0);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.88; p.vy *= 0.88;
        p.life -= 0.045;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(199, 90%, 70%, ${p.life})`;
        ctx.fill();
      }

      // Dot — snaps instantly
      dotEl.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;

      // Ring — lerp follow + scale on hover/click
      ringX += (mouseX - ringX) * 0.13;
      ringY += (mouseY - ringY) * 0.13;
      const ringSize = hovered ? 52 : clicking ? 20 : 34;
      ringEl.style.transform = `translate(${ringX - ringSize / 2}px, ${ringY - ringSize / 2}px)`;
      ringEl.style.width = ringEl.style.height = `${ringSize}px`;
      ringEl.style.opacity = hovered ? '1' : '0.65';

      rafId = requestAnimationFrame(render);
    }

    function restartIfNeeded() {
      if (running) {
        cancelAnimationFrame(rafId);
        render();
      }
    }

    function resizeCanvas() {
      ctx.canvas.width = window.innerWidth;
      ctx.canvas.height = window.innerHeight;
    }

    // ── Init ──
    const canvas = document.getElementById('cursor-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    f = new (Oscillator as any)({ phase: Math.random() * 2 * Math.PI, amplitude: 85, frequency: 0.0015, offset: 285 });
    resizeCanvas();

    lines = [];
    for (let i = 0; i < E.trails; i++)
      lines.push(new (TrailLine as any)({ spring: 0.4 + (i / E.trails) * 0.025 }));

    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove as any, { passive: true });
    document.addEventListener('touchstart', onMove as any, { passive: true });
    document.addEventListener('mousedown', onMousedown);
    document.addEventListener('mouseup', onMouseup);
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('focus', restartIfNeeded);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) restartIfNeeded(); });
    // Bind after a tick so all DOM elements exist
    setTimeout(bindInteractiveElements, 300);

    render();

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mousedown', onMousedown);
      document.removeEventListener('mouseup', onMouseup);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('focus', restartIfNeeded);
    };
  });
</script>

<canvas
  id="cursor-canvas"
  style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;"
></canvas>

<!-- Dot: snaps instantly to cursor -->
<div
  id="cursor-dot"
  style="position:fixed;top:0;left:0;width:8px;height:8px;background:#0ea5e9;border-radius:50%;pointer-events:none;z-index:9999;will-change:transform;"
></div>

<!-- Ring: lags behind, scales on hover/click -->
<div
  id="cursor-ring"
  style="position:fixed;top:0;left:0;width:34px;height:34px;border:1.5px solid rgba(14,165,233,0.65);border-radius:50%;pointer-events:none;z-index:9999;will-change:transform;transition:width 0.18s ease,height 0.18s ease,opacity 0.18s ease;"
></div>
