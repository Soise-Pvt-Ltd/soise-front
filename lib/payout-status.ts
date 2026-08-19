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
 *
 * The badge styling is Pressed Ink: state is carried by ink weight and the one
 * crimson accent, not by a traffic-light hue palette. PAID is the ink-filled
 * plate (the settled state), FAILED is the crimson one (the only thing that
 * needs a creator's attention), everything else is plain paper.
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
    className: 'border-2 border-[#121212] bg-white text-[#121212]',
    inFlight: true,
  },
  processing: {
    label: 'Processing',
    meaning: 'The transfer is on its way to your bank.',
    className: 'border-2 border-[#121212] bg-white text-[#121212]',
    inFlight: true,
  },
  paid: {
    label: 'Paid',
    meaning: 'Sent to your bank account.',
    className: 'border-2 border-[#121212] bg-[#121212] text-white',
    inFlight: false,
  },
  failed: {
    label: 'Failed',
    meaning: "The transfer didn't go through. The amount is back in your balance.",
    className: 'border-2 border-[#B3101C] bg-white text-[#B3101C]',
    inFlight: false,
  },
  cancelled: {
    label: 'Cancelled',
    meaning: 'This request was cancelled. The amount is back in your balance.',
    className: 'border-2 border-[#121212] bg-white text-[#5C544A]',
    inFlight: false,
  },
};

const UNKNOWN: PayoutStatusView = {
  label: 'Unknown',
  meaning: 'We could not read the state of this payout. Contact support.',
  className: 'border-2 border-[#121212] bg-white text-[#5C544A]',
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
