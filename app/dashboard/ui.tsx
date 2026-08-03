'use client';

import type { ReactNode } from 'react';

/**
 * Admin suite primitives — the /about design language, made reusable.
 *
 * The dashboard used to be a stock blue/grey admin template that shared no
 * vocabulary with the storefront. Everything here is drawn from /about:
 *
 *   · bone canvas (#F4F1EA) with paper cards (#FBF9F4) — no drop shadows,
 *     hairline borders only, the way a printed lookbook sits on a page
 *   · ink (#14110E) for weight, gold (#9C6F2E / #C4AA6E on dark) for accent
 *   · gold eyebrows in wide uppercase tracking above every section
 *   · Playfair (var(--font-luxe)) for anything that carries meaning — page
 *     titles, headline figures — Poppins for everything operational
 *
 * The rule of the suite: colour signals state, never decoration. A green pill
 * means paid; nothing is tinted just to look lively.
 */

/* -------------------------------------------------------------------------- */
/* Type                                                                        */
/* -------------------------------------------------------------------------- */

export function Eyebrow({
  children,
  onInk = false,
  className = '',
}: {
  children: ReactNode;
  /** Use on the ink sidebar / dark panels, where gold lightens to #C4AA6E. */
  onInk?: boolean;
  className?: string;
}) {
  return (
    <p className={`${onInk ? 'ad-eyebrow-on-ink' : 'ad-eyebrow'} ${className}`}>
      {children}
    </p>
  );
}

/**
 * Every route opens the same way /about's sections do: a gold eyebrow, a serif
 * headline, one line of plain-spoken explanation, then a hairline rule.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 border-b border-[#E2DBCC] pb-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[640px]">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="ad-display mt-3 text-[30px] leading-[1.12] text-[#14110E] sm:text-[38px]">
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-[14px] leading-relaxed text-[#5C544A]">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}

/** Heading for a block inside a page — serif, but sized down from the h1. */
export function SectionTitle({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`ad-display text-[19px] text-[#14110E] ${className}`}>
      {children}
    </h2>
  );
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Panel({
  children,
  title,
  eyebrow,
  actions,
  className = '',
  bodyClassName = '',
}: {
  children: ReactNode;
  title?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const hasHead = Boolean(title || eyebrow || actions);
  return (
    <section className={`ad-panel ${className}`}>
      {hasHead && (
        <div className="flex flex-col gap-3 border-b border-[#E2DBCC] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <SectionTitle className={eyebrow ? 'mt-2' : ''}>{title}</SectionTitle>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={hasHead ? `px-6 py-5 ${bodyClassName}` : `p-6 ${bodyClassName}`}>
        {children}
      </div>
    </section>
  );
}

/**
 * Headline figure. `tone="ink"` inverts it to the dark treatment /about uses
 * for its alternating sections — reserved for the single most important number
 * on a screen, so the eye lands somewhere deliberate.
 */
export function StatTile({
  label,
  value,
  meta,
  tone = 'paper',
  action,
}: {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  tone?: 'paper' | 'ink';
  action?: ReactNode;
}) {
  const ink = tone === 'ink';
  return (
    <div
      className={`flex flex-col justify-between gap-6 rounded-[14px] border p-6 ${
        ink
          ? 'border-[#1F1F22] bg-[#0E0E10]'
          : 'border-[#E2DBCC] bg-[#FBF9F4]'
      }`}
      role="region"
      aria-label={label}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={ink ? 'ad-eyebrow-on-ink' : 'ad-eyebrow'}>{label}</p>
        {action}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p
          className={`ad-display text-[30px] leading-none ${
            ink ? 'text-[#F4F1EA]' : 'text-[#14110E]'
          }`}
        >
          {value}
        </p>
        {meta}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* State                                                                       */
/* -------------------------------------------------------------------------- */

export type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'info' | 'alt';

/**
 * Status vocabulary for the whole suite, so "paid" looks identical on the
 * overview, the orders table and a payout row. Earth-toned rather than stock
 * traffic lights — legible at a glance without breaking the palette.
 */
export const STATUS_TONE: Record<string, Tone> = {
  // orders
  created: 'neutral',
  pending_payment: 'warn',
  pending: 'warn',
  paid: 'good',
  processing: 'alt',
  shipped: 'info',
  delivered: 'good',
  cancelled: 'bad',
  refunded: 'warn',
  failed: 'bad',
  abandoned: 'neutral',
  // applications / tier requests
  submitted: 'info',
  under_review: 'warn',
  approved: 'good',
  accepted: 'good',
  rejected: 'bad',
  // payouts & generic
  completed: 'good',
  success: 'good',
  successful: 'good',
  active: 'good',
  inactive: 'neutral',
  revoked: 'bad',
  disabled: 'neutral',
  draft: 'neutral',
  archived: 'neutral',
};

export function toneFor(status?: string | null): Tone {
  if (!status) return 'neutral';
  return STATUS_TONE[String(status).toLowerCase()] ?? 'neutral';
}

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return <span className={`ad-badge-${tone} ${className}`}>{children}</span>;
}

/** Badge driven straight off a backend status string. */
export function StatusBadge({
  status,
  className = '',
}: {
  status?: string | null;
  className?: string;
}) {
  const label = (status || 'unknown').replace(/_/g, ' ');
  return (
    <Badge tone={toneFor(status)} className={className}>
      {label}
    </Badge>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* The Greek-key rule from the brand mark, abstracted to a divider. */}
      <span aria-hidden="true" className="mb-5 block h-px w-10 bg-[#C4AA6E]" />
      <p className="ad-display text-[18px] text-[#14110E]">{title}</p>
      {hint && (
        <p className="mt-2 max-w-[340px] text-[13px] leading-relaxed text-[#8C8377]">
          {hint}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Controls                                                                    */
/* -------------------------------------------------------------------------- */

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  label = 'Filter',
}: {
  options: readonly T[] | readonly { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  label?: string;
}) {
  const items = (options as readonly unknown[]).map((o) =>
    typeof o === 'string'
      ? { value: o as T, label: (o as string).replace(/_/g, ' ') }
      : (o as { value: T; label: string }),
  );
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap items-center gap-1.5"
    >
      {items.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={value === o.value ? 'ad-pill-on' : 'ad-pill'}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
  className?: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label}
      className={`ad-input max-w-[320px] ${className}`}
    />
  );
}

/** Horizontal-scroll frame for a wide table, with the panel's hairline edge. */
export function TableShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-x-auto rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] ${className}`}
    >
      {children}
    </div>
  );
}
