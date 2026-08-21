'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { showToast } from '../toast';
import { createFlashSale, cancelFlashSale } from '../flash-sales/actions';
import { previewSalePrice, ngn } from '../flash-sales/preview-price';

/** The `sale` summary the backend attaches to every product it returns. */
export interface ProductSaleSummary {
  id?: string;
  name?: string;
  coverage?: 'all' | 'partial';
  discount_pct?: number | null;
  ends_at?: string | null;
  sale_price?: number | null;
  original_price?: number | null;
  /** True when this sale covers nothing but this product. */
  exclusive?: boolean;
  product_count?: number | null;
}

const DURATIONS = [
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: '72h', hours: 72 },
  { label: '7d', hours: 168 },
] as const;

function endsIn(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Put THIS product on sale without leaving the editor.
 *
 * Deliberately narrower than /dashboard/flash-sales. A flash sale is a
 * campaign — one window, one discount, many variants — and editing a shared
 * campaign from inside one product's form invites a nasty surprise: change the
 * end time on the tracksuit and you've changed it for the six other products in
 * the same campaign. So this panel only ever CREATES a sale covering this
 * product alone, and only offers to end one that covers nothing else. A
 * product caught up in a wider campaign is shown, described, and linked — not
 * made editable here.
 *
 * The sale starts immediately. Scheduling something for next Tuesday is a
 * campaign concern and lives on the campaign page; this is the "price is the
 * ad barrier, try 30% off tonight" control.
 */
export default function ProductSalePanel({
  productId,
  productName,
  basePrice,
  sale,
  onChanged,
}: {
  productId: string | null;
  productName: string;
  basePrice: number;
  sale?: ProductSaleSummary | null;
  onChanged?: () => void;
}) {
  const [discount, setDiscount] = useState(30);
  const [hours, setHours] = useState<number>(72);
  const [isPending, startTransition] = useTransition();

  const preview = useMemo(
    () => previewSalePrice(Number(basePrice) || 0, discount),
    [basePrice, discount],
  );

  // Only meaningful once the product exists — a sale needs variants to cover.
  if (!productId) {
    return (
      <div className="rounded-[14px] border border-dashed border-[#E2DBCC] bg-[#FBF9F4] p-4">
        <p className="suite-eyebrow">Flash sale</p>
        <p className="mt-2 text-[13px] text-[#8A8175]">
          Save the product first — a sale has to have variants to discount.
        </p>
      </div>
    );
  }

  const live = sale && (sale.discount_pct ?? 0) > 0;

  const start = () => {
    if (discount < 1 || discount > 90) {
      showToast('error', 'Discount must be between 1% and 90%');
      return;
    }
    const now = new Date();
    const end = new Date(now.getTime() + hours * 3600 * 1000);
    startTransition(async () => {
      const res = await createFlashSale({
        name: `${productName || 'Product'} — ${discount}% off`,
        starts_at: now.toISOString(),
        ends_at: end.toISOString(),
        discount_pct: discount,
        // Whole-product: the backend expands to every variant at write time,
        // so this cannot miss a size the editor hasn't loaded.
        product_ids: [productId],
      });
      if (res.success) {
        showToast('success', `On sale: ${discount}% off for ${hours}h`);
        onChanged?.();
      } else {
        showToast('error', res.message);
      }
    });
  };

  const end = () => {
    if (!sale?.id) return;
    startTransition(async () => {
      const res = await cancelFlashSale(sale.id as string);
      if (res.success) {
        showToast('success', 'Sale ended');
        onChanged?.();
      } else {
        showToast('error', res.message);
      }
    });
  };

  return (
    <div className="rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="suite-eyebrow">Flash sale</p>
        {live && (
          <span className="suite-badge-good">
            Live · −{Math.round(sale!.discount_pct as number)}%
          </span>
        )}
      </div>

      {live ? (
        <>
          <p className="mt-3 font-medium text-[15px] text-[#14110E]">
            <span className="text-[#8A8175] line-through">
              {ngn(Number(sale!.original_price) || Number(basePrice))}
            </span>
            <span className="ml-2">{ngn(Number(sale!.sale_price))}</span>
          </p>
          <p className="mt-1 text-[13px] text-[#5C544A]">
            Ends {endsIn(sale!.ends_at)}
            {sale!.coverage === 'partial' && (
              // Still badged on the shop. The card prints "from" the cheapest
              // size so the badge and the price agree.
              <>
                {' · '}
                <span className="text-[#8A5A1E]">
                  some sizes only — shop shows &ldquo;from&rdquo; the cheapest
                </span>
              </>
            )}
          </p>

          {sale!.exclusive ? (
            <button
              type="button"
              onClick={end}
              disabled={isPending}
              className="suite-btn-danger mt-3 disabled:opacity-40"
            >
              {isPending ? 'Ending…' : 'End sale now'}
            </button>
          ) : (
            <p className="mt-3 text-[13px] leading-relaxed text-[#5C544A]">
              Part of{' '}
              <span className="text-[#14110E]">
                “{sale!.name || 'a campaign'}”
              </span>
              , which covers {sale!.product_count} products. Ending it here
              would stop the discount on all of them, so it&apos;s managed on{' '}
              <Link href="/dashboard/flash-sales" className="underline">
                Flash sales
              </Link>
              .
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-2 text-[13px] text-[#8A8175]">
            No sale running. Starts immediately and ends on its own.
          </p>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="suite-eyebrow">Discount %</span>
              <input
                type="number"
                min={1}
                max={90}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="suite-input mt-1.5 w-[90px]"
              />
            </label>

            <div>
              <span className="suite-eyebrow">For</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {DURATIONS.map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => setHours(d.hours)}
                    aria-pressed={hours === d.hours}
                    className={hours === d.hours ? 'suite-pill-on' : 'suite-pill'}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={start}
              disabled={isPending}
              className="suite-btn-primary disabled:opacity-40"
            >
              {isPending ? 'Starting…' : 'Put on sale'}
            </button>
          </div>

          {Number(basePrice) > 0 && (
            <p className="mt-2 text-[13px] text-[#5C544A]">
              <span className="text-[#8A8175] line-through">{ngn(Number(basePrice))}</span>
              <span className="ml-2 text-[#14110E]">{ngn(preview)}</span>
              <span className="ml-2 text-[#8A8175]">on every size</span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
