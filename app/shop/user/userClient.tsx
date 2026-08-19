'use client';

import { useState } from 'react';
import Footer from '@/components/footer';
import { Toaster } from 'sonner';
import { showToast } from '@/lib/toast-utils';
import {
  updateShopProfile,
  changePassword,
  addAddress,
  setDefaultAddress,
  deleteAddress,
} from './actions';
import {
  SHIPPING_COUNTRIES,
  DEFAULT_COUNTRY,
  isDomestic,
} from '@/lib/countries';

/**
 * PRESSED INK — the account page, pressed to match the checkout it sits beside
 * (see the brut- tokens in globals.css and app/contact/page.tsx). Bone paper,
 * 2px ink rules, Instrument Serif display type, one crimson accent.
 *
 * The entrance is the CSS-only `brut-rise` stagger rather than Framer variants:
 * this page is behind auth and mostly read, so paint beats choreography.
 */

const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

/** Index number + rule — the editorial section head, pressed harder. */
function IndexHead({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-x-3">
      <span className="text-[12px] font-bold tracking-[0.08em] text-[#B3101C]">
        {n}
      </span>
      <span className="brut-label">{title}</span>
      <span className="brut-rule mt-auto mb-[6px] flex-1 opacity-20" />
    </div>
  );
}

/**
 * A labelled field. The old page leaned on `.profile label` for its type; the
 * label is now the pressed micro-label the whole surface language uses, so the
 * `profile` class is gone from the shell above.
 */
