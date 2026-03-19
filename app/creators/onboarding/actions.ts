'use server';

import { cookies } from 'next/headers';

export async function savePaymentInformation(formData: FormData) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const bankCode = formData.get('bankCode');
  const bankName = formData.get('bankName');
  const accountName = formData.get('accountName');
  const accountNumber = formData.get('accountNumber');

  const payload = {
    bank_code: bankCode,
    bank_name: bankName,
    account_name: accountName,
    account_number: accountNumber,
  };

  try {
    const response = await fetch(`${baseUrl}/creators/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `access_token=${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { success: false, error: await response.text() };
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    console.error('Error saving payment information:', error);
    return { success: false, error: 'Failed to save payment information' };
  }
}
