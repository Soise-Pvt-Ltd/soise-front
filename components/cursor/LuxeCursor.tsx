'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * LVMH-style signifier cursor.
 *
 * A dual cursor — an instant dot + a lagging ring — that morphs to communicate
 * interactivity (Norman's signifiers): it swells over links, becomes a solid
 * "View" disc over product cards, and recoils on press. Uses mix-blend-mode so
 * it reads on any background. Purely an enhancement layer:
 *   - only on fine-pointer (desktop) devices — touch keeps the native cursor;
 *   - never on the internal /dashboard or /team tooling (productivity > flourish);
 *   - honours prefers-reduced-motion by snapping instead of trailing;
 *   - the native cursor is only hidden once this mounts (no-JS keeps it).
 */
type Variant = 'default' | 'link' | 'view';

const INTERACTIVE =
  'a, button, [role="button"], label[for], summary, [data-cursor], select, input, textarea';

export default function LuxeCursor() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [variant, setVariant] = useState<Variant>('default');
  const [label, setLabel] = useState('');
  const [pressed, setPressed] = useState(false);

  const dotWrap = useRef<HTMLDivElement>(null);
  const ringWrap = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const variantRef = useRef<Variant>('default');
  const magnetEl = useRef<HTMLElement | null>(null);

  // Decide whether the cursor runs for this route / device.
  useEffect(() => {
    const internal =
      pathname?.startsWith('/dashboard') || pathname?.startsWith('/team');
    const fine =
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches;
    setEnabled(Boolean(fine) && !internal);
  }, [pathname]);

  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove('luxe-cursor-on', 'cur-on-light');
      return;
    }
    document.documentElement.classList.add('luxe-cursor-on');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const setVar = (v: Variant, l = '') => {
      if (variantRef.current !== v) {
        variantRef.current = v;
        setVariant(v);
      }
      setLabel((prev) => (prev === l ? prev : l));
    };

    // Sample the effective background luminance under the cursor (walking up to
    // the first opaque background-color) so the cursor can flip dark/light and
    // stay visible. Returns null over media/gradients where colour is unknown —
    // there the contrasting halo (--luxe-edge) keeps it readable.
    let lastSample = 0;
    const sampleBackground = (x: number, y: number): number | null => {
      let el = document.elementFromPoint(x, y) as HTMLElement | null;
      let guard = 0;
      while (el && guard++ < 14) {
        const tag = el.tagName.toLowerCase();
        if (['img', 'video', 'canvas', 'svg', 'picture'].includes(tag)) {
          return null;
        }
        const cs = getComputedStyle(el);
        if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
        const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/);
        if (m) {
          const p = m[1].split(',').map((s) => parseFloat(s));
          const a = p[3] === undefined ? 1 : p[3];
          if (a >= 0.25) {
            return (0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]) / 255;
          }
        }
        el = el.parentElement;
      }
      return 1; // reached the root with no opaque bg → treat page as light
    };

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (dotWrap.current) {
        dotWrap.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      const now = performance.now();
      if (now - lastSample > 60) {
        lastSample = now;
        const lum = sampleBackground(e.clientX, e.clientY);
        if (lum !== null) {
          document.documentElement.classList.toggle('cur-on-light', lum > 0.55);
        }
      }

      const el = (e.target as HTMLElement)?.closest?.(
        INTERACTIVE,
      ) as HTMLElement | null;

      // Magnetic pull for opted-in elements.
      const mag = (e.target as HTMLElement)?.closest?.(
        '[data-magnetic]',
      ) as HTMLElement | null;
      if (mag) {
        const r = mag.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        mag.style.transform = `translate(${mx * 0.18}px, ${my * 0.28}px)`;
        magnetEl.current = mag;
      } else if (magnetEl.current) {
        magnetEl.current.style.transform = '';
        magnetEl.current = null;
      }

      if (!el) return setVar('default');
      const tag = el.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return setVar('default');
      }
      const dataLabel = el.dataset.cursorLabel;
      const href = el.getAttribute('href') || '';
      const looksLikeProduct =
        /\/shop\/[^/?#]+/.test(href) && !!el.querySelector('img');
      if (dataLabel) return setVar('view', dataLabel);
      if (looksLikeProduct) return setVar('view', 'View');
      return setVar('link');
    };

    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onLeave = () => setVar('default');

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onLeave);

    let raf = 0;
    const lerp = reduce ? 1 : 0.18;
    const tick = () => {
      ring.current.x += (target.current.x - ring.current.x) * lerp;
      ring.current.y += (target.current.y - ring.current.y) * lerp;
      if (ringWrap.current) {
        ringWrap.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
      if (magnetEl.current) magnetEl.current.style.transform = '';
      document.documentElement.classList.remove('luxe-cursor-on', 'cur-on-light');
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={dotWrap} className="luxe-cur-dot-wrap" aria-hidden="true">
        <span
          className={`luxe-cur-dot is-${variant} ${pressed ? 'is-press' : ''}`}
        />
      </div>
      <div ref={ringWrap} className="luxe-cur-ring-wrap" aria-hidden="true">
        <span
          className={`luxe-cur-ring is-${variant} ${pressed ? 'is-press' : ''}`}
        >
          {variant === 'view' && label ? (
            <span className="luxe-cur-label">{label}</span>
          ) : null}
        </span>
      </div>
    </>
  );
}
