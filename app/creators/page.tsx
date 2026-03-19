import CreatorsApplicationClient from './creatorsClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function creatorsPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const res = await fetch(`${baseUrl}/creators/application`, {
    method: 'GET',
    headers: {
      Cookie: `access_token=${accessToken}`,
    },
  });

  const data = await res.json();

  if (data.data?.status === 'submitted') {
    redirect('/creators/onboarding');
  }

  return <CreatorsApplicationClient />;
}
