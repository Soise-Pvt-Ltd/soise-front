'use client';

import { useRouter } from 'next/navigation';
import CreatorNav from '@/components/creators/CreatorNav';
import {
  CameraIcon,
  ArrowProfileRightIcon,
  CopyIcon,
  ArrowLeftIcon,
  AdminEditIcon,
  AdminSuccessCheckIcon,
  CloseIcon,
} from '@/components/icons';
import { useRef, useState } from 'react';
import { showToast } from '@/lib/toast-utils';
import { updateProfile } from './actions';

/** Playfair Display — the Ivory House display face. */
const luxe = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

// components/icons.tsx is shared with the storefront and off-limits here, so
// its hard-coded dark strokes are flipped at the call site to survive this
// ground; the one green tick is desaturated rather than dropped.
const INVERT_ICON = { filter: 'invert(1)' } as const;
const NEUTRALISE_ICON = { filter: 'grayscale(1) brightness(0.25)' } as const;

export default function ProfileClient({ dashboard }: any) {
  const router = useRouter();
  const [copiedCreatorCode, setCopiedCreatorCode] = useState(false);

  // Extract data from dashboard prop
  const initialProfile = dashboard?.profile ?? {};
  const creatorCode = dashboard?.creator_code?.code || 'N/A';
  const tier = dashboard?.tier || {};
  const withdrawalBank = dashboard?.withdrawal_bank || {};
  const currentBalance = dashboard?.earnings?.current_balance || 0;

  // Local, editable copy of the profile so edits + avatar uploads reflect
  // immediately without a full page reload.
  const [profile, setProfile] = useState<Record<string, any>>(initialProfile);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Inline "Edit profile" state.
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const deriveNames = () => {
    if (profile.first_name || profile.last_name) {
      return {
        first: profile.first_name || '',
        last: profile.last_name || '',
      };
    }
    const parts = (profile.full_name || '').trim().split(/\s+/).filter(Boolean);
    return {
      first: parts[0] || '',
      last: parts.slice(1).join(' ') || '',
    };
  };
  const [form, setForm] = useState({ first: '', last: '', phone: '' });

  const startEditing = () => {
    const { first, last } = deriveNames();
    setForm({ first, last, phone: profile.phone || '' });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (saving) return;
    setIsEditing(false);
  };

  const handleSave = async () => {
    const first = form.first.trim();
    const last = form.last.trim();
    const phone = form.phone.trim();

    if (!first) {
      showToast.error('First name is required.');
      return;
    }

    setSaving(true);
    try {
      const result = await updateProfile({
        first_name: first,
        last_name: last,
        phone,
      });

      if (!result.success) {
        showToast.error(result.error || 'Failed to update profile.');
        return;
      }

      const updated = result.data ?? {};
      setProfile((prev) => ({
        ...prev,
        first_name: updated.first_name ?? first,
        last_name: updated.last_name ?? last,
        phone: updated.phone ?? phone,
        full_name:
          updated.full_name ?? `${first}${last ? ` ${last}` : ''}`.trim(),
      }));
      setIsEditing(false);
      showToast.success('Profile updated.');
      router.refresh();
    } catch {
      showToast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCreatorCode = async () => {
    try {
      await navigator.clipboard.writeText(creatorCode);
      setCopiedCreatorCode(true);
      setTimeout(() => {
        setCopiedCreatorCode(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleAvatarButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    // Reset the input so selecting the same file again still fires onChange.
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast.error('Please select an image file.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast.error('Image must be 8MB or smaller.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Single auth-only call: uploads to Cloudflare Images AND saves the avatar.
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json().catch(() => null);
      const url: string | undefined = json?.avatar ?? json?.data?.avatar;

      if (!res.ok || !json?.success || !url) {
        showToast.error(json?.error || 'Upload failed. Please try again.');
        return;
      }

      setProfile((prev) => ({ ...prev, avatar: url }));
      showToast.success('Profile picture updated.');
      router.refresh();
    } catch {
      showToast.error('Failed to update profile picture. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const fullName = profile?.full_name || 'Not set';
  const avatarSrc =
    profile?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      (profile?.full_name || 'U')[0],
    )}&background=F5F5F5&color=000000`;

  // Dynamic profile details using dashboard data. Only fields the backend
  // actually stores on the user are shown (no perpetually-empty Gender/Address).
  const profileDetails = [
    { label: 'Full Name', value: fullName, truncate: false },
    { label: 'Mobile Number', value: profile?.phone || 'Not set', truncate: false },
    { label: 'Email', value: profile?.email || 'Not set', truncate: true },
  ];

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#F4F1EA]">
      <CreatorNav balance={currentBalance} />
      <div className="page-shell flex flex-col gap-[20px] px-[16px] pt-[28px] pb-[121px] md:px-0">
        <div
          className="flex w-fit items-center gap-x-2 text-[#B7B2A6] transition-colors hover:cursor-pointer hover:text-[#F4F1EA]"
          onClick={() => router.back()}
        >
          <span style={INVERT_ICON}>
            <ArrowLeftIcon />
          </span>{' '}
          <span className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
            My profile
          </span>
        </div>
        <div className="space-y-[26px] rounded-[16px] bg-[#121214] p-[22px]">
          <div className="relative mx-auto mb-[36px] size-[64px] overflow-hidden rounded-full border border-[#3A3A3D] md:mx-0">
            <img
              src={avatarSrc}
              alt="Profile picture"
              className="h-full w-full object-cover"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarSelected}
            />
            <div className="absolute bottom-0 flex h-1/2 w-full items-center justify-center bg-[#F4F1EA]/90">
              <button
                type="button"
                title="Change profile picture"
                aria-label="Change profile picture"
                onClick={handleAvatarButtonClick}
                disabled={uploadingAvatar}
                className="flex h-full w-full cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingAvatar ? (
                  <span className="text-[10px] font-medium text-[#0E0E10]">
                    …
                  </span>
                ) : (
                  <CameraIcon />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-medium tracking-[0.14em] text-[#9F9A8E] uppercase">
              Creator Code
            </div>
            <div className="flex items-center gap-x-[10px]">
              <div className="text-[15px] font-medium tracking-widest text-[#F4F1EA] uppercase">
                {creatorCode}
              </div>
              <button
                type="button"
                className="flex cursor-pointer items-center gap-x-1 opacity-70 transition-opacity hover:opacity-100"
                onClick={handleCopyCreatorCode}
                title="Copy creator code"
                aria-label="Copy creator code"
              >
                {copiedCreatorCode ? (
                  <span className="text-[11px] font-medium tracking-[0.14em] text-[#C4AA6E] uppercase">
                    Copied!
                  </span>
                ) : (
                  <CopyIcon />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-medium tracking-[0.14em] text-[#9F9A8E] uppercase">
              Account Tier
            </div>
            <div className="flex items-center gap-x-[8px]">
              {/* Same display-serif treatment as the dashboard card, so the
                  tier reads as the same thing in both places. */}
              <div className="text-[21px] font-medium text-[#C4AA6E]" style={luxe}>
                {tier?.name || 'No Tier'}
              </div>
              <div>
                <ArrowProfileRightIcon />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-[24px] rounded-[16px] bg-[#121214] p-[22px]">
          <div className="flex items-center justify-between gap-3">
            <div
              className="text-[26px] leading-tight font-medium tracking-tight text-[#F4F1EA]"
              style={luxe}
            >
              Personal details
            </div>
            {!isEditing ? (
              <button
                type="button"
                onClick={startEditing}
                className="flex shrink-0 cursor-pointer items-center gap-x-1.5 rounded-full border border-[#3A3A3D] px-[16px] py-[8px] text-[13px] font-medium text-[#D8D3C7] transition-colors hover:border-[#C4AA6E] hover:text-[#F4F1EA]"
              >
                <AdminEditIcon color="#D8D3C7" /> Edit profile
              </button>
            ) : (
              <div className="flex shrink-0 items-center gap-x-2">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="flex cursor-pointer items-center gap-x-1.5 rounded-full border border-[#3A3A3D] px-[16px] py-[8px] text-[13px] font-medium text-[#9F9A8E] transition-colors hover:border-[#C4AA6E] hover:text-[#F4F1EA] disabled:opacity-40"
                >
                  <span style={INVERT_ICON}>
                    <CloseIcon />
                  </span>{' '}
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex cursor-pointer items-center gap-x-1.5 rounded-full bg-[#F4F1EA] px-[20px] py-[8px] text-[13px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span style={NEUTRALISE_ICON}>
                    <AdminSuccessCheckIcon />
                  </span>{' '}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-[16px]">
              <label className="block">
                <span className="mb-2 block text-[12px] font-medium tracking-[0.14em] text-[#9F9A8E] uppercase">
                  First name
                </span>
                <input
                  type="text"
                  value={form.first}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, first: e.target.value }))
                  }
                  placeholder="First name"
                  className="w-full appearance-none rounded-[10px] border border-[#2A2A2D] bg-[#121214] px-4 py-3 text-[14px] text-[#F4F1EA] outline-none transition-colors placeholder-[#5C584F] focus:border-[#C4AA6E] focus:ring-0"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[12px] font-medium tracking-[0.14em] text-[#9F9A8E] uppercase">
                  Last name
                </span>
                <input
                  type="text"
                  value={form.last}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, last: e.target.value }))
                  }
                  placeholder="Last name"
                  className="w-full appearance-none rounded-[10px] border border-[#2A2A2D] bg-[#121214] px-4 py-3 text-[14px] text-[#F4F1EA] outline-none transition-colors placeholder-[#5C584F] focus:border-[#C4AA6E] focus:ring-0"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[12px] font-medium tracking-[0.14em] text-[#9F9A8E] uppercase">
                  Mobile number
                </span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="Mobile number"
                  className="w-full appearance-none rounded-[10px] border border-[#2A2A2D] bg-[#121214] px-4 py-3 text-[14px] text-[#F4F1EA] outline-none transition-colors placeholder-[#5C584F] focus:border-[#C4AA6E] focus:ring-0"
                />
              </label>
            </div>
          ) : (
            /* Panel the container, divide the rows. */
            <div className="divide-y divide-[#1C1C1F]">
              {profileDetails.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-[16px] first:pt-0"
                >
                  <div className="w-[40%] text-[12px] font-medium tracking-[0.14em] text-[#9F9A8E] uppercase">
                    {item.label}
                  </div>
                  <div className="flex w-[60%] items-center justify-end gap-x-[8px] text-[15px] text-[#F4F1EA]">
                    <div className={item.truncate ? 'truncate' : ''}>
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[16px] bg-[#121214] p-[22px]">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-medium tracking-[0.14em] text-[#9F9A8E] uppercase">
              Withdrawal Bank
            </div>
            <div className="flex items-center gap-x-[8px]">
              <div className="text-right">
                <div className="text-[15px] font-medium text-[#F4F1EA]">
                  {withdrawalBank?.bank_name || 'Not set'}
                </div>
                <div className="text-[13px] text-[#9F9A8E] tabular-nums">
                  {withdrawalBank?.account_number || 'N/A'}
                </div>
              </div>
              <div>
                <ArrowProfileRightIcon />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
