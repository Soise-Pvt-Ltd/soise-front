/**
 * The payout status vocabulary, kept in one place because the UI got it wrong.
 *
 * The database constrains status to exactly these five:
 *
 *   DEFINE FIELD status ON payouts TYPE string
 *     ASSERT $value INSIDE ["requested","processing","paid","failed","cancelled"];
 *
 * The creator's payout history keyed its green "success" badge off `completed`
 * — a value the schema rejects outright, so it could never appear. A payout
 * that had actually been PAID fell through to the catch-all and rendered in
 * the amber pending style. The one status a creator most wants to see was the
 * one shown wrongly, and it looked like the money was still in limbo.
 *
 * `cancelled` had no branch either and read as pending forever too.
 *
 * Anything unrecognised now renders neutral rather than amber, so a future
 * status added backend-first degrades to "unknown", not to a false "pending".
 */

export type PayoutStatus =
  | 'requested'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled';

export interface PayoutStatusView {
  /** What the creator reads on the badge. */
  label: string;
  /** One line explaining what it means for their money. */
  meaning: string;
  /** Tailwind classes for the badge. */
  className: string;
  /** True while the money is still in flight — used to warn before re-requesting. */
  inFlight: boolean;
}

const VIEWS: Record<PayoutStatus, PayoutStatusView> = {
  requested: {
    label: 'Requested',
    meaning: 'Received. Waiting for our team to send it.',
    className: 'bg-[#F0F0F0] text-[#5A5A5E]',
    inFlight: true,
  },
  processing: {
    label: 'Processing',
    meaning: 'The transfer is on its way to your bank.',
    className: 'bg-[#E4EDF5] text-[#0072BB]',
    inFlight: true,
  },
  paid: {
    label: 'Paid',
    meaning: 'Sent to your bank account.',
    className: 'bg-[#CCEAD6] text-[#1B7A3D]',
    inFlight: false,
  },
  failed: {
    label: 'Failed',
    meaning: "The transfer didn't go through. The amount is back in your balance.",
    className: 'bg-[#E5C6BF] text-[#991C00]',
    inFlight: false,
  },
  cancelled: {
    label: 'Cancelled',
    meaning: 'This request was cancelled. The amount is back in your balance.',
    className: 'bg-[#F0F0F0] text-[#5A5A5E]',
    inFlight: false,
  },
};

const UNKNOWN: PayoutStatusView = {
  label: 'Unknown',
  meaning: 'We could not read the state of this payout. Contact support.',
  className: 'bg-[#F0F0F0] text-[#5A5A5E]',
  inFlight: false,
};

export function payoutStatusView(status: string | undefined): PayoutStatusView {
  if (!status) return UNKNOWN;
  return VIEWS[status.toLowerCase() as PayoutStatus] ?? UNKNOWN;
}

/** Statuses where the creator's money is committed but not yet delivered. */
export function isInFlight(status: string | undefined): boolean {
  return payoutStatusView(status).inFlight;
}
