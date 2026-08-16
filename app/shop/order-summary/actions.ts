'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { apiForwardCookie } from '@/lib/tracking';
import { DEFAULT_COUNTRY, isDomestic } from '@/lib/countries';

interface ApplyCodeResponse {
  status?: boolean;
  success?: boolean;
  message: string;
  data?: {
    code?: string;
    valid?: boolean;
    subtotal?: number;
    discount_percentage?: number;
    discount_amount?: number;
    final_total?: number;
    creator?: {
      id: string;
      username: string;
      first_name: string;
      last_name: string;
    };
  };
}

interface CheckoutResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  redirectUrl?: string;
  // The order id (== payment reference). Returned so the client can persist a
  // pending order and resume its payment if the post-checkout redirect fails.
  orderId?: string;
  // The Bachs hosted checkout_url from the server-side session create. Lets
  // the client open the checkout in an overlay (bachs.js) rather than sending
  // the shopper away to a hosted page.
  //
  // Deliberately a server-created session URL and NOT an amount: the session's
  // value was fixed on the server with the secret key, so the price stays
  // server-authoritative. Building a checkout in the browser from an amount
  // would reintroduce exactly the client-sets-its-own-price hole that
  // shipping_total already was.
  checkoutUrl?: string;
}

interface UpdateShippingResult {
  success: boolean;
  error?: string;
}

