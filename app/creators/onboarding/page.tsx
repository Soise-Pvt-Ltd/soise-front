import OnBoardingCreatorClient from './onboardingClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { json } from 'stream/consumers';

export default async function onBoardingCreatorPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const headers = {
    Cookie: `access_token=${accessToken}`,
  };

  let banks = null;
  let codes = null;
  let payInfo = null;
  let shouldRedirect = false;

  try {
    const [banksRes, codesRes, payInfoRes] = await Promise.all([
      fetch(`${baseUrl}/payments/banks`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/creators/codes`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/creators/dashboard`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      }),
    ]);

    if (banksRes.ok) {
      const res = await banksRes.json();
      banks = res.data;
    } else {
      console.error('Banks error:', await banksRes.text());
    }

    if (codesRes.ok) {
      const res = await codesRes.json();
      codes = res.data;

      if (codes === null || codes === undefined || codes.length === 0) {
        const generateRes = await fetch(`${baseUrl}/creators/generate`, {
          method: 'POST',
          headers,
          cache: 'no-store',
          body: JSON.stringify({}),
        });

        if (generateRes.ok) {
          const generatedCodes = await generateRes.json();
          console.log('Generated Codes:', generatedCodes);
          codes = generatedCodes.data || generatedCodes;
        } else {
          console.error('Generate codes error:', await generateRes.text());
        }
      }
    } else {
      console.error('Codes error:', await codesRes.text());
    }

    if (payInfoRes.ok) {
      const res = await payInfoRes.json();
      payInfo = res.data?.withdrawal_bank;

      const hasValidWithdrawalBank =
        payInfo &&
        typeof payInfo === 'object' &&
        Object.keys(payInfo).length > 0 &&
        payInfo.account_name &&
        payInfo.account_number &&
        payInfo.bank_name;

      if (hasValidWithdrawalBank) {
        shouldRedirect = true;
      }
    } else {
      console.error('PayInfo error:', await payInfoRes.text());
    }
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
  }

  if (shouldRedirect) {
    redirect('/creators/dashboard');
  }

  return <OnBoardingCreatorClient banks={banks} codes={codes} />;
}
