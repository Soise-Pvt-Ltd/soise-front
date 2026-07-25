import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';

// Login, register, OTP and password-reset screens carry no content anyone
// searches for, but they DO attract inbound links (the middleware redirects
// every gated URL here with a ?callbackUrl). Left indexable, they generate a
// pile of thin, near-duplicate results that dilute the brand's own SERP.
export const metadata: Metadata = NOINDEX;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
