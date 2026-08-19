/**
 * Read a wallet's payout destination, whichever shape it was written in.
 *
 * Wallets carry bank details in two shapes, and both are live in production:
 *
 * - **Current (Bachs)** — flat on `payout_metadata`:
 *   `{ account_number, bank_code, account_name, bank_name, provider }`
 * - **Legacy (Paystack)** — the provider's whole recipient response, with the
 *   bank details nested under `payout_metadata.details`.
 *
 * Every reader here used to look *only* at `.details`, so an account saved
 * through the current onboarding flow wrote correctly and then read back as
 * nothing: the bank form re-rendered empty, the dashboard kept nagging "set up
 * payouts", and the withdraw screen refused to offer a destination. The account
 * had saved perfectly well — nobody was looking where it landed.
 *
 * This mirrors `payout_bank_details` in app/domain/wallet.py, which already
 * read flat-then-legacy — which is why payouts themselves were never at risk.
 * Keep the two in step.
 */
export interface PayoutBankDetails {
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
}

export function payoutBankDetails(wallet: any): PayoutBankDetails | null {
  const metadata = wallet?.payout_metadata ?? {};
  const legacy = metadata.details ?? {};

  const account_number = metadata.account_number ?? legacy.account_number;
  const bank_code = metadata.bank_code ?? legacy.bank_code;
  const bank_name = metadata.bank_name ?? legacy.bank_name;

  // A destination needs a number and a bank to be usable at all; the names are
  // presentational and may legitimately be blank on older records.
  if (!account_number || !bank_code) return null;

  return {
    bank_name: String(bank_name ?? ''),
    bank_code: String(bank_code),
    account_number: String(account_number),
    account_name: String(
      metadata.account_name ?? legacy.account_name ?? metadata.name ?? '',
    ),
  };
}
