'use client';

import { useState } from 'react';
import { showToast } from '@/lib/toast-utils';
import { updateOrderShippingAction } from '../shop/order-summary/actions';
import { readPendingOrderSecret, clearPendingOrder } from '../shop/order-summary/pending-order';
import { DEFAULT_COUNTRY, isDomestic } from '@/lib/countries';

/**
 * Collects the delivery address for an order that has already been paid for.
 *
 * Checkout takes payment after three fields, so a paid order can legitimately
 * arrive here with nowhere to send it. That is the deliberate trade: every
 * field in front of the pay button is a chance to lose the sale, and an address
 * is far easier to chase than a shopper who never paid.
 *
 * This is the fallback path — when the Bachs overlay runs, the shopper is asked
 * on the order-summary page without ever leaving it. This renders when the
 * overlay was unavailable and the hosted redirect brought them here instead.
 */
/**
 * The per-order secret carried in the URL fragment by the recovery email's
 * link (`/thank-you?reference=…#t=…`).
 *
 * A fragment is never transmitted to the server — not in the request line, not
 * in Referer — so this is the one place a bearer secret can ride in a URL
 * without ending up in an access log, which is why the link uses it rather
 * than a query parameter.
 */
function readSecretFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return null;
    const token = new URLSearchParams(hash).get('t');
    return token && token.trim() ? token : null;
  } catch {
    return null;
  }
}

export default function PostPaymentAddress({
  orderId,
}: {
  orderId: string;
}) {
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [showCountry, setShowCountry] = useState(false);
  const domestic = isDomestic(country);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const firstName = ((formData.get('firstName') as string) || '').trim();
    const lastName = ((formData.get('lastName') as string) || '').trim();
    const line1 = ((formData.get('address') as string) || '').trim();
    const city = ((formData.get('city') as string) || '').trim();
    const state = ((formData.get('state') as string) || '').trim();
    if (!firstName || !line1 || !city || !state) {
      setError('Please fill in your name, address, city and state.');
      setPending(false);
      return;
    }

    try {
      const result = await updateOrderShippingAction(
        orderId,
        {
          label: 'Home',
          line1,
          line2: '',
          city,
          state,
          country,
          postal_code: ((formData.get('zipCode') as string) || '').trim(),
          phone: ((formData.get('phone') as string) || '').trim(),
        },
        // Guest orders prove ownership with the secret stashed at checkout;
        // signed-in orders authenticate with the session cookie the action
        // forwards, and never mint one.
        //
        // The fragment fallback is what makes the "where should we send it?"
        // recovery email work: that link is opened from a mail client, often on
        // a different device or browser, where localStorage holds nothing. The
        // secret travels in the fragment precisely because fragments are never
        // sent to a server — so it authorizes the call without landing in any
        // access log.
        readPendingOrderSecret() ?? readSecretFromHash() ?? undefined,
        // Step 1 of checkout is email-only now, so the recipient's name is
        // collected here with the address it belongs to.
        { firstName, lastName },
      );

      if (result.success) {
        setSaved(true);
        // The order is complete now — stop the summary page nudging to pay.
        clearPendingOrder();
        showToast.success('Delivery details saved');
      } else {
        setError(result.error || 'Could not save your delivery details.');
      }
    } catch {
      setError('Could not save your delivery details. Please try again.');
    } finally {
      setPending(false);
    }
  }

  if (saved) {
    return (
      <div className="mx-auto mt-8 max-w-[520px] rounded-[12px] border border-[#CCEAD6] bg-[#F5FCF7] px-5 py-4 text-left">
        <p className="text-[14px] font-medium text-[#14110E]">
          Delivery details saved.
        </p>
        <p className="mt-1 text-[13px] text-[#5C544A]">
          We have everything we need — you’ll get a dispatch email when it ships.
        </p>
      </div>
    );
  }

  return (
    <form
      action={onSubmit}
      className="brut-plate brut-shadow mx-auto mt-8 max-w-[520px] px-5 py-5 text-left"
    >
      <p className="text-[14px] font-medium text-[#14110E]">
        One last thing — where should we send it?
      </p>
      <p className="mt-1 text-[13px] text-[#5C544A]">
        Your payment is confirmed. We just need a delivery address.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-[13px] text-red-800">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-[12px]">
        {/* Who it's for — checkout's Step 1 is email-only, so the name
            arrives here with the address. */}
        <div className="grid grid-cols-2 gap-[12px]">
          <input
            name="firstName"
            className="brut-input"
            placeholder="First name"
            autoComplete="given-name"
            required
          />
          <input
            name="lastName"
            className="brut-input"
            placeholder="Last name"
            autoComplete="family-name"
            required
          />
        </div>
        <input
          name="address"
          className="brut-input"
          placeholder="Street address"
          autoComplete="address-line1"
          required
        />
        <div className="grid grid-cols-2 gap-[12px]">
          <input
            name="city"
            className="brut-input"
            placeholder="City"
            autoComplete="address-level2"
            required
          />
          <input
            name="state"
            className="brut-input"
            placeholder="State"
            autoComplete="address-level1"
            required
          />
        </div>
        <input
          name="phone"
          type="tel"
          className="brut-input"
          placeholder={domestic ? 'Phone (optional)' : 'Phone with country code'}
          autoComplete="tel"
        />

        {showCountry ? (
          <div className="grid grid-cols-2 gap-[12px]">
            <input
              className="brut-input"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country"
              autoComplete="country-name"
            />
            <input
              name="zipCode"
              className="brut-input"
              placeholder={domestic ? 'Postal code' : 'ZIP / postal code'}
              autoComplete="postal-code"
              required={!domestic}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCountry(true)}
            className="text-[12px] underline text-[#5C544A]"
          >
            Shipping outside Nigeria?
          </button>
        )}
      </div>

      <button type="submit" className="brut-btn brut-press mt-5" disabled={pending}>
        {pending ? 'Saving…' : 'Confirm delivery details'}
      </button>
    </form>
  );
}
