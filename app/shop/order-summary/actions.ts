'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

interface DeliveryData {
  country: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

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

export async function checkoutAction(formData: FormData) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const guestId = cookieStore.get('soise_guestId')?.value;

  const deliveryData: DeliveryData = {
    country: formData.get('country') as string,
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    zipCode: formData.get('zipCode') as string,
    phone: formData.get('phone') as string,
  };

  const creatorCode = formData.get('creator_code') as string | null;
  const email = formData.get('email') as string | null;

  // Validate required fields
  const requiredFields = Object.entries(deliveryData);
  for (const [key, value] of requiredFields) {
    if (!value || value.trim() === '') {
      return {
        success: false,
        error: `${key} is required`,
      };
    }
  }

  // Email required for guest checkout
  if (!accessToken && (!email || email.trim() === '')) {
    return {
      success: false,
      error: 'Email is required for guest checkout',
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
        ...deliveryData,
        ...(creatorCode ? { creator_code: creatorCode } : {}),
        ...(!accessToken && email ? { email } : {}),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();

    const authUrl = data?.data?.payment?.checkout_metadata?.authorization_url;

    if (authUrl) {
      redirect(authUrl);
    } else {
      return {
        success: false,
        error: 'Checkout failed - No authorization URL received',
      };
    }
  } catch (error) {
    console.error('Checkout error:', error);

    // Handle redirect errors (Next.js redirects throw NEXT_REDIRECT)
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }

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
