/**
 * Ambient Soise statue (the Venus torso, swz-statue.jpg) used as a quiet brand
 * watermark — never forefront. It's a black-line-art JPG on white, so we blend
 * it into the surface instead of dropping a white box:
 *   - tone="dark"  → dark lines for LIGHT surfaces (multiply drops the white)
 *   - tone="light" → light lines for DARK surfaces (invert, then screen)
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
      src="/swz-statue.jpg"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`pointer-events-none select-none ${className}`}
      style={{
        width,
        opacity: opacity ?? (isLight ? 0.12 : 0.05),
        filter: isLight ? 'invert(1)' : 'none',
        mixBlendMode: isLight ? 'screen' : 'multiply',
        ...style,
      }}
    />
  );
}
