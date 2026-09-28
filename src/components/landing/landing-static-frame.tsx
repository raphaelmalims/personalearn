import { LogoMark } from "@/components/brand/logo";

const nodes = [
  { x: 18, y: 28 },
  { x: 30, y: 18 },
  { x: 72, y: 16 },
  { x: 84, y: 30 },
  { x: 16, y: 62 },
  { x: 28, y: 78 },
  { x: 74, y: 80 },
  { x: 86, y: 64 },
  { x: 48, y: 14 },
  { x: 50, y: 86 },
];

/**
 * Still frame for first paint and for `prefers-reduced-motion`.
 * Students sit on the field, documents sit mid-path, and the mark holds the centre.
 */
export function LandingStaticFrame() {
  return (
    <div className="absolute inset-0 text-foreground" aria-hidden>
      <svg
        className="h-full w-full font-sans"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="landing-still-wash" cx="50%" cy="46%" r="48%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.08" />
            <stop offset="55%" stopColor="currentColor" stopOpacity="0.03" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#landing-still-wash)" />
        {nodes.map((node) => (
          <line
            key={`${node.x}-${node.y}`}
            x1={node.x}
            y1={node.y}
            x2="50"
            y2="48"
            stroke="currentColor"
            strokeOpacity="0.16"
            strokeWidth="0.15"
          />
        ))}
        <g transform="translate(8 58)" stroke="currentColor" fill="none" strokeWidth="0.25">
          <rect width="16" height="10" rx="1.2" strokeOpacity="0.55" fill="currentColor" fillOpacity="0.04" />
          <text x="1.4" y="3.2" fill="currentColor" stroke="none" fontSize="2.1">
            Scheme
          </text>
        </g>
        <g transform="translate(76 22)" stroke="currentColor" fill="none" strokeWidth="0.25">
          <rect width="16" height="10" rx="1.2" strokeOpacity="0.55" fill="currentColor" fillOpacity="0.04" />
          <text x="1.4" y="3.2" fill="currentColor" stroke="none" fontSize="2.1">
            Paper
          </text>
        </g>
        <g transform="translate(42 8)" stroke="currentColor" fill="none" strokeWidth="0.25">
          <rect width="16" height="10" rx="1.2" strokeOpacity="0.55" fill="currentColor" fillOpacity="0.04" />
          <text x="1.4" y="3.2" fill="currentColor" stroke="none" fontSize="2.1">
            Script
          </text>
        </g>
        {nodes.map((node) => (
          <circle
            key={`n-${node.x}-${node.y}`}
            cx={node.x}
            cy={node.y}
            r="0.7"
            fill="currentColor"
            fillOpacity="0.85"
          />
        ))}
      </svg>
      <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2">
        <LogoMark className="h-14 w-14 sm:h-16 sm:w-16" title="PersonaLearn" />
      </div>
    </div>
  );
}
