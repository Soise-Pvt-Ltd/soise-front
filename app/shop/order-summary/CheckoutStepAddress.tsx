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
        <h1 className="text-[16px] font-bold uppercase">Delivery address</h1>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mt-[24px] mb-[18px] space-y-[10px]">
          <div className="mb-[16px] rounded-[10px] border border-[#CCEAD6] bg-[#F5FCF7] px-[14px] py-[12px]">
            <p className="text-[13px] font-medium text-[#121212]">
              {isPaid ? 'Payment received ✓ · Last step' : 'Step 2 of 2'}
            </p>
            <p className="mt-[2px] text-[12px] text-[#8E8E93]">
              {isPaid
                ? 'Where should we send it? Your order is confirmed either way — we’ll email you if anything’s missing.'
                : 'Please provide your delivery details to complete your order.'}
            </p>
          </div>

          {savedAddresses.length > 0 && (
            <div className="space-y-[8px] pb-[4px]">
              {savedAddresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex cursor-pointer items-start gap-x-3 rounded-[10px] border p-3 text-[13px] transition-colors ${
                    selectedAddressId === addr.id
                      ? 'border-[#121212] bg-[#F7F7F7]'
                      : 'border-[#D1D1D6]'
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
                className={`flex cursor-pointer items-center gap-x-3 rounded-[10px] border p-3 text-[13px] transition-colors ${
                  selectedAddressId === 'new'
                    ? 'border-[#121212] bg-[#F7F7F7]'
                    : 'border-[#D1D1D6]'
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
                  className="solid"
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
                  className="solid"
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
                  className="solid"
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
                    className="solid"
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
                    className="solid"
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
                  className="solid"
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
                  className="solid"
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
          className="btn_black"
          disabled={pending || cartEmpty}
        >
          {pending
            ? 'Processing...'
            : isPaid
              ? 'Confirm delivery details'
              : `Pay ${formatPrice(totalAfterCredit)}`}
        </button>
      </div>
    </form>
  );
}
