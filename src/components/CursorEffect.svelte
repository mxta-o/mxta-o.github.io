<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    let ctx: any, f: any, e = 0, pos: any = {}, lines: any[] = [];
    const E = {
      debug: true,
      friction: 0.5,
      trails: 20,
      size: 50,
      dampening: 0.25,
      tension: 0.98,
    };

    function Node(this: any) {
      this.x = 0;
      this.y = 0;
      this.vy = 0;
      this.vx = 0;
    }

    function n(this: any, e: any) {
      this.init(e || {});
    }
    n.prototype = {
      init: function (e: any) {
        this.phase = e.phase || 0;
        this.offset = e.offset || 0;
        this.frequency = e.frequency || 0.001;
        this.amplitude = e.amplitude || 1;
      },
      update: function () {
        this.phase += this.frequency;
        return this.offset + Math.sin(this.phase) * this.amplitude;
      },
      value: function () {
        return e;
      },
    };

    function Line(this: any, e: any) {
      this.init(e || {});
    }
    Line.prototype = {
      init: function (e: any) {
        this.spring = e.spring + 0.1 * Math.random() - 0.02;
        this.friction = E.friction + 0.01 * Math.random() - 0.002;
        this.nodes = [];
        for (let n = 0; n < E.size; n++) {
          let t = new (Node as any)();
          t.x = pos.x || window.innerWidth / 2;
          t.y = pos.y || window.innerHeight / 2;
          this.nodes.push(t);
        }
      },
      update: function () {
        let e = this.spring, t = this.nodes[0];
        t.vx += ((pos.x || window.innerWidth / 2) - t.x) * e;
        t.vy += ((pos.y || window.innerHeight / 2) - t.y) * e;
        for (let i = 0, a = this.nodes.length; i < a; i++) {
          t = this.nodes[i];
          if (i > 0) {
            let n = this.nodes[i - 1];
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
      },
      draw: function () {
        let n = this.nodes[0].x, i = this.nodes[0].y;
        ctx.beginPath();
        ctx.moveTo(n, i);
        for (let a = 1, o = this.nodes.length - 2; a < o; a++) {
          let e = this.nodes[a], t = this.nodes[a + 1];
          n = 0.5 * (e.x + t.x);
          i = 0.5 * (e.y + t.y);
          ctx.quadraticCurveTo(e.x, e.y, n, i);
        }
        let e = this.nodes[this.nodes.length - 2], t = this.nodes[this.nodes.length - 1];
        ctx.quadraticCurveTo(e.x, e.y, t.x, t.y);
        ctx.stroke();
        ctx.closePath();
      },
    };

    function onMousemove(evt: any) {
      function o() {
        lines = [];
        for (let e = 0; e < E.trails; e++)
          lines.push(new (Line as any)({ spring: 0.4 + (e / E.trails) * 0.025 }));
      }
      function c(e: any) {
        if (e.touches) {
          pos.x = e.touches[0].pageX;
          pos.y = e.touches[0].pageY;
        } else {
          pos.x = e.clientX;
          pos.y = e.clientY;
        }
        e.preventDefault();
      }
      function l(e: any) {
        if (e.touches.length === 1) {
          pos.x = e.touches[0].pageX;
          pos.y = e.touches[0].pageY;
        }
      }
      document.removeEventListener('mousemove', onMousemove);
      document.removeEventListener('touchstart', onMousemove);
      document.addEventListener('mousemove', c);
      document.addEventListener('touchmove', c);
      document.addEventListener('touchstart', l);
      c(evt);
      o();
      render();
    }

    function render() {
      if (ctx.running) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.globalCompositeOperation = 'lighter';
        // Use cyan/blue gradient matching the website's accent colors (#0ea5e9 to #7dd3fc)
        const hue = 199; // Cyan blue color
        const saturation = 89;
        const lightness = 48 + Math.sin(f.update() * 0.01) * 15; // Subtle brightness variation
        ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.25)`;
        ctx.lineWidth = 1;
        for (let t = 0; t < E.trails; t++) {
          let e = lines[t];
          e.update();
          e.draw();
        }
        ctx.frame++;
        window.requestAnimationFrame(render);
      }
    }

    function resizeCanvas() {
      ctx.canvas.width = window.innerWidth;
      ctx.canvas.height = window.innerHeight;
    }

    const renderCanvas = function () {
      const canvas = document.getElementById('cursor-canvas') as HTMLCanvasElement;
      if (!canvas) return;
      
      ctx = canvas.getContext('2d');
      ctx.running = true;
      ctx.frame = 1;
      f = new (n as any)({
        phase: Math.random() * 2 * Math.PI,
        amplitude: 85,
        frequency: 0.0015,
        offset: 285,
      });
      document.addEventListener('mousemove', onMousemove);
      document.addEventListener('touchstart', onMousemove);
      document.body.addEventListener('orientationchange', resizeCanvas);
      window.addEventListener('resize', resizeCanvas);
      window.addEventListener('focus', () => {
        if (!ctx.running) {
          ctx.running = true;
          render();
        }
      });
      window.addEventListener('blur', () => {
        ctx.running = true;
      });
      resizeCanvas();
    };

    renderCanvas();

    return () => {
      if (ctx) {
        ctx.running = false;
      }
      document.removeEventListener('mousemove', onMousemove);
      document.removeEventListener('touchstart', onMousemove);
      document.body.removeEventListener('orientationchange', resizeCanvas);
      window.removeEventListener('resize', resizeCanvas);
    };
  });
</script>

<canvas 
  id="cursor-canvas" 
  style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;"
></canvas>
