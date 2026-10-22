/* Radioamador Brasil — ondas de rádio do hero.
   Módulo ES nativo, sem dependências, carregado somente na home.

   Contrato:
   - sem `[data-hero-canvas]` na página, o módulo não faz nada;
   - um único requestAnimationFrame, com teto de 30 fps e DPR máximo 1.5;
   - `getContext('2d')` nulo => desiste em silêncio e os anéis em CSS
     (hero__rings) continuam sendo a arte visível;
   - desenha UM quadro estático e para quando prefers-reduced-motion: reduce;
   - para quando a aba fica oculta e quando o hero sai da viewport;
   - não há controle de pausa na interface: quem precisa de menos movimento já
     é atendido por prefers-reduced-motion, e a animação não intercepta nada;
   - não intercepta ponteiro: o canvas é aria-hidden e pointer-events: none;
   - não usa localStorage.

   Geometria: anéis expandindo a partir de um centro deslocado para a direita
   (desktop) ou para baixo (mobile), 20 raios fixos e pacotes que correm para
   fora. Mesma lógica de projeção radial da referência lida em
   lptecsite/src/components/HeroBackground.tsx, reescrita em CSS-friendly. */

const canvas = document.querySelector("[data-hero-canvas]");

if (canvas && canvas.parentElement) {
  const ctx = canvas.getContext("2d", { alpha: true });

  if (ctx) {
    const RINGS = 22;
    const SPOKES = 20;
    const FRAME_MS = 1000 / 30;
    const MAX_DPR = 1.5;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let running = false;
    let visible = !document.hidden;
    let inView = true;
    let last = 0;
    let t = 0.8;
    let packets = [];

    const isNarrow = () => width < 860;

    const buildPackets = () => {
      const count = isNarrow() ? 14 : 30;
      packets = [];
      for (let i = 0; i < count; i += 1) {
        packets.push({
          z: Math.random(),
          speed: 0.00022 + Math.random() * 0.00042,
          warm: i % 4 === 0,
          arc: 0.03 + Math.random() * 0.05,
        });
      }
    };

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildPackets();
    };

    const geometry = () => {
      const narrow = isNarrow();
      return {
        cx: narrow ? width * 0.68 : width * 0.76,
        cy: narrow ? height * 0.86 : height * 0.5,
        base: Math.min(width, height) * (narrow ? 0.72 : 0.5),
      };
    };

    const frame = () => {
      ctx.clearRect(0, 0, width, height);
      const { cx, cy, base } = geometry();

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 0.9);
      glow.addColorStop(0, "rgba(245, 197, 66, 0.13)");
      glow.addColorStop(0.45, "rgba(245, 197, 66, 0.03)");
      glow.addColorStop(1, "rgba(245, 197, 66, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, base * 0.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 1;

      for (let i = 1; i <= RINGS; i += 1) {
        const z = i / RINGS;
        const radius = base * Math.pow(z, 1.28) * (1 + 0.018 * Math.sin(t * 0.7 + i * 0.35));
        const alpha = 0.13 * (1 - z * 0.62);
        ctx.strokeStyle = "rgba(244, 246, 250, " + alpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(244, 246, 250, 0.045)";
      for (let s = 0; s < SPOKES; s += 1) {
        const a = (s / SPOKES) * Math.PI * 2 + t * 0.012;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * base * 0.16, cy + Math.sin(a) * base * 0.16);
        ctx.lineTo(cx + Math.cos(a) * base * 0.99, cy + Math.sin(a) * base * 0.99);
        ctx.stroke();
      }

      for (let p = 0; p < packets.length; p += 1) {
        const packet = packets[p];
        const radius = base * packet.z;
        const fade = Math.sin(Math.PI * packet.z);
        if (fade <= 0.02) continue;
        const a = (p / packets.length) * Math.PI * 2 + packet.z * 1.1;
        ctx.strokeStyle = packet.warm
          ? "rgba(245, 197, 66, " + (0.5 * fade).toFixed(3) + ")"
          : "rgba(244, 246, 250, " + (0.32 * fade).toFixed(3) + ")";
        ctx.lineWidth = packet.warm ? 2 : 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, a, a + packet.arc);
        ctx.stroke();
      }

      ctx.lineWidth = 1;
    };

    const step = (now) => {
      if (!running) return;
      raf = window.requestAnimationFrame(step);
      if (last === 0) last = now;
      const elapsed = now - last;
      if (elapsed < FRAME_MS) return;
      last = now;
      for (let i = 0; i < packets.length; i += 1) {
        packets[i].z += packets[i].speed * elapsed;
        if (packets[i].z > 1) packets[i].z -= 1;
      }
      t += elapsed * 0.0009;
      frame();
    };

    const stop = () => {
      running = false;
      if (raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
      last = 0;
    };

    const start = () => {
      if (running || !visible || !inView || motionQuery.matches) return;
      running = true;
      raf = window.requestAnimationFrame(step);
    };

    const applyMotionPreference = () => {
      if (motionQuery.matches) {
        stop();
        t = 0.8;
        buildPackets();
        frame();
      } else {
        start();
      }
    };

    document.addEventListener("visibilitychange", () => {
      visible = !document.hidden;
      if (visible) {
        start();
      } else {
        stop();
      }
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          inView = entries.some((entry) => entry.isIntersecting);
          if (inView) {
            start();
          } else {
            stop();
          }
        },
        { threshold: 0 }
      );
      observer.observe(canvas);
    }

    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", applyMotionPreference);
    }

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(() => {
        resize();
        if (!running) frame();
      });
      resizeObserver.observe(canvas.parentElement);
    } else {
      window.addEventListener("resize", () => {
        resize();
        if (!running) frame();
      });
    }

    resize();
    applyMotionPreference();
  }
}
