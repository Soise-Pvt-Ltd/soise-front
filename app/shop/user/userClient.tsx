'use client';

import { useState } from 'react';
import Footer from '@/components/footer';
import { motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { showToast } from '@/lib/toast-utils';
import {
  updateShopProfile,
  changePassword,
  addAddress,
  setDefaultAddress,
  deleteAddress,
} from './actions';

const sectionVariant = {
  hidden: { opacity: 0, y: 25 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.12,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

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
  });
  const [addingAddr, setAddingAddr] = useState(false);
  const [busyAddrId, setBusyAddrId] = useState<string | null>(null);

  async function handleAddAddress() {
    if (!addr.line1 || !addr.city || !addr.state || !addr.postal_code) {
      showToast.error('Address, city, state and ZIP are required.');
      return;
    }
    setAddingAddr(true);
    const r = await addAddress({ ...addr, country: 'Nigeria' });
    setAddingAddr(false);
    if (r.success) {
      const created = r.data as Address | null;
      if (created) setAddresses((prev) => [...prev, created]);
      setAddr({ line1: '', city: '', state: '', postal_code: '', label: '' });
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
      <div className="profile mx-auto space-y-[38px] px-[16px] md:max-w-7xl">
        {/* Account Management */}
        <motion.div custom={0} variants={sectionVariant} initial="hidden" animate="show">
          <h1 className="text-[16px] uppercase">Account Management</h1>
          <div className="mt-[24px] mb-[18px] space-y-[10px]">
            <div>
              <label>Old password</label>
              <input
                type="password"
                className="solid"
                placeholder="✱✱✱✱✱✱✱✱"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label>New password</label>
              <input
                type="password"
                className="solid"
                placeholder="✱✱✱✱✱✱✱✱"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          <motion.button
            type="button"
            onClick={handleSavePassword}
            disabled={savingPw}
            className="btn_outline disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {savingPw ? 'Saving…' : 'Save Password'}
          </motion.button>
        </motion.div>

        {/* Profile Information */}
        <motion.div custom={1} variants={sectionVariant} initial="hidden" animate="show">
          <h1 className="text-[16px] uppercase">Profile Information</h1>
          <div className="mt-[24px] mb-[18px] space-y-[10px]">
            <div>
              <label>Username</label>
              <input
                type="text"
                className="solid opacity-60"
                value={username}
                disabled
                readOnly
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="text"
                className="solid opacity-60"
                value={email}
                disabled
                readOnly
              />
            </div>
            <div>
              <label>Firstname</label>
              <input
                type="text"
                className="solid"
                placeholder="John"
                value={profile.first_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, first_name: e.target.value }))
                }
              />
            </div>
            <div>
              <label>Lastname</label>
              <input
                type="text"
                className="solid"
                placeholder="Sosie"
                value={profile.last_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, last_name: e.target.value }))
                }
              />
            </div>
            <div>
              <label>Phone</label>
              <input
                type="tel"
                className="solid"
                placeholder="08012345678"
                value={profile.phone}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>
          </div>
          <motion.button
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="btn_outline disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {savingProfile ? 'Saving…' : 'Save Changes'}
          </motion.button>
        </motion.div>

        {/* Delivery */}
        <motion.div custom={2} variants={sectionVariant} initial="hidden" animate="show">
          <h1 className="text-[16px] uppercase">Delivery</h1>

          {/* Existing addresses */}
          {addresses.length > 0 && (
            <div className="mt-[24px] space-y-[10px]">
              {addresses.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-[10px] border border-[#E5E5EA] p-[14px]"
                >
                  <div className="text-[13px]">
                    <div className="font-medium text-[#121212]">
                      {a.line1}
                      {a.is_default && (
                        <span className="ml-2 rounded-full bg-[#CCEAD6] px-2 py-[1px] text-[10px] font-medium text-[#32AC5B]">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-[#8E8E93]">
                      {[a.city, a.state, a.postal_code, a.country]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-[12px]">
                    {!a.is_default && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(a.id)}
                        disabled={busyAddrId === a.id}
                        className="text-[#0072BB] underline-offset-2 hover:underline disabled:opacity-50"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(a.id)}
                      disabled={busyAddrId === a.id}
                      className="text-[#8E8E93] underline-offset-2 hover:text-[#121212] hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add a new address */}
          <div className="mt-[24px] mb-[18px] space-y-[10px] py-[20px]">
            <select className="solid" value="Nigeria" disabled>
              <option>Nigeria</option>
            </select>
            <input
              type="text"
              className="solid"
              placeholder="Address"
              value={addr.line1}
              onChange={(e) => setAddr((a) => ({ ...a, line1: e.target.value }))}
            />
            <input
              type="text"
              className="solid"
              placeholder="City"
              value={addr.city}
              onChange={(e) => setAddr((a) => ({ ...a, city: e.target.value }))}
            />
            <input
              type="text"
              className="solid"
              placeholder="State"
              value={addr.state}
              onChange={(e) => setAddr((a) => ({ ...a, state: e.target.value }))}
            />
            <input
              type="text"
              className="solid"
              placeholder="ZIP code"
              value={addr.postal_code}
              onChange={(e) =>
                setAddr((a) => ({ ...a, postal_code: e.target.value }))
              }
            />
            <input
              type="text"
              className="solid"
              placeholder="Label (e.g. Home, Work)"
              value={addr.label}
              onChange={(e) => setAddr((a) => ({ ...a, label: e.target.value }))}
            />
          </div>

          <motion.button
            type="button"
            onClick={handleAddAddress}
            disabled={addingAddr}
            className="btn_outline disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {addingAddr ? 'Adding…' : 'Add Address'}
          </motion.button>
        </motion.div>
      </div>
      <Footer />
    </>
  );
}