function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <label htmlFor={htmlFor} className="brut-label mb-[8px] block">
        {label}
        {hint && (
          <span className="ml-[8px] font-medium tracking-[0.04em] text-[#5C544A] normal-case">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

interface Address {
  id: string;
  label?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  is_default?: boolean;
}

export default function UserClient({ account }: { account?: any }) {
  const username = account?.username || '';
  const email = account?.email || '';

  // ── Password ──────────────────────────────────────────────
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  async function handleSavePassword() {
    if (!oldPassword || !newPassword) {
      showToast.error('Enter your current and new password.');
      return;
    }
    if (newPassword.length < 8) {
      showToast.error('New password must be at least 8 characters.');
      return;
    }
    setSavingPw(true);
    const r = await changePassword(oldPassword, newPassword);
    setSavingPw(false);
    if (r.success) {
      showToast.success('Password updated.');
      setOldPassword('');
      setNewPassword('');
    } else {
      showToast.error(r.error);
    }
  }

  // ── Profile information ───────────────────────────────────
  const [profile, setProfile] = useState({
    first_name: account?.first_name || '',
    last_name: account?.last_name || '',
    phone: account?.phone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  async function handleSaveProfile() {
    if (!profile.first_name.trim()) {
      showToast.error('First name is required.');
      return;
    }
    setSavingProfile(true);
    const r = await updateShopProfile({
      first_name: profile.first_name.trim(),
      last_name: profile.last_name.trim(),
      phone: profile.phone.trim(),
    });
    setSavingProfile(false);
    if (r.success) showToast.success('Profile updated.');
    else showToast.error(r.error);
  }

  // ── Delivery addresses ────────────────────────────────────
  const [addresses, setAddresses] = useState<Address[]>(
    Array.isArray(account?.addresses) ? account.addresses : [],
  );
  const [addr, setAddr] = useState({
    line1: '',
    city: '',
    state: '',
    postal_code: '',
    label: '',
    country: DEFAULT_COUNTRY,
  });
  const [addingAddr, setAddingAddr] = useState(false);
  const [busyAddrId, setBusyAddrId] = useState<string | null>(null);

  async function handleAddAddress() {
    // Postal code is optional for Nigeria (rarely known) but required abroad,
    // where a parcel can't be delivered without one.
    const domestic = isDomestic(addr.country);
    if (!addr.line1 || !addr.city || !addr.state) {
      showToast.error('Address, city and state are required.');
      return;
    }
    if (!domestic && !addr.postal_code) {
      showToast.error('A postal / ZIP code is required for this country.');
      return;
    }
    setAddingAddr(true);
    // Was hardcoded to Nigeria, which silently rewrote a diaspora customer's
    // country to Nigeria on every saved address.
    const r = await addAddress({ ...addr, country: addr.country || DEFAULT_COUNTRY });
    setAddingAddr(false);
    if (r.success) {
      const created = r.data as Address | null;
      if (created) setAddresses((prev) => [...prev, created]);
      setAddr({ line1: '', city: '', state: '', postal_code: '', label: '', country: DEFAULT_COUNTRY });
      showToast.success('Address added.');
    } else {
      showToast.error(r.error);
    }
  }

  async function handleSetDefault(id: string) {
    setBusyAddrId(id);
    const r = await setDefaultAddress(id);
    setBusyAddrId(null);
    if (r.success) {
      if (Array.isArray(r.data)) setAddresses(r.data as Address[]);
      showToast.success('Default address updated.');
    } else {
      showToast.error(r.error);
    }
  }

  async function handleDeleteAddress(id: string) {
    setBusyAddrId(id);
    const r = await deleteAddress(id);
    setBusyAddrId(null);
    if (r.success) {
      if (Array.isArray(r.data)) setAddresses(r.data as Address[]);
      else setAddresses((prev) => prev.filter((a) => a.id !== id));
      showToast.success('Address removed.');
    } else {
      showToast.error(r.error);
    }
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      {/* Bone ground runs behind the footer too, so the page has one paper. */}
      <div className="bg-[#F5F0E8] text-[#121212]">
        <div className="mx-auto max-w-[880px] px-5 pt-10 pb-24">
          <header className="brut-rise">
            <p className="brut-label text-[#B3101C]">Your account</p>
            <h1
              className="mt-4 text-[48px] leading-[0.95] tracking-tight uppercase sm:text-[72px]"
              style={serif}
            >
              Settings<span className="text-[#B3101C]">.</span>
            </h1>
            {email && (
              <p className="mt-6 text-[15px] leading-relaxed break-all text-[#3F3830]">
                Signed in as {email}
              </p>
            )}
          </header>

          {/* 01 — Account Management */}
          <section className="brut-rise mt-14" style={{ animationDelay: '0.08s' }}>
            <IndexHead n="01" title="Account Management" />
            <div className="mt-5 space-y-[14px]">
              <Field label="Old password" htmlFor="old-password">
                <input
                  id="old-password"
                  type="password"
                  className="brut-input"
                  placeholder="✱✱✱✱✱✱✱✱"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </Field>
              <Field
                label="New password"
                htmlFor="new-password"
                hint="At least 8 characters"
              >
                <input
                  id="new-password"
                  type="password"
                  className="brut-input"
                  placeholder="✱✱✱✱✱✱✱✱"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
            </div>
            <button
              type="button"
              onClick={handleSavePassword}
              disabled={savingPw}
              className="brut-btn-paper brut-press mt-5"
            >
              {savingPw ? 'Saving…' : 'Save Password'}
            </button>
          </section>

          {/* 02 — Profile Information */}
          <section className="brut-rise mt-14" style={{ animationDelay: '0.16s' }}>
            <IndexHead n="02" title="Profile Information" />
            <div className="mt-5 space-y-[14px]">
              <div className="grid gap-[14px] sm:grid-cols-2">
                <Field label="Username" htmlFor="username" hint="Locked">
                  <input
                    id="username"
                    type="text"
                    className="brut-input opacity-60"
                    value={username}
                    disabled
                    readOnly
                  />
                </Field>
                <Field label="Email" htmlFor="email" hint="Locked">
                  <input
                    id="email"
                    type="text"
                    className="brut-input opacity-60"
                    value={email}
                    disabled
                    readOnly
                  />
                </Field>
              </div>
              <div className="grid gap-[14px] sm:grid-cols-2">
                <Field label="Firstname" htmlFor="first-name">
                  <input
                    id="first-name"
                    type="text"
                    className="brut-input"
                    placeholder="John"
                    value={profile.first_name}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, first_name: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Lastname" htmlFor="last-name">
                  <input
                    id="last-name"
                    type="text"
                    className="brut-input"
                    placeholder="Sosie"
                    value={profile.last_name}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, last_name: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <Field label="Phone" htmlFor="phone">
                <input
                  id="phone"
                  type="tel"
                  className="brut-input"
                  placeholder="08012345678"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </Field>
            </div>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="brut-btn-paper brut-press mt-5"
            >
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </section>

          {/* 03 — Delivery */}
          <section className="brut-rise mt-14" style={{ animationDelay: '0.24s' }}>
            <IndexHead n="03" title="Delivery" />

            {/* Existing addresses. A list, not a stack of cards: one plate,
                rows separated by an ink rule. Giving every address its own
                shadowed plate reads as noise the moment there are three. */}
            {addresses.length > 0 && (
              <div className="brut-plate brut-shadow mt-5">
                {addresses.map((a, i) => (
                  <div
                    key={a.id}
                    className={`flex items-start justify-between gap-4 px-[18px] py-[16px] ${
                      i > 0 ? 'brut-rule' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <p className="text-[15px] font-medium">{a.line1}</p>
                        {a.is_default && (
                          <span className="brut-stamp">Default</span>
                        )}
                      </div>
                      <p className="mt-[4px] text-[13px] leading-relaxed text-[#5C544A]">
                        {[a.city, a.state, a.postal_code, a.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-[8px] text-[11px] font-bold tracking-[0.12em] uppercase">
                      {!a.is_default && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(a.id)}
                          disabled={busyAddrId === a.id}
                          className="cursor-pointer text-[#B3101C] underline-offset-2 hover:underline disabled:opacity-40"
                        >
                          Set default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(a.id)}
                        disabled={busyAddrId === a.id}
                        className="cursor-pointer text-[#5C544A] underline-offset-2 hover:text-[#121212] hover:underline disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add a new address */}
            <div className="mt-8 space-y-[14px]">
              {/* Was a disabled "Nigeria" box. Soise ships to diaspora
                  customers, so this has to be a real choice. */}
              <Field label="Country" htmlFor="addr-country">
                <select
                  id="addr-country"
                  className="brut-input"
                  value={addr.country || DEFAULT_COUNTRY}
                  onChange={(e) =>
                    setAddr((a) => ({ ...a, country: e.target.value }))
                  }
                >
                  {SHIPPING_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Address" htmlFor="addr-line1">
                <input
                  id="addr-line1"
                  type="text"
                  className="brut-input"
                  placeholder="Address"
                  value={addr.line1}
                  onChange={(e) => setAddr((a) => ({ ...a, line1: e.target.value }))}
                />
              </Field>
              <div className="grid gap-[14px] sm:grid-cols-2">
                <Field label="City" htmlFor="addr-city">
                  <input
                    id="addr-city"
                    type="text"
                    className="brut-input"
                    placeholder="City"
                    value={addr.city}
                    onChange={(e) => setAddr((a) => ({ ...a, city: e.target.value }))}
                  />
                </Field>
                <Field label="State" htmlFor="addr-state">
                  <input
                    id="addr-state"
                    type="text"
                    className="brut-input"
                    placeholder="State"
                    value={addr.state}
                    onChange={(e) => setAddr((a) => ({ ...a, state: e.target.value }))}
                  />
                </Field>
              </div>
              <div className="grid gap-[14px] sm:grid-cols-2">
                <Field
                  label="ZIP code"
                  htmlFor="addr-zip"
                  hint={isDomestic(addr.country) ? 'Optional' : undefined}
                >
                  <input
                    id="addr-zip"
                    type="text"
                    className="brut-input"
                    placeholder="ZIP code"
                    value={addr.postal_code}
                    onChange={(e) =>
                      setAddr((a) => ({ ...a, postal_code: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Label" htmlFor="addr-label" hint="Optional">
                  <input
                    id="addr-label"
                    type="text"
                    className="brut-input"
                    placeholder="Label (e.g. Home, Work)"
                    value={addr.label}
                    onChange={(e) => setAddr((a) => ({ ...a, label: e.target.value }))}
                  />
                </Field>
              </div>
            </div>

            {/* The one ink plate on the page. A saved default address is the
                only action here that pays off later — it takes fields out of
                checkout, which is where this store actually loses people. */}
            <button
              type="button"
              onClick={handleAddAddress}
              disabled={addingAddr}
              className="brut-btn brut-press mt-6"
            >
              {addingAddr ? 'Adding…' : 'Add Address'}
            </button>
          </section>
        </div>
        <Footer />
      </div>
    </>
  );
}
