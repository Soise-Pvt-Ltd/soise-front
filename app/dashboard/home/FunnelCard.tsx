'use client';

import { motion } from 'framer-motion';

type Stage = { key: string; label: string; value: number };

type Funnel = {
  window_days: number;
  include_staff?: boolean;
  stages?: Stage[];
  bags_filled?: number;
  reached_checkout?: number;
  payment_started?: number;
  orders_paid: number;
  cart_conversion_rate: number;
  checkout_completion_rate: number;
  biggest_drop?: { from: string; to: string; lost: number; share: number } | null;
  abandoned_carts: number;
  staff_excluded?: { orders: number; carts: number };
  /** Pre-2026-08-15 shape, still served while the backend deploy lags. */
  carts_with_items?: number;
  orders_created?: number;
};

/** What each stage actually means, spelled out rather than left to be guessed. */
const MEANING: Record<string, string> = {
  bag: 'someone put a piece in their bag',
  checkout: 'they submitted the order form',
  payment: 'a payable session was created for them',
  paid: 'the money arrived',
};

/**
 * Cart-to-purchase funnel.
 *
 * The previous version drew four bars scaled to whichever was biggest, which
 * let the funnel grow as it descended — it showed 1 cart started, 10 bags
 * filled, 10 reached checkout — and every one of those "10 people" was the
 * shop's own admin account testing the flow. Bars are now scaled to the top
 * stage so the shape can only narrow, each step states what it lost, and the
 * step that loses the most is named outright.
 */
export default function FunnelCard({ funnel }: { funnel: Funnel | null }) {
  if (!funnel) return null;

  const stages: Stage[] =
    funnel.stages && funnel.stages.length
      ? funnel.stages
      : [
          { key: 'bag', label: 'Bag filled', value: funnel.carts_with_items ?? 0 },
          { key: 'checkout', label: 'Reached checkout', value: funnel.orders_created ?? 0 },
          { key: 'paid', label: 'Paid', value: funnel.orders_paid ?? 0 },
        ];

  const top = stages[0]?.value ?? 0;
  const staffOrders = funnel.staff_excluded?.orders ?? 0;
  const biggest = funnel.biggest_drop ?? null;

  return (
    <div className="suite-panel mt-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-y-4">
        <div>
          <p className="suite-eyebrow">Cart conversion</p>
          <p className="mt-2 text-[12px] text-[#8C8377]">
            Last {funnel.window_days} days
            {funnel.include_staff ? ' · including staff checkouts' : ''}
          </p>
        </div>
        <div className="flex items-end gap-x-8">
          <div>
            <p className="suite-display text-[26px] leading-none text-[#14110E]">
              {funnel.cart_conversion_rate}%
            </p>
            <p className="mt-1.5 text-[11px] tracking-[0.14em] text-[#8C8377] uppercase">
              bag → paid
            </p>
          </div>
          <div>
            <p className="suite-display text-[26px] leading-none text-[#14110E]">
              {funnel.checkout_completion_rate}%
            </p>
            <p className="mt-1.5 text-[11px] tracking-[0.14em] text-[#8C8377] uppercase">
              checkout → paid
            </p>
          </div>
        </div>
      </div>

      {top === 0 ? (
        <p className="mt-7 border-t border-[#E2DBCC] pt-5 text-[13px] text-[#8C8377]">
          Nobody put anything in a bag in the last {funnel.window_days} days.
        </p>
      ) : (
        <div className="mt-7">
          {stages.map((stage, i) => {
            const share = Math.round((stage.value / top) * 100);
            const next = stages[i + 1];
            const lost = next ? stage.value - next.value : 0;
            // Naming the biggest leak is only worth the ink when there is a
            // comparison to make; at one lost shopper it just adds drama.
            const worst =
              !!biggest &&
              !!next &&
              biggest.lost > 1 &&
              biggest.from === stage.label &&
              biggest.lost === lost;

            return (
              <div key={stage.key}>
                <div className="flex items-center gap-x-4 py-1.5">
                  <div className="w-[132px] shrink-0">
                    <p className="text-[11px] tracking-[0.14em] text-[#5C544A] uppercase">
                      {stage.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#A79E90]">
                      {MEANING[stage.key] ?? ''}
                    </p>
                  </div>

                  {/* The track is the top stage. A bar can therefore only ever
                      shrink down the card, which is the one thing the old
                      max-scaled version failed to guarantee. */}
                  <div className="relative h-[26px] flex-1 overflow-hidden rounded-[4px] bg-[#F1ECE1]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${share}%` }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                      className="h-full rounded-[4px] bg-[#9C6F2E]"
                    />
                    {/* A zero stage still needs a mark, or the row reads as
                        missing data rather than as nobody getting this far. */}
                    {stage.value === 0 && (
                      <span className="absolute inset-y-0 left-0 w-[3px] bg-[#C9BFA9]" />
                    )}
                  </div>

                  <div className="w-[86px] shrink-0 text-right">
                    <span className="suite-display text-[17px] text-[#14110E]">
                      {stage.value}
                    </span>
                    <span className="ml-1.5 text-[11px] text-[#8C8377]">{share}%</span>
                  </div>
                </div>

                {next && (
                  <div className="flex items-center gap-x-4">
                    <div className="w-[132px] shrink-0" />
                    <div className="flex flex-1 items-center gap-x-2 py-1">
                      <span className="h-[14px] w-px bg-[#E2DBCC]" />
                      <span
                        className={`text-[11px] ${worst ? 'text-[#8C3A2B]' : 'text-[#A79E90]'}`}
                      >
                        {lost === 0
                          ? 'everyone carried on'
                          : `${lost} lost here${
                              worst ? ` · biggest leak (${biggest!.share}%)` : ''
                            }`}
                      </span>
                    </div>
                    <div className="w-[86px] shrink-0" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(funnel.abandoned_carts > 0 || staffOrders > 0) && (
        <div className="mt-6 space-y-2 border-t border-[#E2DBCC] pt-4 text-[12px] leading-relaxed">
          {funnel.abandoned_carts > 0 && (
            <p className="text-[#8A6218]">
              {funnel.abandoned_carts} bag
              {funnel.abandoned_carts === 1 ? '' : 's'} filled but never checked
              out. Anyone who left an email gets one recovery reminder.
            </p>
          )}
          {staffOrders > 0 && (
            <p className="text-[#8C8377]">
              {`${staffOrders} staff checkout${staffOrders === 1 ? '' : 's'} excluded`}
              {' — the shop’s own test orders are not customers.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
