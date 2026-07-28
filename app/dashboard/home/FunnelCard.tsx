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
    <div className="mt-[24px] rounded-[20px] bg-white px-[24px] py-[24px]">
      <div className="flex flex-wrap items-baseline justify-between gap-y-2">
        <div>
          <div className="text-[14px] font-medium text-[#35373C]">
            Cart conversion
          </div>
          <div className="mt-1 text-[12px] text-[#AFB1B0]">
            Last {funnel.window_days} days
          </div>
        </div>
        <div className="flex items-end gap-x-6">
          <div>
            <div className="text-[22px] font-medium text-[#35373C]">
              {funnel.cart_conversion_rate}%
            </div>
            <div className="text-[12px] text-[#AFB1B0]">bag → paid</div>
          </div>
          <div>
            <div className="text-[22px] font-medium text-[#35373C]">
              {funnel.checkout_completion_rate}%
            </div>
            <div className="text-[12px] text-[#AFB1B0]">checkout → paid</div>
          </div>
        </div>
      </div>

      <div className="mt-[20px] space-y-[10px]">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-x-3">
            <div className="w-[120px] shrink-0 text-[12px] text-[#AFB1B0]">
              {step.label}
            </div>
            <div className="h-[10px] flex-1 overflow-hidden rounded-full bg-[#F2F2F2]">
              <div
                className="h-full rounded-full bg-[#0072BB]"
                style={{ width: `${Math.round((step.value / widest) * 100)}%` }}
              />
            </div>
            <div className="w-[48px] shrink-0 text-right text-[12px] font-medium text-[#35373C]">
              {step.value}
            </div>
          </div>
        ))}
      </div>

      {funnel.abandoned_carts > 0 && (
        <p className="mt-[16px] text-[12px] text-[#8B5E3C]">
          {funnel.abandoned_carts} bag
          {funnel.abandoned_carts === 1 ? '' : 's'} filled but never checked out.
          Anyone who left an email gets one recovery reminder.
        </p>
      )}
    </div>
  );
}
