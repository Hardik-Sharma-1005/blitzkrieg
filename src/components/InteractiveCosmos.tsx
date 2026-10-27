import { useEffect, useRef } from "react";

type InteractiveCosmosProps = { variant: "constellation" | "starfield"; className?: string; tone?: "light" | "dark"; particlesOnly?: boolean };
type Star = { x: number; y: number; depth: number; radius: number; phase: number; speed: number; alpha: number; hue: number; driftX: number; driftY: number; flowX: number; flowY: number; originX: number; originY: number; introDelay: number };

/** High-DPI space particles that pick up a soft directional drift from pointer movement. */
export function InteractiveCosmos({ variant, className = "", tone = "dark", particlesOnly = false }: InteractiveCosmosProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !parent || !context) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let stars: Star[] = [];
    let tick = 0;
    let introStart = 0;
    let iconScale = 1;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lightBackground = tone === "light";
    const pointer = { x: -1000, y: -1000, vx: 0, vy: 0 };
    let previousPointer = { x: -1000, y: -1000 };
    const hues = [210, 210, 210, 210, 210, 165];

    const onPointerMove = (event: PointerEvent) => {
      const bounds = parent.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      if (previousPointer.x >= 0) {
        pointer.vx = Math.max(-42, Math.min(42, pointer.x - previousPointer.x));
        pointer.vy = Math.max(-42, Math.min(42, pointer.y - previousPointer.y));
      }
      previousPointer = { x: pointer.x, y: pointer.y };
    };
    const onPointerLeave = () => {
      previousPointer = { x: -1000, y: -1000 };
      pointer.x = -1000;
      pointer.y = -1000;
    };
    parent.addEventListener("pointermove", onPointerMove, { passive: true });
    parent.addEventListener("pointerleave", onPointerLeave, { passive: true });

    const resize = () => {
      const bounds = parent.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      // Keep the CSS size and particle count unchanged while limiting the
      // backing canvas work per frame on high-DPI screens.
      const ratio = variant === "constellation"
        ? Math.min(window.devicePixelRatio || 1, 1.25)
        : Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = variant === "constellation"
        ? Math.min(620, Math.max(280, Math.round(width * height / 1500)))
        : Math.min(360, Math.max(120, Math.round(width * height / 3000)));
      let seed = variant === "constellation" ? 60817 : 96241;
      const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      iconScale = Math.min(width * .24, height * .44);
      const centerX = width * .70;
      const centerY = height * .5;
      const strokes: Array<{ x1: number; y1: number; x2: number; y2: number; radius: number }> = [];
      const addStroke = (x1: number, y1: number, x2: number, y2: number, radius: number) => strokes.push({ x1, y1, x2, y2, radius });
      const addRoundedCorner = (cx: number, cy: number, start: number) => {
        const cornerRadius = .16;
        let px = cx + Math.cos(start) * cornerRadius;
        let py = cy + Math.sin(start) * cornerRadius;
        for (let step = 1; step <= 8; step += 1) {
          const angle = start + step * Math.PI / 16;
          const x = cx + Math.cos(angle) * cornerRadius;
          const y = cy + Math.sin(angle) * cornerRadius;
          addStroke(px, py, x, y, .045);
          px = x;
          py = y;
        }
      };
      // Rounded terminal frame.
      addStroke(-.56, -.72, .56, -.72, .045);
      addStroke(.72, -.56, .72, .56, .045);
      addStroke(.56, .72, -.56, .72, .045);
      addStroke(-.72, .56, -.72, -.56, .045);
      addRoundedCorner(.56, -.56, -Math.PI / 2);
      addRoundedCorner(.56, .56, 0);
      addRoundedCorner(-.56, .56, Math.PI / 2);
      addRoundedCorner(-.56, -.56, Math.PI);
      // Terminal prompt and cursor line.
      addStroke(-.36, -.34, -.04, -.04, .052);
      addStroke(-.04, -.04, -.36, .27, .052);
      addStroke(.10, .31, .43, .31, .052);
      const strokeWeights = strokes.map((stroke) => Math.hypot(stroke.x2 - stroke.x1, stroke.y2 - stroke.y1));
      const totalStrokeWeight = strokeWeights.reduce((sum, length) => sum + length, 0);
      stars = Array.from({ length: count }, () => {
        const entryAngle = random() * Math.PI * 2;
        const rayX = Math.cos(entryAngle);
        const rayY = Math.sin(entryAngle);
        const edgeDistance = Math.min(
          width / 2 / Math.max(Math.abs(rayX), .001),
          height / 2 / Math.max(Math.abs(rayY), .001),
        );
        const particle: Star = {
          x: random() * width, y: random() * height,
          depth: (random() - .5) * .24,
          radius: .35 + random() * 1.05, phase: random() * Math.PI * 2,
          speed: .003 + random() * .012, alpha: .2 + random() * .6,
          hue: 210,
          driftX: 0, driftY: 0, flowX: 0, flowY: 0,
          originX: width / 2 + rayX * (edgeDistance + 24 + random() * 90),
          originY: height / 2 + rayY * (edgeDistance + 24 + random() * 90),
          introDelay: random() * 1100,
        };
        if (variant === "constellation" && random() > .02) {
          let choice = random() * totalStrokeWeight;
          let segmentIndex = 0;
          while (segmentIndex < strokes.length - 1 && choice > strokeWeights[segmentIndex]) {
            choice -= strokeWeights[segmentIndex];
            segmentIndex += 1;
          }
          const segment = strokes[segmentIndex];
          const t = random();
          const dx = segment.x2 - segment.x1;
          const dy = segment.y2 - segment.y1;
          const length = Math.hypot(dx, dy) || 1;
          const spread = (random() + random() + random() - 1.5) * (segment.radius + .018);
          const localX = segment.x1 + dx * t - (dy / length) * spread;
          const localY = segment.y1 + dy * t + (dx / length) * spread;
          particle.x = centerX + localX * iconScale;
          particle.y = centerY + localY * iconScale;
          particle.radius = random() > .965 ? 1.5 + random() * 1.4 : .35 + Math.pow(random(), 2) * 1.25;
          particle.alpha = .22 + random() * .73;
        }
        return particle;
      });

    };

    const particleBatches = hues.flatMap((hue, hueIndex) => Array.from({ length: 12 }, (_, index) => ({
      hue,
      hueIndex,
      alpha: (index + 1) / 12,
      color: `hsla(${hue}, 100%, ${hue === 205 ? 88 : 78}%, ${(index + 1) / 12})`,
      arcs: [] as number[],
    })));
    const glowStars: number[] = [];

    const draw = (now = performance.now()) => {
      if (!introStart) introStart = now;
      tick += reducedMotion ? 0 : 1;
      context.clearRect(0, 0, width, height);
      const pointerX = pointer.x;
      const pointerY = pointer.y;
      pointer.vx *= .74;
      pointer.vy *= .74;

      let starGradient: CanvasGradient | null = null;
      if (variant === "starfield") {
        if (!particlesOnly) {
          const backdrop = context.createLinearGradient(0, 0, width, height);
          if (lightBackground) {
            backdrop.addColorStop(0, "rgba(72, 92, 193, .12)");
            backdrop.addColorStop(.52, "rgba(128, 92, 178, .08)");
            backdrop.addColorStop(1, "rgba(43, 112, 160, .10)");
            starGradient = context.createLinearGradient(0, height, width, 0);
            starGradient.addColorStop(0, "#0b29fe");
            starGradient.addColorStop(.28, "#3569d8");
            starGradient.addColorStop(.56, "#6353a7");
            starGradient.addColorStop(.78, "#27345f");
            starGradient.addColorStop(1, "#17203c");
          } else {
            backdrop.addColorStop(0, "rgba(29, 45, 126, .42)");
            backdrop.addColorStop(.48, "rgba(36, 22, 83, .28)");
            backdrop.addColorStop(1, "rgba(11, 61, 92, .24)");
            starGradient = context.createLinearGradient(0, height, width, 0);
            starGradient.addColorStop(0, "#43dcff");
            starGradient.addColorStop(.25, "#0b29fe");
            starGradient.addColorStop(.5, "#9762ff");
            starGradient.addColorStop(.72, "#f0b9ff");
            starGradient.addColorStop(1, "#ffffff");
          }
          context.fillStyle = backdrop;
          context.fillRect(0, 0, width, height);
        }
        if (!particlesOnly) {
          const nebula = (x: number, y: number, radius: number, color: string) => {
            const cloud = context.createRadialGradient(x, y, 0, x, y, radius);
            cloud.addColorStop(0, color);
            cloud.addColorStop(1, "rgba(0, 0, 0, 0)");
            context.fillStyle = cloud;
            context.fillRect(0, 0, width, height);
          };
          if (lightBackground) {
            nebula(width * .2, height * .3, Math.max(width * .48, height * .6), "rgba(98, 113, 205, .09)");
            nebula(width * .83, height * .58, Math.max(width * .38, height * .5), "rgba(154, 92, 181, .07)");
          } else {
            nebula(width * .18, height * .27, Math.max(width * .48, height * .6), "rgba(49, 76, 202, .20)");
            nebula(width * .83, height * .6, Math.max(width * .4, height * .52), "rgba(126, 45, 173, .15)");
          }
        }
      }

      if (variant === "starfield" && pointerX >= 0 && !particlesOnly) {
        const glowRadius = Math.max(154, width * .21);
        const cursorGlow = context.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, glowRadius);
        cursorGlow.addColorStop(0, lightBackground ? "rgba(11, 41, 254, .085)" : "rgba(11, 41, 254, .22)");
        cursorGlow.addColorStop(.38, lightBackground ? "rgba(80, 105, 255, .045)" : "rgba(105, 126, 255, .10)");
        cursorGlow.addColorStop(1, "rgba(11, 41, 254, 0)");
        context.fillStyle = cursorGlow;
        context.fillRect(0, 0, width, height);
      }

      const centerX = width * .68;
      const centerY = height * .49;
      if (variant === "constellation") {
        const coreRadius = Math.min(width * .3, height * .42);
        const core = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);
        core.addColorStop(0, "rgba(226, 235, 249, .16)");
        core.addColorStop(.12, "rgba(148, 171, 207, .07)");
        core.addColorStop(1, "rgba(96, 123, 167, 0)");
        context.fillStyle = core;
        context.fillRect(centerX - coreRadius, centerY - coreRadius, coreRadius * 2, coreRadius * 2);
      }

      for (const batch of particleBatches) batch.arcs.length = 0;
      glowStars.length = 0;
      const pointerIsActive = pointerX >= 0;
      const pointerTiltX = variant === "constellation" && pointerIsActive ? (pointerX / width - .5) * .28 : 0;
      const pointerTiltY = variant === "constellation" && pointerIsActive ? (pointerY / height - .5) * .22 : 0;
      const idleTurn = variant === "constellation" && !reducedMotion ? Math.sin(tick * .0007) * .035 : 0;
      const cosY = Math.cos(pointerTiltX + idleTurn);
      const sinY = Math.sin(pointerTiltX + idleTurn);
      const cosX = Math.cos(pointerTiltY);
      const sinX = Math.sin(pointerTiltY);
      for (const star of stars) {
        let x = star.x;
        let y = star.y;
        if (variant === "constellation") {
          // Bring each particle in on its own randomized path. The stars form
          // the constellation as they arrive; no large shape scales in.
          const arrival = reducedMotion ? 1 : Math.max(0, Math.min(1, (now - introStart - star.introDelay) / 5900));
          // Quintic ease-in-out keeps the particles' starts and finishes soft.
          const easedArrival = arrival < .5
            ? 16 * arrival ** 5
            : 1 - Math.pow(-2 * arrival + 2, 5) / 2;
          x = star.originX + (star.x - star.originX) * easedArrival;
          y = star.originY + (star.y - star.originY) * easedArrival;
          const baseX = star.x - centerX;
          const baseY = star.y - centerY;
          const depth = star.depth * iconScale;
          const perspective = 1 + depth / (iconScale * 4);
          const targetX = centerX + (baseX * cosY + depth * sinY) * perspective + star.driftX;
          const targetY = centerY + (baseY * cosX - depth * sinX) * perspective + star.driftY;
          x += (targetX - x) * easedArrival;
          y += (targetY - y) * easedArrival;
          if (!reducedMotion) {
            // Gentle per-star orbital drift keeps the constellation alive even
            // while the pointer is idle, without disturbing its overall shape.
            x += Math.sin(tick * .013 + star.phase) * 2.8;
            y += Math.cos(tick * .011 + star.phase * .83) * 2.8;
          }
        } else {
          x += star.driftX;
          y += star.driftY;
        }
        let dx = pointerIsActive ? x - pointerX : 0;
        let dy = pointerIsActive ? y - pointerY : 0;
        let distance = pointerIsActive ? Math.hypot(dx, dy) : Infinity;
        const nearby = Math.max(0, 1 - distance / (variant === "constellation" ? 250 : 126));
        if (!reducedMotion && nearby > 0) {
          const influence = nearby * nearby;
          star.flowX = Math.max(-3.5, Math.min(3.5, star.flowX + pointer.vx * influence * .08));
          star.flowY = Math.max(-3.5, Math.min(3.5, star.flowY + pointer.vy * influence * .08));
        }
        if (!reducedMotion) {
          star.driftX = Math.max(-44, Math.min(44, star.driftX + star.flowX));
          star.driftY = Math.max(-44, Math.min(44, star.driftY + star.flowY));
          star.flowX *= .9;
          star.flowY *= .9;
          star.driftX *= .995;
          star.driftY *= .995;
        }
        const shimmer = reducedMotion ? 0 : Math.sin(tick * star.speed * 1.12 + star.phase) * .2;
        const radius = star.radius + nearby * 1.5;
        const alpha = Math.min(1, star.alpha + shimmer + nearby * .45);
        if (variant === "constellation") {
          // Group similarly colored dots into one canvas fill. This preserves
          // the palette while avoiding a fill and shadow-state change per star.
          const hueIndex = nearby > .2 ? 5 : hues.indexOf(star.hue);
          const bucket = Math.max(1, Math.min(12, Math.round(alpha * 12)));
          particleBatches[hueIndex * 12 + bucket - 1].arcs.push(x, y, radius);
          if (star.radius > 1.55 || nearby > .25) glowStars.push(x, y, radius, hues[hueIndex], alpha);
        } else {
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.globalAlpha = alpha;
          const particleColor = lightBackground ? "#0b29fe" : "#b9efff";
          context.fillStyle = particlesOnly ? particleColor : nearby > .2 ? (lightBackground ? "#0b29fe" : "#ffffff") : starGradient ?? "#eef2ff";
          context.shadowBlur = star.radius > 1.55 ? 10 : 0;
          context.shadowColor = particlesOnly
            ? (lightBackground ? "rgba(11, 41, 254, .65)" : "rgba(185, 239, 255, .7)")
            : lightBackground ? "rgba(11, 41, 254, .65)" : "rgba(196, 203, 255, .85)";
          context.fill();
          context.shadowBlur = 0;
          context.globalAlpha = 1;
        }
      }
      for (const batch of particleBatches) {
        context.beginPath();
        for (let index = 0; index < batch.arcs.length; index += 3) {
          const x = batch.arcs[index];
          const y = batch.arcs[index + 1];
          const radius = batch.arcs[index + 2];
          context.moveTo(x + radius, y);
          context.arc(x, y, radius, 0, Math.PI * 2);
        }
        context.fillStyle = batch.color;
        context.fill();
      }
      for (let index = 0; index < glowStars.length; index += 5) {
        const x = glowStars[index];
        const y = glowStars[index + 1];
        const radius = glowStars[index + 2];
        const hue = glowStars[index + 3];
        const alpha = glowStars[index + 4];
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = `hsla(${hue}, 100%, 80%, ${alpha})`;
        context.shadowBlur = 8;
        context.shadowColor = `hsla(${hue}, 100%, 72%, .75)`;
        context.fill();
        context.shadowBlur = 0;
      }
      if (!reducedMotion) frame = window.requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    resize();
    draw();
    return () => {
      observer.disconnect();
      parent.removeEventListener("pointermove", onPointerMove);
      parent.removeEventListener("pointerleave", onPointerLeave);
      window.cancelAnimationFrame(frame);
    };
  }, [variant, tone]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
