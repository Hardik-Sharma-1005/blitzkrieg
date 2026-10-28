import { useEffect, useRef } from "react";

type InteractiveCosmosProps = {
  variant: "constellation" | "starfield";
  className?: string;
  tone?: "light" | "dark";
  particlesOnly?: boolean;
  introBolt?: boolean;
};

type Star = {
  x: number;
  y: number;
  depth: number;
  radius: number;
  phase: number;
  speed: number;
  alpha: number;
  hue: number;
  driftX: number;
  driftY: number;
  flowX: number;
  flowY: number;
  originX: number;
  originY: number;
  ambientX: number;
  ambientY: number;
  boltMember: boolean;
  introRadius: number;
  introDelay: number;
};

const LIGHT_STAR_PALETTE = ["#246b5d", "#1d584c", "#273e57", "#395270", "#9b742a"];
const DARK_STAR_PALETTE = ["#67e8f9", "#bae6fd", "#e0e7ff", "#f5d0fe", "#ffffff"];
let landingBoltIntroClaimed = false;

/** High-DPI space particles that pick up a soft directional drift from pointer movement. */
export function InteractiveCosmos({ variant, className = "", tone = "dark", particlesOnly = false, introBolt = false }: InteractiveCosmosProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boltIntroStartRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !parent || !context) return;

    if (introBolt && boltIntroStartRef.current === null) {
      if (!landingBoltIntroClaimed) {
        boltIntroStartRef.current = performance.now();
        landingBoltIntroClaimed = true;
      } else {
        boltIntroStartRef.current = -1;
        landingBoltIntroClaimed = true;
      }
    }
    const runBoltIntro = introBolt && (boltIntroStartRef.current ?? -1) > 0;

    let width = 0;
    let height = 0;
    let frame = 0;
    let stars: Star[] = [];
    let tick = 0;
    let introStart = 0;
    let iconScale = 1;
    let boltStart = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lightBackground = tone === "light";
    const pointer = { x: -1000, y: -1000, vx: 0, vy: 0 };
    let previousPointer = { x: -1000, y: -1000 };
    const hues = [210, 210, 210, 210, 210, 165];

    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      if (previousPointer.x >= 0) {
        pointer.vx = Math.max(-28, Math.min(28, pointer.x - previousPointer.x));
        pointer.vy = Math.max(-28, Math.min(28, pointer.y - previousPointer.y));
      }
      previousPointer = { x: pointer.x, y: pointer.y };
    };

    const onPointerLeave = () => {
      previousPointer = { x: -1000, y: -1000 };
      pointer.x = -1000;
      pointer.y = -1000;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave, { passive: true });

    const resize = () => {
      const isFixed = window.getComputedStyle(canvas).position === "fixed";
      if (isFixed) {
        width = Math.max(1, window.innerWidth);
        height = Math.max(1, window.innerHeight);
      } else {
        const bounds = parent.getBoundingClientRect();
        width = Math.max(1, bounds.width);
        height = Math.max(1, bounds.height);
      }

      const ratio = variant === "constellation"
        ? Math.min(window.devicePixelRatio || 1, 1.25)
        : Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const count = variant === "constellation"
        ? Math.min(950, Math.max(450, Math.round(width * height / 950)))
        : Math.min(750, Math.max(300, Math.round(width * height / 1400)));

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
        const sizeRoll = random();
        let starRadius: number;
        if (sizeRoll > 0.965) {
          // ~3.5% noticeable prominent stars (distinct, sparkling focal stars)
          starRadius = 2.4 + random() * 0.9;
        } else if (sizeRoll > 0.86) {
          // ~10.5% medium-large stars
          starRadius = 1.55 + random() * 0.65;
        } else {
          // ~86% fine ambient stardust
          starRadius = 0.35 + random() * 1.05;
        }

        const particle: Star = {
          x: random() * width, y: random() * height,
          depth: (random() - .5) * .24,
          radius: starRadius, phase: random() * Math.PI * 2,
          speed: .003 + random() * .012, alpha: .2 + random() * .6,
          hue: 210,
          driftX: 0, driftY: 0, flowX: 0, flowY: 0,
          originX: width / 2 + rayX * (edgeDistance + 24 + random() * 90),
          originY: height / 2 + rayY * (edgeDistance + 24 + random() * 90),
          ambientX: 0,
          ambientY: 0,
          boltMember: false,
          introRadius: 0,
          introDelay: random() * 1100,
        };
        particle.ambientX = particle.x;
        particle.ambientY = particle.y;
        if (runBoltIntro && variant === "starfield" && random() < .9) {
          particle.boltMember = true;
          // Sample the bolt's recognizable lightning silhouette, leaving its center open.
          const outline = [
            [-.145, -.5], [.145, -.5], [.053, -.08], [.222, -.08], [-.144, .5], [-.059, .15], [-.222, .15],
          ];
          const lengths = outline.map((point, index) => Math.hypot(point[0] - outline[(index + 1) % outline.length][0], point[1] - outline[(index + 1) % outline.length][1]));
          let edge = random() * lengths.reduce((sum, value) => sum + value, 0);
          let edgeIndex = 0;
          while (edgeIndex < lengths.length - 1 && edge > lengths[edgeIndex]) edge -= lengths[edgeIndex++];
          const a = outline[edgeIndex];
          const b = outline[(edgeIndex + 1) % outline.length];
          const t = edge / lengths[edgeIndex];
          const heroHeight = Math.min(window.innerHeight, height);
          const scale = Math.min(width * .45, heroHeight * .84);
          const segmentLength = lengths[edgeIndex] || 1;
          const spread = (random() + random() - 1) * .014;
          const localX = a[0] + (b[0] - a[0]) * t - ((b[1] - a[1]) / segmentLength) * spread;
          const localY = a[1] + (b[1] - a[1]) * t + ((b[0] - a[0]) / segmentLength) * spread;
          const boltX = width * .5 + localX * scale;
          const boltY = heroHeight * .50 + localY * scale;
          particle.x = boltX;
          particle.y = boltY;
          particle.introDelay = random() * 500;
          particle.introRadius = .7 + random() * 1.8;
        }
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
      if (!boltStart && runBoltIntro) boltStart = boltIntroStartRef.current ?? now;
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
            starGradient.addColorStop(0, "#246b5d");
            starGradient.addColorStop(.28, "#2e5b52");
            starGradient.addColorStop(.56, "#2b3f56");
            starGradient.addColorStop(.78, "#354e6b");
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
        cursorGlow.addColorStop(0, lightBackground ? "rgba(37, 99, 235, 0.10)" : "rgba(59, 130, 246, 0.24)");
        cursorGlow.addColorStop(0.38, lightBackground ? "rgba(59, 130, 246, 0.04)" : "rgba(147, 197, 253, 0.10)");
        cursorGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
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

      const palette = lightBackground ? LIGHT_STAR_PALETTE : DARK_STAR_PALETTE;

      for (let starIndex = 0; starIndex < stars.length; starIndex++) {
        const star = stars[starIndex];
        let x = introBolt && variant === "starfield" ? star.ambientX : star.x;
        let y = introBolt && variant === "starfield" ? star.ambientY : star.y;
        let introX = star.x;
        let introY = star.y;
        let introAlpha = 0;
        if (runBoltIntro && variant === "starfield" && !reducedMotion && star.boltMember) {
          const elapsed = now - boltStart;
          const arrive = 2000;
          const hold = 1500;
          const motionElapsed = elapsed - star.introDelay;
          if (motionElapsed < arrive) {
            const progress = Math.max(0, Math.min(1, motionElapsed / arrive));
            const eased = progress * progress * (3 - 2 * progress);
            const dx = star.x - star.originX;
            const dy = star.y - star.originY;
            const length = Math.hypot(dx, dy) || 1;
            const bend = Math.sin(progress * Math.PI) * Math.sin(star.phase) * Math.min(64, length * .045);
            introX = star.originX + dx * eased - (dy / length) * bend;
            introY = star.originY + dy * eased + (dx / length) * bend;
            introAlpha = progress < .12 ? progress / .12 : 1;
          } else if (motionElapsed < arrive + hold) {
            const orbit = tick * .045 + star.phase;
            introX += Math.cos(orbit) * 3.2;
            introY += Math.sin(orbit) * 5.4;
            introAlpha = .82 + .18 * (.5 + .5 * Math.sin(orbit * 1.7));
          } else {
            const progress = Math.min(1, (motionElapsed - arrive - hold) / 1100);
            const eased = progress * progress * (3 - 2 * progress);
            const angle = star.phase;
            const distance = Math.max(width, window.innerHeight) * .8;
            introX = star.x + Math.cos(angle) * distance * eased;
            introY = star.y + Math.sin(angle) * distance * eased;
            introAlpha = 1 - eased;
          }
        }
        if (variant === "constellation") {
          const arrival = reducedMotion ? 1 : Math.max(0, Math.min(1, (now - introStart - star.introDelay) / 5900));
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
        const nearby = Math.max(0, 1 - distance / (variant === "constellation" ? 250 : 135));

        if (!reducedMotion && nearby > 0) {
          const influence = nearby * nearby;
          star.flowX = Math.max(-2.8, Math.min(2.8, star.flowX + pointer.vx * influence * .07));
          star.flowY = Math.max(-2.8, Math.min(2.8, star.flowY + pointer.vy * influence * .07));
        }
        if (!reducedMotion) {
          star.driftX = Math.max(-38, Math.min(38, star.driftX + star.flowX));
          star.driftY = Math.max(-38, Math.min(38, star.driftY + star.flowY));
          star.flowX *= .9;
          star.flowY *= .9;
          star.driftX *= .993;
          star.driftY *= .993;
        }

        const shimmer = reducedMotion ? 0 : Math.sin(tick * star.speed * 1.12 + star.phase) * .16;
        const radius = star.radius + nearby * 0.75;

        if (variant === "constellation") {
          const alpha = Math.min(1, star.alpha + shimmer + nearby * .45);
          const hueIndex = nearby > .2 ? 5 : hues.indexOf(star.hue);
          const bucket = Math.max(1, Math.min(12, Math.round(alpha * 12)));
          particleBatches[hueIndex * 12 + bucket - 1].arcs.push(x, y, radius);
          if (star.radius > 1.55 || nearby > .25) glowStars.push(x, y, radius, hues[hueIndex], alpha);
        } else {
          const starColor = palette[starIndex % palette.length];
          const isNoticeable = star.radius > 1.8;
          const calculatedAlpha = lightBackground
            ? Math.min(isNoticeable ? 0.6 : 0.42, Math.max(0.12, (star.alpha + shimmer) * (isNoticeable ? 0.58 : 0.44) + nearby * 0.32))
            : Math.min(isNoticeable ? 0.95 : 0.72, Math.max(0.2, (star.alpha + shimmer) * (isNoticeable ? 0.85 : 0.65) + nearby * 0.35));

          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.globalAlpha = calculatedAlpha;
          context.fillStyle = particlesOnly
            ? starColor
            : nearby > .2
            ? (lightBackground ? "#246b5d" : "#ffffff")
            : starGradient ?? (lightBackground ? "#29415c" : "#eef2ff");
          context.shadowBlur = isNoticeable
            ? (lightBackground ? 4 : 8)
            : (star.radius > 1.35 && nearby > 0.1) ? (lightBackground ? 3 : 5) : 0;
          context.shadowColor = lightBackground ? "rgba(36, 107, 93, 0.4)" : "rgba(59, 130, 246, 0.7)";
          context.fill();
          context.shadowBlur = 0;
          context.globalAlpha = 1;
          if (runBoltIntro && star.boltMember && introAlpha > .005) {
            context.beginPath();
            context.arc(introX, introY, star.introRadius, 0, Math.PI * 2);
            context.globalAlpha = introAlpha;
            context.fillStyle = lightBackground ? "#B58DAA" : "#f0a8ff";
            context.shadowBlur = 10;
            context.shadowColor = lightBackground ? "rgba(181, 141, 170, .65)" : "rgba(224, 115, 255, .95)";
            context.fill();
            context.shadowBlur = 0;
            context.globalAlpha = 1;
          }
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
    window.addEventListener("resize", resize);
    resize();
    draw();

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(frame);
    };
  }, [variant, tone, particlesOnly, introBolt]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none ${className.includes("fixed") ? "fixed inset-0 h-screen w-screen" : "absolute inset-0 h-full w-full"} ${className}`}
    />
  );
}
