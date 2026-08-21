'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import GridContainer from '../gridContainer';
import { showToast } from '../toast';
import { PageHeader, Panel, SectionTitle, Badge, EmptyState, TableShell } from '../ui';
import { previewSalePrice, ngn } from './preview-price';
import {
  createFlashSale,
  cancelFlashSale,
  type AdminProduct,
  type AdminVariant,
  type FlashSale,
} from './actions';


/** `datetime-local` value for "now + hours", in the operator's own timezone. */
function localInput(offsetHours: number): string {
  const d = new Date(Date.now() + offsetHours * 3600 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const variantLabel = (v: AdminVariant) =>
  [v.color, v.size ? String(v.size).toUpperCase() : null].filter(Boolean).join(' / ') ||
  v.sku ||
  v.id;

export default function FlashSalesClient({
  initialSales,
  products,
}: {
  initialSales: FlashSale[];
  products: AdminProduct[];
}) {
  const [sales, setSales] = useState<FlashSale[]>(initialSales || []);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [discount, setDiscount] = useState(30);
  const [startsAt, setStartsAt] = useState(localInput(0));
  const [endsAt, setEndsAt] = useState(localInput(72));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Wall-clock, held in state rather than read during render: a render-time
  // clock read is non-idempotent, and a row's live/ended state must not depend
  // on when React happened to re-render. Null until mounted, so the server and
  // the first client paint agree.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const safeProducts = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products],
  );

  const variantsOf = (p: AdminProduct) =>
    (p.sample_variants ?? []).filter((v): v is AdminVariant => Boolean(v?.id));

  const toggleVariant = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /** The whole-product option: one tick covers every size and colour. */
  const toggleProduct = (p: AdminProduct) => {
    const ids = variantsOf(p).map((v) => v.id);
    const allOn = ids.length > 0 && ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allOn ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Coverage, computed the way the backend computes it, so the operator is
  // warned BEFORE saving that a partial sale won't badge on the catalog.
  const coverage = useMemo(() => {
    let full = 0;
    let partial = 0;
    const partialNames: string[] = [];
    for (const p of safeProducts) {
      const vs = variantsOf(p);
      const buyable = vs.filter((v) => (v.stock ?? 0) > 0);
      const census = buyable.length ? buyable : vs;
      if (!census.length) continue;
      const hit = census.filter((v) => selected.has(v.id));
      if (!hit.length) continue;
      if (hit.length === census.length) full += 1;
      else {
        partial += 1;
        partialNames.push(p.name);
      }
    }
    return { full, partial, partialNames };
  }, [safeProducts, selected]);

  const previewRows = useMemo(() => {
    const rows: { label: string; from: number; to: number }[] = [];
    for (const p of safeProducts) {
      for (const v of variantsOf(p)) {
        if (!selected.has(v.id)) continue;
        const base = Number(v.price || p.base_price || 0);
        if (!base) continue;
        rows.push({
          label: `${p.name} — ${variantLabel(v)}`,
          from: base,
          to: previewSalePrice(base, discount),
        });
      }
    }
    return rows;
  }, [safeProducts, selected, discount]);

  const submit = () => {
    if (!selected.size) {
      showToast('error', 'Pick at least one product or size');
      return;
    }
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      showToast('error', 'The sale has to end after it starts');
      return;
    }

    startTransition(async () => {
      const res = await createFlashSale({
        name: name.trim(),
        // The inputs are local time; the API stores real datetimes, so convert
        // explicitly rather than shipping a naive string the server would have
        // to guess a zone for.
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        discount_pct: Number(discount),
        variant_ids: [...selected],
      });
      if (res.success) {
        showToast('success', res.message);
        setSales((prev) => [res.data as FlashSale, ...prev].filter(Boolean));
        setName('');
        setSelected(new Set());
      } else {
        showToast('error', res.message);
      }
    });
  };

  const cancel = (sale: FlashSale) => {
    startTransition(async () => {
      const res = await cancelFlashSale(sale.id);
      if (res.success) {
        showToast('success', res.message);
        setSales((prev) =>
          prev.map((s) =>
            s.id === sale.id ? { ...s, status: 'cancelled', is_live: false } : s,
          ),
        );
      } else {
        showToast('error', res.message);
      }
    });
  };

  const when = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? '—'
      : d.toLocaleString('en-NG', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
  };

  return (
    <GridContainer>
      <PageHeader
        eyebrow="Merchandising"
        title="Flash sales"
        description="Time-limited discounts. A sale runs on its own clock — it starts and stops at the times set here, with no further action needed. Cancel takes effect immediately."
      />

      {/* ---------------- create ---------------- */}
      <Panel>
        <SectionTitle>New sale</SectionTitle>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="suite-eyebrow">Name</span>
            <input
              className="suite-input mt-1.5 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="August Reset"
            />
          </label>
          <label className="block">
            <span className="suite-eyebrow">Discount %</span>
            <input
              type="number"
              min={1}
              max={90}
              className="suite-input mt-1.5 w-full"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </label>
          <label className="block">
            <span className="suite-eyebrow">Starts</span>
            <input
              type="datetime-local"
              className="suite-input mt-1.5 w-full"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="suite-eyebrow">Ends</span>
            <input
              type="datetime-local"
              className="suite-input mt-1.5 w-full"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </label>
        </div>

        {/* ---------------- picker ---------------- */}
        <div className="mt-7">
          <SectionTitle>What goes on sale</SectionTitle>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#5C544A]">
            Tick a product to discount every size and colour it has. Open one to
            pick individual sizes instead — useful for clearing the sizes you
            are long on.
          </p>

          {safeProducts.length === 0 ? (
            <EmptyState title="No products" hint="Add a product first." />
          ) : (
            <div className="mt-3 max-h-[420px] space-y-1.5 overflow-y-auto rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-2.5">
              {safeProducts.map((p) => {
                const vs = variantsOf(p);
                const on = vs.filter((v) => selected.has(v.id)).length;
                const all = vs.length > 0 && on === vs.length;
                const isOpen = expanded.has(p.id);
                return (
                  <div key={p.id} className="rounded-[10px] bg-white/70 px-3 py-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={all}
                        // Some-but-not-all reads as a distinct third state, so
                        // the operator can see at a glance that this product is
                        // only partly covered.
                        ref={(el) => {
                          if (el) el.indeterminate = on > 0 && !all;
                        }}
                        onChange={() => toggleProduct(p)}
                        aria-label={`Discount all variants of ${p.name}`}
                        className="size-[15px] shrink-0 accent-[#14110E]"
                      />
                      <button
                        type="button"
                        onClick={() => toggleExpanded(p.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        aria-expanded={isOpen}
                      >
                        <span className="truncate text-[14px] text-[#14110E]">
                          {p.name}
                        </span>
                        <span className="shrink-0 text-[12px] text-[#8A8175]">
                          {on > 0 ? `${on}/${vs.length}` : `${vs.length} sizes`}
                        </span>
                        {p.status && p.status !== 'active' && (
                          <Badge tone="neutral">{p.status}</Badge>
                        )}
                      </button>
                    </div>

                    {isOpen && vs.length > 0 && (
                      <div className="mt-2 ml-[27px] grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                        {vs.map((v) => (
                          <label
                            key={v.id}
                            className="flex items-center gap-2 text-[13px] text-[#5C544A]"
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(v.id)}
                              onChange={() => toggleVariant(v.id)}
                              className="size-[14px] accent-[#14110E]"
                            />
                            <span className="truncate">{variantLabel(v)}</span>
                            <span className="ml-auto shrink-0 tabular-nums text-[#8A8175]">
                              {(v.stock ?? 0) > 0 ? `${v.stock} left` : 'sold out'}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ---------------- preview + coverage warning ---------------- */}
        {selected.size > 0 && (
          <div className="mt-5 rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <SectionTitle>What shoppers will pay</SectionTitle>
              <Badge tone="info">{selected.size} selected</Badge>
              {coverage.full > 0 && (
                <Badge tone="good">{coverage.full} fully covered</Badge>
              )}
              {coverage.partial > 0 && (
                <Badge tone="warn">{coverage.partial} partly covered</Badge>
              )}
            </div>

            {coverage.partial > 0 && (
              <p className="mt-2 text-[13px] leading-relaxed text-[#8A5A1E]">
                {coverage.partialNames.slice(0, 3).join(', ')}
                {coverage.partialNames.length > 3
                  ? ` and ${coverage.partialNames.length - 3} more`
                  : ''}{' '}
                {coverage.partialNames.length === 1 ? 'has' : 'have'} only some
                sizes on sale, so {coverage.partialNames.length === 1 ? 'it' : 'they'}{' '}
                won&apos;t show a sale badge or a struck-through price on the shop
                page. The card shows the cheapest size, so badging a partial sale
                would advertise a price most shoppers can&apos;t get. The discount
                still applies at checkout, and the product page shows it per size.
              </p>
            )}

            <div className="mt-3 max-h-[200px] overflow-y-auto">
              {previewRows.slice(0, 40).map((r) => (
                <div
                  key={r.label}
                  className="flex items-baseline justify-between gap-4 border-b border-[#EFE9DC] py-1.5 text-[13px] last:border-0"
                >
                  <span className="truncate text-[#5C544A]">{r.label}</span>
                  <span className="shrink-0 tabular-nums">
                    <span className="text-[#8A8175] line-through">{ngn(r.from)}</span>
                    <span className="ml-2 text-[#14110E]">{ngn(r.to)}</span>
                  </span>
                </div>
              ))}
              {previewRows.length > 40 && (
                <p className="pt-2 text-[12px] text-[#8A8175]">
                  …and {previewRows.length - 40} more
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={isPending || !selected.size}
            className="suite-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? 'Saving…' : 'Schedule sale'}
          </button>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="suite-btn-ghost"
            >
              Clear selection
            </button>
          )}
        </div>
      </Panel>

      {/* ---------------- existing sales ---------------- */}
      <div className="mt-8">
        <SectionTitle>All sales</SectionTitle>
        {sales.length === 0 ? (
          <EmptyState
            title="No flash sales yet"
            hint="Scheduled and past sales appear here."
          />
        ) : (
          <TableShell className="mt-3">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead className="text-[#8A8175]">
                <tr>
                  <th className="px-4 py-3 font-normal">Sale</th>
                  <th className="px-4 py-3 font-normal">Discount</th>
                  <th className="px-4 py-3 font-normal">Window</th>
                  <th className="px-4 py-3 font-normal">Items</th>
                  <th className="px-4 py-3 font-normal">State</th>
                  <th className="px-4 py-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {sales.filter(Boolean).map((s) => (
                  <tr key={s.id} className="border-t border-[#EFE9DC]">
                    <td className="px-4 py-3 text-[#14110E]">{s.name}</td>
                    <td className="px-4 py-3 tabular-nums">−{s.discount_pct}%</td>
                    <td className="px-4 py-3 text-[#5C544A]">
                      {when(s.starts_at)} → {when(s.ends_at)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {(s.variants ?? []).length}
                    </td>
                    <td className="px-4 py-3">
                      {s.status === 'cancelled' ? (
                        <Badge tone="bad">Cancelled</Badge>
                      ) : s.is_live ? (
                        <Badge tone="good">Live</Badge>
                      ) : now !== null && new Date(s.ends_at).getTime() < now ? (
                        <Badge tone="neutral">Ended</Badge>
                      ) : (
                        <Badge tone="info">Scheduled</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status !== 'cancelled' &&
                        now !== null &&
                        new Date(s.ends_at).getTime() > now && (
                          <button
                            type="button"
                            onClick={() => cancel(s)}
                            disabled={isPending}
                            className="suite-btn-danger disabled:opacity-40"
                          >
                            Cancel
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        )}
      </div>
    </GridContainer>
  );
}
