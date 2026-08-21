'use client';

import { useEffect, useState } from 'react';

/**
 * Ticking "ends in" clock for a live flash sale.
 *
 * Renders nothing until mounted. The remaining time depends on the viewer's
 * clock, so rendering it on the server guarantees a hydration mismatch — and
 * a countdown that flickers a wrong number on first paint undermines the exact
 * urgency it exists to create.
 *
 * Also renders nothing once the window closes. The sale is enforced
 * server-side by `ends_at`, so a page left open past the end must stop
 * promising a discount the next request won't honour.
 */
export default function SaleCountdown({
  endsAt,
  className = '',
  prefix = 'Ends in',
}: {
  endsAt?: string | null;
  className?: string;
  prefix?: string;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) return;
    const end = new Date(endsAt).getTime();
    if (Number.isNaN(end)) return;

    const tick = () => setRemaining(end - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (remaining === null || remaining <= 0) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Seconds only appear in the last hour. Above that they're noise that makes
  // a two-day sale feel like a countdown to nothing; below it they're the
  // whole point.
  const parts =
    days > 0
      ? [`${days}d`, `${hours}h`, `${minutes}m`]
      : hours > 0
        ? [`${hours}h`, `${minutes}m`]
        : [`${minutes}m`, `${String(seconds).padStart(2, '0')}s`];

  return (
    <span
      className={className}
      // Screen readers must not re-announce a value that changes every second.
      aria-live="off"
      role="timer"
    >
      {prefix} {parts.join(' ')}
    </span>
  );
}
