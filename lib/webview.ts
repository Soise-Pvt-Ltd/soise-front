/**
 * Lightweight Instagram / in-app browser detection.
 *
 * Used only where the detection changes behaviour that would otherwise break —
 * e.g. hiding Google OAuth (which Google actively blocks in embedded browsers).
 * Never used to gate features that work fine in WebViews.
 */

import { useSyncExternalStore } from 'react';

let _cached: boolean | null = null;

function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (_cached !== null) return _cached;
  const ua = navigator.userAgent || '';
  _cached = /Instagram|FBAN|FBAV|Twitter|Line\//i.test(ua);
  return _cached;
}

const noop = () => () => {};

export function useInAppBrowser(): boolean {
  return useSyncExternalStore(noop, isInAppBrowser, () => false);
}
