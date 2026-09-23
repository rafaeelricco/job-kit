export { PixelField }

import { cn } from "@lib/utils"

const COLS = 48
const ROWS = 24
const STEP = 12 // 10-unit square + 2-unit gap

/** Deterministic noise in [0, 1): the same pattern on every render and every visit. */
const noise = (x: number, y: number): number => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return n - Math.floor(n)
}

// Density and brightness rise toward the bottom edge, fading into the black above.
const CELLS = Array.from({ length: COLS * ROWS }, (_, i) => ({ x: i % COLS, y: Math.floor(i / COLS) }))
  .map(({ x, y }) => ({ x, y, depth: y / (ROWS - 1), n: noise(x, y) }))
  .filter(({ depth, n }) => n < 0.15 + 0.8 * depth)
  .map(({ x, y, depth, n }) => ({ x, y, opacity: 0.06 + 0.55 * depth * (1 - n) }))

function PixelField({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative overflow-hidden bg-black", className)}>
      <svg
        className="absolute inset-x-0 bottom-0 h-2/5 w-full"
        viewBox={`0 0 ${COLS * STEP} ${ROWS * STEP}`}
        preserveAspectRatio="xMidYMax slice"
      >
        {CELLS.map(({ x, y, opacity }) => (
          <rect key={`${x}-${y}`} x={x * STEP} y={y * STEP} width={10} height={10} fill="white" opacity={opacity} />
        ))}
      </svg>
      <div className="absolute top-0 left-1/2 aspect-[2/1] w-[240%] max-w-none -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.08)_22%,rgba(255,255,255,0.03)_45%,transparent_70%)]" />
    </div>
  )
}
