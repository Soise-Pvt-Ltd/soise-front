'use client';

type Funnel = {
  window_days: number;
  carts_created: number;
  carts_with_items: number;
  orders_created: number;
  orders_paid: number;
  cart_conversion_rate: number;
  checkout_completion_rate: number;
  abandoned_carts: number;
};

/**
 * Cart-to-purchase funnel.
 *
 * Added because the question "what is our cart conversion?" had no answer:
 * orders were counted, carts were not, so there was no denominator anywhere in
 * the system and the number could only be guessed at.
 */
export default function FunnelCard({ funnel }: { funnel: Funnel | null }) {
  if (!funnel) return null;

  const steps = [
    { label: 'Carts started', value: funnel.carts_created },
    { label: 'Bag filled', value: funnel.carts_with_items },
    { label: 'Reached checkout', value: funnel.orders_created },
    { label: 'Paid', value: funnel.orders_paid },
  ];
  const widest = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="suite-panel mt-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-y-4">
        <div>
          <p className="suite-eyebrow">Cart conversion</p>
          <p className="mt-2 text-[12px] text-[#8C8377]">
            Last {funnel.window_days} days
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

      <div className="mt-7 space-y-3">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-x-4">
            <div className="w-[130px] shrink-0 text-[11px] tracking-[0.14em] text-[#8C8377] uppercase">
              {step.label}
            </div>
            <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-[#EFEAE0]">
              <div
                className="h-full rounded-full bg-[#9C6F2E]"
                style={{ width: `${Math.round((step.value / widest) * 100)}%` }}
              />
            </div>
            <div className="suite-display w-[52px] shrink-0 text-right text-[16px] text-[#14110E]">
              {step.value}
            </div>
          </div>
        ))}
      </div>

      {funnel.abandoned_carts > 0 && (
        <p className="mt-6 border-t border-[#E2DBCC] pt-4 text-[12px] leading-relaxed text-[#8A6218]">
          {funnel.abandoned_carts} bag
          {funnel.abandoned_carts === 1 ? '' : 's'} filled but never checked out.
          Anyone who left an email gets one recovery reminder.
        </p>
      )}
    </div>
  );
}
