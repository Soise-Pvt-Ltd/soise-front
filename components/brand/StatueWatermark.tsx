/**
 * Ambient Soise statue (the Venus torso, swz-statue.png) used as a quiet brand
 * watermark — never forefront. Transparent black line art, so it sits on any
 * surface; we only flip the line colour by surface tone:
 *   - tone="dark"  → black lines for LIGHT surfaces (as-is)
 *   - tone="light" → white lines for DARK surfaces (inverted)
 *
 * Purely decorative: pointer-events off, aria-hidden, positioned by the caller.
 * Server-safe (no hooks).
 */
export default function StatueWatermark({
  tone = 'dark',
  width = 360,
  opacity,
  className = '',
  style,
}: {
  tone?: 'dark' | 'light';
  width?: number | string;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const isLight = tone === 'light';
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/swz-statue.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`pointer-events-none select-none ${className}`}
      style={{
        width,
        opacity: opacity ?? (isLight ? 0.14 : 0.06),
        filter: isLight ? 'invert(1)' : 'none',
        ...style,
      }}
    />
  );
}
