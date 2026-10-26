import { useRef, type PointerEvent } from "react";

/** A cursor-lit, etched-glass terminal mark for the light home hero. */
export function InteractiveTerminalMark() {
  const markRef = useRef<HTMLDivElement>(null);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const mark = markRef.current;
    if (!mark) return;
    const bounds = mark.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    mark.style.setProperty("--terminal-light-x", `${x * 100}%`);
    mark.style.setProperty("--terminal-light-y", `${y * 100}%`);
    mark.style.setProperty("--terminal-tilt-x", `${(0.5 - y) * 7}deg`);
    mark.style.setProperty("--terminal-tilt-y", `${(x - 0.5) * 8}deg`);
  };

  const onPointerLeave = () => {
    const mark = markRef.current;
    if (!mark) return;
    mark.style.setProperty("--terminal-light-x", "50%");
    mark.style.setProperty("--terminal-light-y", "35%");
    mark.style.setProperty("--terminal-tilt-x", "0deg");
    mark.style.setProperty("--terminal-tilt-y", "0deg");
  };

  return (
    <div className="interactive-terminal-mark" ref={markRef} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} role="img" aria-label="Interactive etched-glass terminal symbol">
      <svg viewBox="0 0 280 250" aria-hidden="true" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="terminal-frame" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9b7650" />
            <stop offset=".48" stopColor="#753d36" />
            <stop offset="1" stopColor="#51423a" />
          </linearGradient>
          <linearGradient id="terminal-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffdf6" stopOpacity=".72" />
            <stop offset="1" stopColor="#e9e1d1" stopOpacity=".48" />
          </linearGradient>
          <linearGradient id="terminal-command" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#763c35" />
            <stop offset="1" stopColor="#57453a" />
          </linearGradient>
        </defs>
        <rect x="27" y="24" width="226" height="202" rx="28" fill="url(#terminal-glass)" stroke="url(#terminal-frame)" strokeWidth="5" />
        <path d="M29 72h222" stroke="#81684f" strokeOpacity=".45" strokeWidth="2" />
        <circle cx="52" cy="49" r="5" fill="#9b7650" />
        <circle cx="71" cy="49" r="5" fill="#874b3e" fillOpacity=".82" />
        <circle cx="90" cy="49" r="5" fill="#8b8668" fillOpacity=".9" />
        <path d="m83 113 38 31-38 31" fill="none" stroke="url(#terminal-command)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M42 214h196" stroke="#fffdf6" strokeOpacity=".58" strokeWidth="2" />
      </svg>
    </div>
  );
}
