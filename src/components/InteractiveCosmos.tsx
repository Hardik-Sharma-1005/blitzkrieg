import { useEffect, useRef } from "react";

type InteractiveCosmosProps = { variant: "constellation" | "starfield"; className?: string };
type Star = { x: number; y: number; depth: number; radius: number; phase: number; speed: number; alpha: number; hue: number; driftX: number; driftY: number; flowX: number; flowY: number; originX: number; originY: number; introDelay: number };

/** High-DPI space particles that pick up a soft directional drift from pointer movement. */
export function InteractiveCosmos({ variant, className = "" }: InteractiveCosmosProps) {
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
    const pointer = { x: -1000, y: -1000, vx: 0, vy: 0 };
    let previousPointer = { x: -1000, y: -1000 };
    const hues = [224, 248, 268, 292, 316, 205];

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
        ? Math.min(3000, Math.max(1600, Math.round(width * height / 270)))
        : Math.min(420, Math.max(120, Math.round(width * height / 3600)));
      let seed = variant === "constellation" ? 60817 : 96241;
      const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      iconScale = Math.min(width * .24, height * .44);
      const centerX = width * .70;
      const centerY = height * .5;
      const strokes: Array<{ x1: number; y1: number; x2: number; y2: number; radius: number }> = [];
      const addStroke = (x1: number, y1: number, x2: number, y2: number, radius: number) => strokes.push({ x1, y1, x2, y2, radius });
      // Lightning bolt outline. Stars follow only the contour, with the same
      // stroke thickness used by the previous terminal mark.
      addStroke(-.075, -.72, .5, -.72, .045);
      addStroke(.5, -.72, .2, -.216, .045);
      addStroke(.2, -.216, .5, -.216, .045);
      addStroke(.5, -.216, -.4, .72, .045);
      addStroke(-.4, .72, -.15, .0576, .045);
      addStroke(-.15, .0576, -.5, .0576, .045);
      addStroke(-.5, .0576, -.075, -.72, .045);
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
          hue: [224, 248, 268, 292, 316][Math.floor(random() * 5)],
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

      if (variant === "starfield" && pointerX >= 0) {
        const haze = context.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, Math.max(190, width * .28));
        haze.addColorStop(0, "rgba(135, 158, 195, .11)");
        haze.addColorStop(1, "rgba(135, 158, 195, 0)");
        context.fillStyle = haze;
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

      const introProgress = variant === "constellation" && !reducedMotion
        ? Math.max(0, Math.min(1, (now - introStart) / 7000))
        : 1;

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
          const arrival = Math.max(0, Math.min(1, (now - introStart - star.introDelay) / 5900));
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
        const dx = pointerIsActive ? x - pointerX : 0;
        const dy = pointerIsActive ? y - pointerY : 0;
        const distance = pointerIsActive ? Math.hypot(dx, dy) : Infinity;
        const nearby = Math.max(0, 1 - distance / (variant === "constellation" ? 250 : 180));
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
          context.fillStyle = `rgba(${nearby > .2 ? "205, 224, 255" : "230, 237, 249"}, ${alpha})`;
          context.shadowBlur = star.radius > 1.55 ? 10 : 0;
          context.shadowColor = "rgba(183, 206, 247, .9)";
          context.fill();
          context.shadowBlur = 0;
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
  }, [variant]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
