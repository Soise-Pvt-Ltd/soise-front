'use client';

import { usePathname } from 'next/navigation';
import StatueWatermark from './StatueWatermark';

/**
 * A whisper of the Soise statue across the storefront — the "in the vibe of the
 * website" presence the brief asked for. Anchored to a far corner at very low
 * opacity so it reads as texture, never as a foreground element. Suppressed on
 * the surfaces that already carry their own bespoke statue treatment (/join,
 * /team) and on the internal admin dashboard.
 */
const EXCLUDE = ['/dashboard', '/team', '/join'];

export default function AmbientStatue() {
  const path = usePathname() || '';
  if (EXCLUDE.some((p) => path.startsWith(p))) return null;

  return (
    <StatueWatermark
      tone="dark"
      width={400}
      opacity={0.035}
      className="fixed right-[-90px] bottom-[-40px] z-0 hidden lg:block"
    />
  );
}
