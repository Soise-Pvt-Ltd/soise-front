import { Toaster } from 'sonner';
import { requireRole } from '@/lib/require-role';
import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';

// robots.txt stops crawling, not indexing: a URL discovered from any inbound
// link can still be indexed URL-only. An explicit noindex is the only thing
// that keeps authenticated areas out of search results entirely.
export const metadata: Metadata = NOINDEX;

export const dynamic = 'force-dynamic';

// Gate the entire Admin dashboard (/dashboard/*): admins only. This is the
// authoritative server-side check (the `isAdmin` cookie is only a UX hint;
// the backend role is the source of truth).
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(['admin'], {
    deniedTo: '/',
    reason: 'admin-only',
    loginCallback: '/dashboard',
  });
  return (
    <>
      {/* sonner renders nothing unless a Toaster is mounted. The dashboard's
          own toast system (./toast) is separate and does not receive anything
          sent through @/lib/toast-utils, which OrderActionsMenu uses — so
          every failed order-status change here was silent. */}
      {/* `richColors` painted these in stock traffic-light green/red, which is
          the one thing the suite's palette does not contain. Toned to the
          same paper/ink/gold set as the dashboard's own toasts. */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#FBF9F4',
            border: '1px solid #E2DBCC',
            color: '#14110E',
            borderRadius: '12px',
            fontSize: '13px',
            boxShadow: '0 18px 40px -20px rgba(20,17,14,0.35)',
          },
        }}
      />
      {children}
    </>
  );
}
