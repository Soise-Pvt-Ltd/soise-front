'use client';

import { useEffect, useState } from 'react';
import GridContainer from '../gridContainer';
import { PageHeader, Panel, StatTile, TableShell, EmptyState, FilterPills, Badge } from '../ui';
import { showToast } from '../toast';
import { getVariantDemand, type DemandRow, type VariantDemand } from './actions';

/**
 * What to restock, and in which size.
 *
 * Paid units alone are too thin a signal at this stage — a handful of paid
 * orders all-time would rank almost nothing. So every variant is read on four
 * signals and ranked on their weighted sum (weights live in the backend, see
 * app/domain/admin.py::DEMAND_WEIGHTS):
 *
 *   Sold        got past payment          — proven demand
 *   Backordered checkout could not cover  — demand already MISSED
 *   Ordered     created/pending, unpaid   — intent, money not in
 *   In bags     live carts right now      — demand about to happen
 *
 * The number the buyer actually acts on is "Order" — everything wanted in the
 * window that today's shelf cannot cover.
 */
const WINDOWS = [
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last year' },
] as const;

type Window = (typeof WINDOWS)[number]['value'];

const SIZE_LABEL: Record<string, string> = {
  xs: 'XS', s: 'S', m: 'M', l: 'L', xl: 'XL', '2xl': '2XL', '3xl': '3XL', '4xl': '4XL',
};

function sizeLabel(size?: string | null) {
  if (!size) return '—';
  return SIZE_LABEL[size] ?? size.toUpperCase();
}

