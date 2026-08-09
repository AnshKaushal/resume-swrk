import { cn } from "@/lib/utils"

export function AnalysisLoader({ className }: { className?: string }) {
  return (
    <div className={cn("analysis-loader", className)}>
      <style>{` 
.analysis-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.analysis-loader svg {
  width: 100%;
  height: 100%;
  display: block;
}

.analysis-loader #al-browser {
  overflow: hidden;
}

.analysis-loader .al-grid-line {
  stroke: #222;
  stroke-width: 0.5;
}

.analysis-loader .al-browser-frame {
  fill: #111;
  stroke: #666;
  stroke-width: 1;
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.9));
}

.analysis-loader .al-browser-top {
  fill: #1a1a1a;
}

.analysis-loader .al-loading-text {
  font-family: var(--font-sans), sans-serif;
  font-size: 14px;
  fill: #e4e4e4;
}

.analysis-loader .al-skeleton {
  fill: #2d2d2d;
  rx: 4;
  ry: 4;
  animation: al-pulse 1.8s ease-in-out infinite;
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.02));
}

@keyframes al-pulse {
  0% {
    fill: #2d2d2d;
  }
  50% {
    fill: #505050;
  }
  100% {
    fill: #2d2d2d;
  }
}

.analysis-loader .al-trace-flow {
  stroke-width: 1;
  fill: none;
  stroke-dasharray: 120 600;
  stroke-dashoffset: 720;
  animation: al-flow 5s linear infinite;
  opacity: 0.95;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 8px currentColor) blur(0.5px);
  color: #00ccff;
}

.analysis-loader .al-trace-flow:nth-child(1) {
  stroke: url(#al-trace-gradient-1);
}

.analysis-loader .al-trace-flow:nth-child(2) {
  stroke: url(#al-trace-gradient-2);
}

.analysis-loader .al-trace-flow:nth-child(3) {
  stroke: url(#al-trace-gradient-3);
}

.analysis-loader .al-trace-flow:nth-child(4) {
  stroke: url(#al-trace-gradient-4);
}

@keyframes al-flow {
  from {
    stroke-dashoffset: 720;
  }
  to {
    stroke-dashoffset: 0;
  }
}`}</style>
      <svg
        viewBox="0 0 900 900"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient
            id="al-trace-gradient-1"
            x1={250}
            y1={120}
            x2={100}
            y2={200}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#00ccff" stopOpacity={1} />
            <stop offset="100%" stopColor="#00ccff" stopOpacity={0.5} />
          </linearGradient>
          <linearGradient
            id="al-trace-gradient-2"
            x1={650}
            y1={120}
            x2={800}
            y2={300}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#00ccff" stopOpacity={1} />
            <stop offset="100%" stopColor="#00ccff" stopOpacity={0.5} />
          </linearGradient>
          <linearGradient
            id="al-trace-gradient-3"
            x1={250}
            y1={380}
            x2={400}
            y2={400}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#00ccff" stopOpacity={1} />
            <stop offset="100%" stopColor="#00ccff" stopOpacity={0.5} />
          </linearGradient>
          <linearGradient
            id="al-trace-gradient-4"
            x1={650}
            y1={120}
            x2={500}
            y2={100}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#00ccff" stopOpacity={1} />
            <stop offset="100%" stopColor="#00ccff" stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <g id="al-grid">
          <g>
            <line x1={0} y1={0} x2={0} y2="100%" className="al-grid-line" />
            <line x1={100} y1={0} x2={100} y2="100%" className="al-grid-line" />
            <line x1={200} y1={0} x2={200} y2="100%" className="al-grid-line" />
            <line x1={300} y1={0} x2={300} y2="100%" className="al-grid-line" />
            <line x1={400} y1={0} x2={400} y2="100%" className="al-grid-line" />
            <line x1={500} y1={0} x2={500} y2="100%" className="al-grid-line" />
            <line x1={600} y1={0} x2={600} y2="100%" className="al-grid-line" />
            <line x1={700} y1={0} x2={700} y2="100%" className="al-grid-line" />
            <line x1={800} y1={0} x2={800} y2="100%" className="al-grid-line" />
            <line x1={900} y1={0} x2={900} y2="100%" className="al-grid-line" />
            <line x1={1000} y1={0} x2={1000} y2="100%" className="al-grid-line" />
            <line x1={1100} y1={0} x2={1100} y2="100%" className="al-grid-line" />
            <line x1={1200} y1={0} x2={1200} y2="100%" className="al-grid-line" />
            <line x1={1300} y1={0} x2={1300} y2="100%" className="al-grid-line" />
            <line x1={1400} y1={0} x2={1400} y2="100%" className="al-grid-line" />
            <line x1={1500} y1={0} x2={1500} y2="100%" className="al-grid-line" />
            <line x1={1600} y1={0} x2={1600} y2="100%" className="al-grid-line" />
          </g>
          <g>
            <line x1={0} y1={100} x2="100%" y2={100} className="al-grid-line" />
            <line x1={0} y1={200} x2="100%" y2={200} className="al-grid-line" />
            <line x1={0} y1={300} x2="100%" y2={300} className="al-grid-line" />
            <line x1={0} y1={400} x2="100%" y2={400} className="al-grid-line" />
            <line x1={0} y1={500} x2="100%" y2={500} className="al-grid-line" />
            <line x1={0} y1={600} x2="100%" y2={600} className="al-grid-line" />
            <line x1={0} y1={700} x2="100%" y2={700} className="al-grid-line" />
            <line x1={0} y1={800} x2="100%" y2={800} className="al-grid-line" />
          </g>
        </g>
        <g id="al-browser" transform="translate(0, 200)">
          <rect
            x={250}
            y={120}
            width={400}
            height={260}
            rx={8}
            ry={8}
            className="al-browser-frame"
          />
          <rect
            x={250}
            y={120}
            width={400}
            height={30}
            rx={8}
            ry={8}
            className="al-browser-top"
          />
          <text x={294} y={140} textAnchor="middle" className="al-loading-text">
            Loading...
          </text>
          <rect x={270} y={160} width={360} height={20} className="al-skeleton" />
          <rect x={270} y={190} width={200} height={15} className="al-skeleton" />
          <rect x={270} y={215} width={300} height={15} className="al-skeleton" />
          <rect x={270} y={240} width={360} height={90} className="al-skeleton" />
          <rect x={270} y={340} width={180} height={20} className="al-skeleton" />
        </g>
        <g id="al-traces" transform="translate(0, 200)">
          <path d="M100 300 H250 V120" className="al-trace-flow" />
          <path d="M800 200 H650 V380" className="al-trace-flow" />
          <path d="M400 520 V380 H250" className="al-trace-flow" />
          <path d="M500 50 V120 H650" className="al-trace-flow" />
        </g>
      </svg>
    </div>
  )
}
