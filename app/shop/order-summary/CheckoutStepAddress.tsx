'use client';

import { useCurrency } from '@/lib/currency-context';
import {
  SHIPPING_COUNTRIES,
  NIGERIAN_STATES,
} from '@/lib/countries';
import { Field } from './Field';

export interface SavedAddress {
  id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone?: string;
  is_default?: boolean;
}

interface CheckoutStepAddressProps {
  savedAddresses: SavedAddress[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
  usingSavedAddress: boolean;
  country: string;
  onCountryChange: (country: string) => void;
  domestic: boolean;
  prefillFirstName: string;
  prefillLastName: string;
  prefillPhone: string;
  pending: boolean;
  error: string | null;
  cartEmpty: boolean;
  totalAfterCredit: number;
  /**
   * The money is already in — this form is finishing a paid order, not paying
   * for one. Drives the copy and the button: telling a shopper who has just
   * paid to "Pay ₦150,000" again reads as a double charge.
   */
  isPaid: boolean;
  onSubmit: (formData: FormData) => void;
}

/**
 * Step 2 of the two-step checkout: the full shipping address, collected after
 * payment is underway. Lets the shopper reuse a saved address or enter a new
 * one — country drives the state/postal/phone rules below.
 */
export default function CheckoutStepAddress({
  savedAddresses,
  selectedAddressId,
  onSelectAddress,
  usingSavedAddress,
  country,
  onCountryChange,
  domestic,
  prefillFirstName,
  prefillLastName,
  prefillPhone,
  pending,
  error,
  cartEmpty,
  totalAfterCredit,
  isPaid,
  onSubmit,
}: CheckoutStepAddressProps) {
  const { formatPrice } = useCurrency();

  return (
    <form action={onSubmit} className="mb-[36px]">
      <div>
        {/* Step marker: a stamped index, matching Step 1's masthead. */}
        <div className="flex items-baseline gap-x-3">
          <span className="text-[12px] font-bold tracking-[0.08em] text-[#B3101C]">
            2/2
          </span>
          <h1
            className="text-[26px] leading-none tracking-tight uppercase"
            style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}
          >
            Delivery
          </h1>
          <span className="mt-auto mb-[5px] flex-1 border-t-2 border-[#121212] opacity-20" />
        </div>

        {error && (
          <div className="mt-4 rounded-[2px] border-2 border-[#B3101C] bg-[#B3101C]/5 p-4 text-[13px] text-[#B3101C]">
            {error}
          </div>
        )}

        <div className="mt-[20px] mb-[18px] space-y-[12px]">
          <div className="mb-[16px] rounded-[2px] border-2 border-[#121212] bg-[#F5F0E8] px-[14px] py-[12px]">
            <p className="text-[13px] font-bold tracking-[0.06em] uppercase">
              {isPaid ? 'Payment received — last step' : 'Step 2 of 2'}
            </p>
            <p className="mt-[2px] text-[12px] text-[#5C544A] normal-case">
              {isPaid
                ? 'Where should we send it? Your order is confirmed either way — we’ll email you if anything’s missing.'
                : 'Please provide your delivery details to complete your order.'}
            </p>
          </div>

          {/* Who it's for. Moved here from Step 1 so that nothing but an
              email stands before the pay button — the parcel needs a name,
              the payment doesn't. Shown for saved and new addresses alike:
              an address can outlive any one recipient. */}
          <div className="grid gap-[10px] sm:grid-cols-2">
            <Field label="First name" htmlFor="firstName">
              <input
                id="firstName"
                type="text"
                name="firstName"
                className="brut-input"
                autoComplete="given-name"
                defaultValue={prefillFirstName}
                required
              />
            </Field>
            <Field label="Last name" htmlFor="lastName">
              <input
                id="lastName"
                type="text"
                name="lastName"
                className="brut-input"
                autoComplete="family-name"
                defaultValue={prefillLastName}
                required
              />
            </Field>
          </div>

          {savedAddresses.length > 0 && (
            <div className="space-y-[8px] pb-[4px]">
              {savedAddresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex cursor-pointer items-start gap-x-3 rounded-[2px] border-2 p-3 text-[13px] transition-all ${
                    selectedAddressId === addr.id
                      ? 'brut-shadow border-[#121212] bg-[#F5F0E8]'
                      : 'border-[#D1D1D6] hover:border-[#121212]'
                  }`}
                >
                  <input
                    type="radio"
                    name="address_choice"
                    className="mt-[3px]"
                    checked={selectedAddressId === addr.id}
                    onChange={() => onSelectAddress(addr.id)}
                  />
                  <span>
                    <span className="font-medium">
                      {addr.label || 'Address'}
                      {addr.is_default ? ' · Default' : ''}
                    </span>
                    <br />
                    <span className="text-[#8E8E93]">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ''},{' '}
                      {addr.city}, {addr.state}
                    </span>
                  </span>
                </label>
              ))}
              <label
                className={`flex cursor-pointer items-center gap-x-3 rounded-[2px] border-2 p-3 text-[13px] transition-all ${
                  selectedAddressId === 'new'
                    ? 'brut-shadow border-[#121212] bg-[#F5F0E8]'
                    : 'border-[#D1D1D6] hover:border-[#121212]'
                }`}
              >
                <input
                  type="radio"
                  name="address_choice"
                  checked={selectedAddressId === 'new'}
                  onChange={() => onSelectAddress('new')}
                />
                <span className="font-medium">Use a new address</span>
              </label>
            </div>
          )}

          {!usingSavedAddress && (
            <>
              {/* Country drives everything below it. Soise ships to
                  diaspora customers, so this cannot be assumed. */}
              <Field label="Country" htmlFor="country">
                <select
                  id="country"
                  name="country"
                  className="brut-input"
                  autoComplete="country-name"
                  value={country}
                  onChange={(e) => onCountryChange(e.target.value)}
                  required
                >
                  {SHIPPING_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Street address" htmlFor="address">
                <input
                  id="address"
                  type="text"
                  name="address"
                  className="brut-input"
                  placeholder="House number and street"
                  autoComplete="address-line1"
                  required
                />
              </Field>
              <div className="grid gap-[10px] sm:grid-cols-2">
              <Field label="City" htmlFor="city">
                <input
                  id="city"
                  type="text"
                  name="city"
                  className="brut-input"
                  autoComplete="address-level2"
                  required
                />
              </Field>
              {/* A fixed list only works for Nigeria. Everywhere else
                  gets free text — no single list covers county,
                  province, prefecture and emirate at once. */}
              <Field
                label={domestic ? 'State' : 'State / Province / Region'}
                htmlFor="state"
              >
                {domestic ? (
                  <select
                    id="state"
                    name="state"
                    className="brut-input"
                    autoComplete="address-level1"
                    required
                  >
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="state"
                    type="text"
                    name="state"
                    className="brut-input"
                    autoComplete="address-level1"
                    required
                  />
                )}
              </Field>
              </div>
              <div className="grid gap-[10px] sm:grid-cols-2">
              {/* Optional in Nigeria, where postal codes are barely
                  used and requiring one is a field with no answer.
                  Required everywhere else, where a parcel genuinely
                  cannot be delivered without it — and not digits-only,
                  because UK and Canadian codes contain letters. */}
              <Field
                label="Postal / ZIP code"
                htmlFor="zipCode"
                hint={domestic ? 'Optional' : undefined}
              >
                <input
                  id="zipCode"
                  type="text"
                  name="zipCode"
                  inputMode={domestic ? 'numeric' : 'text'}
                  className="brut-input"
                  autoComplete="postal-code"
                  required={!domestic}
                  onInput={
                    domestic
                      ? (e: React.FormEvent<HTMLInputElement>) => {
                          e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
                        }
                      : undefined
                  }
                />
              </Field>
              <Field
                label="Phone number"
                htmlFor="phone"
                hint={
                  domestic
                    ? 'Optional for first-time shoppers'
                    : 'Include your country code'
                }
              >
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  className="brut-input"
                  autoComplete="tel"
                  defaultValue={prefillPhone}
                  required={false}
                  // Removed maxLength restriction to allow various formats
                  // Removed aggressive input filtering
                />
              </Field>
              </div>
            </>
          )}
        </div>

        <button
          type="submit"
          className="brut-btn brut-press"
          disabled={pending || cartEmpty}
        >
          {pending
            ? 'Processing…'
            : isPaid
              ? 'Confirm delivery details'
              : `Pay ${formatPrice(totalAfterCredit)}`}
        </button>
      </div>
    </form>
  );
}