function daysAgo(iso: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

/** A signal cell reads as "—" at zero: only the numbers that exist should draw the eye. */
function Count({ value, strong = false }: { value: number; strong?: boolean }) {
  if (!value) return <span className="text-[#B8AF9F]">—</span>;
  return <span className={strong ? 'font-medium text-[#14110E]' : 'text-[#5C544A]'}>{value}</span>;
}

export default function DemandClient() {
  const [days, setDays] = useState<Window>('90');
  const [data, setData] = useState<VariantDemand | null>(null);
  const [loading, setLoading] = useState(true);

  // `cancelled` guards the window pills: switching from 90 to 30 while the
  // first request is still out must not let the slower answer overwrite the
  // newer one.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await getVariantDemand(Number(days));
      if (cancelled) return;
      if (res.success) setData(res.demand);
      else showToast('error', res.error);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const variants: DemandRow[] = data?.variants ?? [];
  const toOrder = variants.reduce((sum, v) => sum + v.restock_suggestion, 0);
  const missed = variants.reduce((sum, v) => sum + v.backordered, 0);
  const inBags = variants.reduce((sum, v) => sum + v.in_cart, 0);
  const topSize = data?.sizes?.[0];

  return (
    <GridContainer>
      <PageHeader
        eyebrow="The house"
        title="What to restock"
        description="Every size and colour ranked by how much it is actually wanted — sold, backordered, ordered-unpaid and sitting in live bags. The piece a shopper could not have is the loudest signal here."
      />

      <div className="mb-5">
        <FilterPills<Window>
          options={WINDOWS}
          value={days}
          onChange={(w) => setDays(w)}
          label="Demand window"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          tone="ink"
          label="Units to order"
          value={toOrder}
          meta={<span className="text-[12px] text-[#B4AC9E]">beyond what is on the shelf</span>}
        />
        <StatTile
          label="Demand we missed"
          value={missed}
          meta={<span className="text-[12px] text-[#8C8377]">bought, could not ship</span>}
        />
        <StatTile
          label="Sitting in bags"
          value={inBags}
          meta={<span className="text-[12px] text-[#8C8377]">live carts right now</span>}
        />
        <StatTile
          label="Strongest size"
          value={topSize ? sizeLabel(topSize.size) : '—'}
          meta={
            <span className="text-[12px] text-[#8C8377]">
              {topSize ? `${topSize.sold + topSize.unpaid + topSize.in_cart} wanted` : 'no demand yet'}
            </span>
          }
        />
      </div>

      {(data?.sizes?.length ?? 0) > 0 && (
        <Panel
          className="mb-6"
          eyebrow="Buy sheet"
          title="The size curve"
          bodyClassName="!px-0 !py-0"
        >
          <TableShell className="!rounded-none !border-0">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-[#E2DBCC]">
                  <th className="thead pl-6">Size</th>
                  <th className="thead">Wanted</th>
                  <th className="thead">Sold</th>
                  <th className="thead">Missed</th>
                  <th className="thead">In bags</th>
                  <th className="thead pr-6">On the shelf</th>
                </tr>
              </thead>
              <tbody>
                {data!.sizes.map((s) => (
                  <tr key={s.size} className="suite-row">
                    <td className="td pl-6 font-medium text-[#14110E]">{sizeLabel(s.size)}</td>
                    <td className="td">{s.sold + s.unpaid + s.in_cart}</td>
                    <td className="td"><Count value={s.sold} strong /></td>
                    <td className="td"><Count value={s.backordered} /></td>
                    <td className="td"><Count value={s.in_cart} /></td>
                    <td className="td pr-6 text-[#5C544A]">{s.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </Panel>
      )}

      <Panel
        eyebrow="Ranked"
        title="Variant by variant"
        bodyClassName="!px-0 !py-0"
      >
        <TableShell className="!rounded-none !border-0">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#E2DBCC]">
                <th className="thead pl-6">Piece</th>
                <th className="thead">Size</th>
                <th className="thead">Colour</th>
                <th className="thead">Sold</th>
                <th className="thead">Missed</th>
                <th className="thead">Ordered</th>
                <th className="thead">In bags</th>
                <th className="thead">Shelf</th>
                <th className="thead">Order</th>
                <th className="thead pr-6">Last wanted</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10}><EmptyState title="Reading the signals…" /></td>
                </tr>
              ) : variants.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState
                      title="No demand in this window"
                      hint="Nothing has been sold, ordered or bagged in the period you picked. Widen the window, or come back once the next bag is filled."
                    />
                  </td>
                </tr>
              ) : (
                variants.map((v) => (
                  <tr key={v.variant_id} className="suite-row">
                    <td className="td pl-6">
                      <div className="font-medium text-[#14110E]">{v.product_name || '—'}</div>
                      <div className="text-[12px] text-[#8C8377]">{v.sku}</div>
                    </td>
                    <td className="td font-medium text-[#14110E]">{sizeLabel(v.size)}</td>
                    <td className="td text-[#5C544A]">{v.color || '—'}</td>
                    <td className="td"><Count value={v.sold} strong /></td>
                    <td className="td">
                      {v.backordered ? (
                        <Badge tone="bad">{v.backordered}</Badge>
                      ) : (
                        <span className="text-[#B8AF9F]">—</span>
                      )}
                    </td>
                    <td className="td"><Count value={v.unpaid} /></td>
                    <td className="td"><Count value={v.in_cart} /></td>
                    <td className="td">
                      {v.stock === 0 ? (
                        <Badge tone="warn">out</Badge>
                      ) : (
                        <span className="text-[#5C544A]">{v.stock}</span>
                      )}
                    </td>
                    <td className="td">
                      {v.restock_suggestion ? (
                        <span className="suite-display text-[17px] text-[#14110E]">
                          {v.restock_suggestion}
                        </span>
                      ) : (
                        <span className="text-[#B8AF9F]">—</span>
                      )}
                    </td>
                    <td className="td pr-6 text-[13px] text-[#8C8377]">
                      {daysAgo(v.last_wanted_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableShell>
      </Panel>

      <p className="mt-4 max-w-[640px] text-[13px] leading-relaxed text-[#8C8377]">
        Ranking weights a sold unit heaviest, then one we could not ship, then an
        unpaid order, then a bagged item. <strong className="font-medium text-[#5C544A]">Order</strong> is
        everything wanted in this window that today&rsquo;s shelf cannot cover — set the
        date those pieces land on the{' '}
        <a href="/dashboard/restock" className="luxe-underline text-[#9C6F2E]">Restock</a> page.
      </p>
    </GridContainer>
  );
}
