'use client';

import { motion } from 'framer-motion';

interface PendingOrderBannerProps {
  resuming: boolean;
  cancelling: boolean;
  onResume: () => void;
  onCancel: () => void;
}

/**
 * Shown when a pending order's payment redirect never landed (dropped
 * redirect, closed tab, bail on the payment page). Offers to reopen the same
 * checkout — never a duplicate order — with cancel present so the banner
 * isn't a one-way door.
 */
export function PendingOrderBanner({
  resuming,
  cancelling,
  onResume,
  onCancel,
}: PendingOrderBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="page-shell flex flex-col gap-y-4 border-b border-[#F0C36B] bg-[#FFF8EC] px-[20px] py-[16px] normal-case md:flex-row md:items-center md:gap-x-6"
    >
      {/* min-w-0 so the copy can actually use the space. Previously the
          action was .btn_black, which carries w-full from an UNLAYERED
          rule in globals.css — that beats the md:w-auto utility, so the
          button never shrank and squeezed this column to about 90px, one
          word per line. These buttons are styled inline for that reason. */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#121212]">
          You have an order awaiting payment
        </p>
        <p className="mt-[2px] text-[12px] leading-relaxed text-[#7A6320]">
          Your order is saved and nothing has been charged yet. Reopening
          checkout continues that same order — it will not create a
          second one.
        </p>
      </div>
      {/* One control, split 1:3. Cancel is the smaller, quieter half —
          present so the banner isn't a one-way door, but never competing
          with the action we actually want. */}
      <div className="flex w-full shrink-0 overflow-hidden rounded-[10px] md:w-[360px]">
        <button
          type="button"
          onClick={onCancel}
          disabled={resuming || cancelling}
          className="w-1/4 cursor-pointer border border-r-0 border-[#121212] bg-transparent px-[8px] py-[13px] text-[11px] font-bold tracking-wide text-[#121212] uppercase transition-colors duration-200 hover:bg-[#121212]/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cancelling ? '…' : 'Cancel'}
        </button>
        <button
          type="button"
          onClick={onResume}
          disabled={resuming || cancelling}
          className="w-3/4 cursor-pointer bg-[#121212] px-[16px] py-[13px] text-[12px] font-bold tracking-wide text-white uppercase transition-colors duration-200 hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resuming ? 'Opening…' : 'Complete payment'}
        </button>
      </div>
    </motion.div>
  );
}
