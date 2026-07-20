'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

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

  let shippingPayload: Record<string, unknown>;

  if (selectedAddressId) {
    // Reusing a saved address — the backend looks it up by id and re-verifies
    // ownership, so we don't need to (or want to) resend the full address.
    shippingPayload = { shipping_addr: selectedAddressId };
  } else {
    const country = formData.get('country') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const zipCode = formData.get('zipCode') as string;
    const phone = formData.get('phone') as string;

    const requiredManualFields = { country, address, city, state, zipCode, phone };
    for (const [key, value] of Object.entries(requiredManualFields)) {
      if (!value || value.trim() === '') {
        return { success: false, error: `${key} is required` };
      }
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

    const response = await fetch(checkoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Cookie: `access_token=${accessToken}` } : {}),
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        ...shippingPayload,
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

    const authUrl = data?.data?.payment?.checkout_metadata?.authorization_url;
    // When store credit fully covers the order, the backend marks it paid and
    // returns no Paystack URL — go straight to the thank-you page.
    const fullyCovered =
      data?.data?.payment?.fully_covered === true ||
      data?.data?.order?.status === 'paid';

    // Hand the destination back to the client to navigate. We deliberately do
    // NOT call redirect() here: a server-action redirect rejects the client
    // promise with NEXT_REDIRECT, which the caller's catch surfaced as a bogus
    // "An error occurred during checkout" toast — even though the navigation
    // to Paystack still happened. Returning the URL lets the client do a clean
    // window.location navigation with no spurious error.
    if (authUrl) {
      return { success: true as const, redirectUrl: authUrl as string };
    }
    if (fullyCovered) {
      return { success: true as const, redirectUrl: '/thank-you' };
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