export async function checkoutAction(formData: FormData): Promise<CheckoutResult> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const guestId = cookieStore.get('soise_guestId')?.value;

  const selectedAddressId = formData.get('selected_address_id') as string | null;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;

  // Required regardless of which address path is used: who it's for.
  if (!firstName?.trim() || !lastName?.trim()) {
    return { success: false, error: 'firstName and lastName are required' };
  }

  let shippingPayload: Record<string, unknown> | undefined;

  if (selectedAddressId) {
    // Reusing a saved address — the backend looks it up by id and re-verifies
    // ownership, so we don't need to (or want to) resend the full address.
    shippingPayload = { shipping_addr: selectedAddressId };
  } else {
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const phone = formData.get('phone') as string;
    const zipCode = ((formData.get('zipCode') as string) || '').trim();
    // Soise ships to diaspora customers, so country is a real choice and must
    // come from the form. It defaults to Nigeria only when absent entirely.
    const country =
      ((formData.get('country') as string) || DEFAULT_COUNTRY).trim();

    // Two-step checkout: address fields are optional in Step 1
    // Only validate if at least one address field is provided (Step 2)
    const hasAddressFields = address || city || state || country || phone;
    if (hasAddressFields) {
      const requiredManualFields = { country, address, city, state };
      for (const [key, value] of Object.entries(requiredManualFields)) {
        if (!value || value.trim() === '') {
          return { success: false, error: `${key} is required` };
        }
      }

      // Postal code is optional in Nigeria, where it's rarely known and gating
      // payment on it loses shoppers with nothing valid to type. Everywhere else
      // a parcel genuinely cannot be delivered without one.
      if (!isDomestic(country) && !zipCode) {
        return {
          success: false,
          error: 'A postal / ZIP code is required for international delivery',
        };
      }

      // Maps our form field names onto the backend's reusable address schema
      // (label/line1/line2/city/state/country/postal_code/phone). Sending this
      // as `shipping_address` (rather than flat top-level fields) is what
      // actually triggers auto-save + default-address logic server-side.
      shippingPayload = {
        shipping_address: {
          label: 'Home',
          line1: address,
          line2: '',
          city,
          state,
          country,
          postal_code: zipCode,
          phone,
        },
      };
    }
    // If no address fields provided (Step 1), shippingPayload remains empty
    // Backend will create order without address (two-step checkout)
  }

  const creatorCode = formData.get('creator_code') as string | null;
  const email = formData.get('email') as string | null;
  // Only authenticated users have store credit; honor the toggle from the
  // order summary. The backend reduces (or fully covers) the charge.
  const useStoreCredit =
    !!accessToken && formData.get('use_store_credit') === 'true';

  // Email required for guest checkout
  if (!accessToken && (!email || email.trim() === '')) {
    return {
      success: false,
      error: 'Email is required for guest checkout',
    };
  }

  if (!accessToken && !guestId) {
    return {
      success: false,
      error: 'Your session has expired. Please sign in and try again.',
    };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!baseUrl) {
      return { success: false, error: 'API base URL is not configured' };
    }

    const checkoutUrl = accessToken
      ? `${baseUrl}/cart/checkout`
      : `${baseUrl}/cart/checkout?session_id=${guestId || ''}`;

    // Forward TikTok attribution cookies (_ttp / ttclid) so the backend can
    // attribute this InitiateCheckout to the ad that drove the visit. Without
    // this, guest checkouts reached TikTok with no click id.
    const forwardCookie = await apiForwardCookie();

    const response = await fetch(checkoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(forwardCookie ? { Cookie: forwardCookie } : {}),
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        ...(shippingPayload ? shippingPayload : {}),
        ...(creatorCode ? { creator_code: creatorCode } : {}),
        ...(!accessToken && email ? { email } : {}),
        ...(useStoreCredit ? { use_store_credit: true } : {}),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error:
          errorData?.message || `Checkout failed (status ${response.status})`,
        errorCode: errorData?.details?.code as string | undefined,
      };
    }

    const data = await response.json();

    const checkoutMeta = data?.data?.payment?.checkout_metadata;
    // checkout_url is the Bachs field; authorization_url is the same value
    // under its legacy name, kept server-side for older clients.
    const payUrl = (checkoutMeta?.checkout_url ||
      checkoutMeta?.authorization_url) as string | undefined;
    // When store credit fully covers the order, the backend marks it paid and
    // returns no payment URL — go straight to the thank-you page.
    const fullyCovered =
      data?.data?.payment?.fully_covered === true ||
      data?.data?.order?.status === 'paid';

    // Hand the destination back to the client to navigate. We deliberately do
    // NOT call redirect() here: a server-action redirect rejects the client
    // promise with NEXT_REDIRECT, which the caller's catch surfaced as a bogus
    // "An error occurred during checkout" toast — even though the navigation
    // to the payment page still happened. Returning the URL lets the client do
    // a clean window.location navigation with no spurious error.
    // The order id doubles as the payment reference. Hand it back so the
    // client can persist it and resume payment (see resumePaymentAction) if the
    // redirect below never lands — the order + a payable URL already exist
    // server-side, so a dropped redirect must not strand the shopper.
    const orderId = data?.data?.order?.id as string | undefined;

    if (payUrl) {
      return {
        success: true as const,
        redirectUrl: payUrl,
        checkoutUrl: payUrl,
        orderId,
      };
    }
    if (fullyCovered) {
      // Store credit covered everything — there is no payment step at all.
      return { success: true as const, redirectUrl: '/thank-you', orderId };
    }
    // 201 but no URL: the order exists and its checkout_url is stored on
    // the payment record — recover via resume rather than dead-ending.
    if (orderId) {
      return { success: false as const, error: 'no_payment_link', orderId };
    }
    return {
      success: false,
      error: 'Checkout failed — no payment link was returned.',
    };
  } catch (error) {
    console.error('Checkout error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Resume payment for an existing pending order.
 *
 * The durable fix for a failed post-checkout redirect: the order and a payable
 * Bachs checkout URL already exist server-side, so recovery is just "hand me
 * that URL again." Idempotent — no new order, no new checkout session unless
 * the old one is spent. Works for guests and authenticated users alike (keyed
 * on the order id / reference).
 */
export async function resumePaymentAction(
  orderId: string,
): Promise<CheckoutResult> {
  if (!orderId) return { success: false, error: 'Missing order reference' };

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) return { success: false, error: 'API base URL is not configured' };

  try {
    const response = await fetch(`${baseUrl}/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Cookie: `access_token=${accessToken}` } : {}),
      },
      body: JSON.stringify({ reference: orderId }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error:
          data?.message ||
          `Could not resume payment (status ${response.status})`,
        orderId,
      };
    }

    // Already settled while we were away — go straight to the thank-you page.
    if (data?.data?.status === 'paid') {
      return { success: true as const, redirectUrl: '/thank-you', orderId };
    }

    const meta = data?.data?.checkout_metadata;
    const payUrl = (meta?.checkout_url || meta?.authorization_url) as
      | string
      | undefined;
    if (payUrl) {
      return {
        success: true as const,
        redirectUrl: payUrl,
        checkoutUrl: payUrl,
        orderId,
      };
    }

    return {
      success: false,
      error: 'No payment link is available for this order.',
      orderId,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Could not resume payment',
      orderId,
    };
  }
}

export async function applyDiscountCodeAction(code: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const guestId = cookieStore.get('soise_guestId')?.value;

  // Validate code
  if (!code || code.trim() === '') {
    return {
      success: false,
      error: 'Please enter a creator code',
    };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!baseUrl) {
      throw new Error('API base URL is not configured');
    }

    if (!accessToken && !guestId) {
      redirect('/');
    }

    const applyCodeUrl = accessToken
      ? `${baseUrl}/cart/apply-code`
      : `${baseUrl}/cart/apply-code?session_id=${guestId || ''}`;

    const response = await fetch(applyCodeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Cookie: `access_token=${accessToken}` } : {}),
      },
      body: JSON.stringify({ creator_code: code.trim() }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data: ApplyCodeResponse = await response.json();

    if (data.status || data.success) {
      return {
        success: true,
        message: data.message || 'Creator code applied successfully',
        data: data.data,
      };
    } else {
      return {
        success: false,
        error: data.message || 'Failed to apply creator code',
      };
    }
  } catch (error) {
    console.error('Apply creator code error:', error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Attach the shopper's email to their cart as soon as they type it, rather
 * than waiting for checkout submit.
 *
 * That timing is the entire point. Email used to reach the backend only in the
 * submit payload, so every shopper who filled a bag and left — the majority —
 * was unreachable, and an abandoned cart was a dead end. Captured here, it
 * becomes recoverable.
 *
 * Deliberately silent: this is a background nicety and must never interrupt
 * checkout. A failure here is invisible to the shopper by design.
 */
export async function captureCartEmailAction(email: string): Promise<void> {
  if (!email || !email.includes('@')) return;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const guestId = cookieStore.get('soise_guestId')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) return;
  if (!accessToken && !guestId) return;

  const url = accessToken
    ? `${baseUrl}/cart/email`
    : `${baseUrl}/cart/email?session_id=${encodeURIComponent(guestId || '')}`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Cookie: `access_token=${accessToken}` } : {}),
      },
      body: JSON.stringify({ email: email.trim() }),
      cache: 'no-store',
    });
  } catch {
    /* best-effort — never block or surface anything at checkout */
  }
}

/**
 * Abandon an unpaid order the shopper no longer wants.
 *
 * The "awaiting payment" banner used to offer only one action, which made it a
 * one-way door: a shopper who had changed their mind could not clear it. The
 * backend refuses anything that isn't still awaiting payment, so this can never
 * void an order that has actually been paid.
 */
export async function cancelPendingOrderAction(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) return { success: false, error: 'API base URL is not configured' };
  if (!orderId) return { success: false, error: 'Missing order reference' };

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  try {
    const res = await fetch(`${baseUrl}/payments/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Cookie: `access_token=${accessToken}` } : {}),
      },
      body: JSON.stringify({ reference: orderId }),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, error: json?.message || 'Could not cancel this order.' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Could not cancel this order. Please try again.' };
  }
}

export async function updateOrderShippingAction(
  orderId: string,
  shippingAddress: {
    label?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    postal_code?: string;
    phone?: string;
  }
): Promise<UpdateShippingResult> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) return { success: false, error: 'API base URL is not configured' };

  try {
    const res = await fetch(`${baseUrl}/cart/orders/${orderId}/shipping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Cookie: `access_token=${accessToken}` } : {}),
      },
      body: JSON.stringify({ shipping_address: shippingAddress }),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, error: json?.message || 'Failed to update shipping address.' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Could not update shipping address. Please try again.' };
  }
}
