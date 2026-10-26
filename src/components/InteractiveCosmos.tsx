import { useEffect, useRef } from "react";

type InteractiveCosmosProps = { variant: "constellation" | "starfield"; className?: string };
type Star = { x: number; y: number; radius: number; phase: number; speed: number; alpha: number; driftX: number; driftY: number; flowX: number; flowY: number };

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
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -1000, y: -1000, vx: 0, vy: 0 };
    let previousPointer = { x: -1000, y: -1000 };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = parent.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      if (previousPointer.x >= 0) {
        pointer.vx = Math.max(-36, Math.min(36, pointer.x - previousPointer.x));
        pointer.vy = Math.max(-36, Math.min(36, pointer.y - previousPointer.y));
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
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = variant === "constellation"
        ? Math.min(1900, Math.max(1100, Math.round(width * height / 460)))
        : Math.min(1450, Math.max(420, Math.round(width * height / 1150)));
      let seed = variant === "constellation" ? 60817 : 96241;
      const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      const galaxyRadius = Math.min(width * .36, height * .48);
      const centerX = width * .68;
      const centerY = height * .49;
      stars = Array.from({ length: count }, () => {
        const particle: Star = {
          x: random() * width, y: random() * height,
          radius: .35 + random() * 1.05, phase: random() * Math.PI * 2,
          speed: .003 + random() * .012, alpha: .2 + random() * .6,
          driftX: 0, driftY: 0, flowX: 0, flowY: 0,
        };
        if (variant === "constellation" && random() > .11) {
          const arm = Math.floor(random() * 3);
          const distance = Math.pow(random(), .82) * galaxyRadius;
          const spread = (random() + random() + random() - 1.5) * (.025 + distance * .00042);
          const angle = arm * (Math.PI * 2 / 3) + distance / galaxyRadius * 4.7 + spread;
          particle.x = centerX + Math.cos(angle) * distance;
          particle.y = centerY + Math.sin(angle) * distance * .64 + (random() - .5) * 8;
          particle.radius = random() > .965 ? 1.5 + random() * 1.4 : .35 + Math.pow(random(), 2) * 1.25;
          particle.alpha = .22 + random() * .73;
        }
        return particle;
      });
    };

    const draw = () => {
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
        const core = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width * .3, height * .42));
        core.addColorStop(0, "rgba(226, 235, 249, .16)");
        core.addColorStop(.12, "rgba(148, 171, 207, .07)");
        core.addColorStop(1, "rgba(96, 123, 167, 0)");
        context.fillStyle = core;
        context.fillRect(0, 0, width, height);
      }

      for (const star of stars) {
        let x = star.x;
        let y = star.y;
        if (variant === "constellation") {
          const rotation = reducedMotion ? 0 : tick * .000045;
          const baseX = star.x - centerX;
          const baseY = star.y - centerY;
          const cosine = Math.cos(rotation);
          const sine = Math.sin(rotation);
          x = centerX + baseX * cosine - baseY * sine + star.driftX;
          y = centerY + baseX * sine + baseY * cosine + star.driftY;
        } else {
          x += star.driftX;
          y += star.driftY;
        }
        const dx = x - pointerX;
        const dy = y - pointerY;
        const distance = Math.hypot(dx, dy);
        const nearby = Math.max(0, 1 - distance / (variant === "constellation" ? 250 : 180));
        if (!reducedMotion && nearby > 0) {
          const influence = nearby * nearby;
          star.flowX = Math.max(-3.5, Math.min(3.5, star.flowX + pointer.vx * influence * .07));
          star.flowY = Math.max(-3.5, Math.min(3.5, star.flowY + pointer.vy * influence * .07));
        }
        if (!reducedMotion) {
          star.driftX = Math.max(-44, Math.min(44, star.driftX + star.flowX));
          star.driftY = Math.max(-44, Math.min(44, star.driftY + star.flowY));
          star.flowX *= .88;
          star.flowY *= .88;
          star.driftX *= .994;
          star.driftY *= .994;
        }
        const shimmer = reducedMotion ? 0 : Math.sin(tick * star.speed + star.phase) * .2;
        const radius = star.radius + nearby * 1.5;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${nearby > .2 ? "205, 224, 255" : "230, 237, 249"}, ${Math.min(1, star.alpha + shimmer + nearby * .45)})`;
        context.shadowBlur = nearby > .25 || star.radius > 1.55 ? 10 : 0;
        context.shadowColor = "rgba(183, 206, 247, .9)";
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
