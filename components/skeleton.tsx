/**
 * Instant loading states for route transitions.
 *
 * The storefront had no loading.tsx boundaries, so tapping a link left the
 * previous page frozen until the server had fully responded — several seconds
 * of no motion on a slow connection, which reads as a broken tap rather than a
 * slow one. Next renders these the moment navigation starts, with no
 * JavaScript and no per-link wiring.
 *
 * Deliberately skeletons rather than spinners. A spinner says "something is
 * happening"; a skeleton says "your product page is coming and here is its
 * shape", which measurably reduces perceived wait because the layout stops
 * being a surprise. It also means no layout shift when the real content lands.
 */

/** One shimmering block. */
export function Bone({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-[6px] bg-[#EFEFEF] ${className}`}
    />
  );
}

/**
 * Screen-reader announcement for a loading region.
 *
 * The shimmer is purely visual — without this, a screen reader hears nothing
 * at all during the wait.
 */
export function LoadingAnnounce({ label }: { label: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  );
}

/** A product card placeholder, matching the real grid cell's 3:4 media box. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-y-[10px]">
      <Bone className="aspect-[3/4] w-full rounded-[6px]" />
      <Bone className="h-[12px] w-3/4" />
      <Bone className="h-[12px] w-1/3" />
    </div>
  );
}
