'use client';

import { useEffect, useRef, useState } from 'react';
import GridContainer from '../gridContainer';
import { showToast } from '../toast';
import {
  getHomepageContent,
  saveHomepageContent,
  type HomepageImages,
  type HomepageSlot,
} from './actions';

interface SlotDef {
  key: HomepageSlot;
  label: string;
  caption: string;
  fallback: string;
  // 'wide' previews render 16:9-ish; 'tall' previews render portrait gallery tiles.
  shape: 'wide' | 'tall' | 'logo';
}

const SLOTS: SlotDef[] = [
  {
    key: 'hero',
    label: 'Hero background',
    caption: 'Full-width banner at the very top of the homepage. Recommended 1600×900 (landscape).',
    fallback: '/hero.jpg',
    shape: 'wide',
  },
  {
    key: 'mens_top',
    label: "Men's Tops section background",
    caption: 'Background image behind the "Men’s Tops" band. Recommended 1600×600 (landscape).',
    fallback: '/mens-top.jpg',
    shape: 'wide',
  },
  {
    key: 'explore_collection',
    label: 'Explore Collection graphic',
    caption: 'Centered logo/graphic on the dark "Explore Collection" panel. Recommended transparent PNG, ~422×226.',
    fallback: '/explore-collection.png',
    shape: 'logo',
  },
  {
    key: 'gallery_1',
    label: 'Gallery image 1',
    caption: 'First tile in the 3-up image gallery. Recommended portrait, ~680×928.',
    fallback: '/before-explore-collection-1.png',
    shape: 'tall',
  },
  {
    key: 'gallery_2',
    label: 'Gallery image 2',
    caption: 'Second tile in the 3-up image gallery. Recommended portrait, ~680×928.',
    fallback: '/before-explore-collection-2.png',
    shape: 'tall',
  },
  {
    key: 'gallery_3',
    label: 'Gallery image 3',
    caption: 'Third tile in the 3-up image gallery. Recommended portrait, ~680×928.',
    fallback: '/before-explore-collection-3.png',
    shape: 'tall',
  },
];

const SLOT_KEYS = SLOTS.map((s) => s.key);

function normalize(images: HomepageImages): HomepageImages {
  const next: HomepageImages = {};
  for (const key of SLOT_KEYS) {
    next[key] = images[key] ?? null;
  }
  return next;
}

export default function HomeContentClient() {
  const [images, setImages] = useState<HomepageImages>(normalize({}));
  const [initial, setInitial] = useState<HomepageImages>(normalize({}));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<HomepageSlot | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    const res = await getHomepageContent();
    if (res.success) {
      const norm = normalize(res.images);
      setImages(norm);
      setInitial(norm);
    } else {
      setLoadError(res.error || 'Failed to load homepage content');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = SLOT_KEYS.some(
    (k) => (images[k] ?? null) !== (initial[k] ?? null),
  );

  const handleUpload = async (slot: HomepageSlot, file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select an image file.');
      return;
    }
    setUploading(slot);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      // Upload route returns the backend media payload: { success, data: { id, url, ... } }
      const url: string | undefined = json?.data?.url ?? json?.url;
      if (res.ok && url) {
        setImages((prev) => ({ ...prev, [slot]: url }));
        showToast('success', 'Image uploaded. Remember to save your changes.');
      } else {
        showToast('error', json?.error || 'Upload failed. Please try again.');
      }
    } catch {
      showToast('error', 'Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleReset = (slot: HomepageSlot) => {
    setImages((prev) => ({ ...prev, [slot]: null }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await saveHomepageContent(images);
    setSaving(false);
    if (res.success) {
      setInitial(normalize(images));
      showToast('success', 'Homepage images saved.');
    } else {
      showToast('error', res.error || 'Failed to save changes.');
    }
  };

  return (
    <GridContainer>
      <div className="px-2 pb-10">
        <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#121212]">
              Appearance · Home Page
            </h1>
            <p className="mt-1 max-w-2xl text-[14px] text-[#8E8E93]">
              Swap the imagery used across the public homepage. Leave a slot on its
              default to keep the bundled design. Changes go live after you save.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading || !dirty}
            className="mt-3 inline-flex h-[44px] shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#0072BB] px-6 text-[14px] font-medium text-white transition-colors duration-150 hover:bg-[#005a96] disabled:cursor-not-allowed disabled:opacity-50 lg:mt-0"
          >
            {saving && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
            )}
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </button>
        </div>

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {SLOTS.map((slot) => (
              <div
                key={slot.key}
                className="animate-pulse rounded-[16px] border border-[#F0F0F0] p-5"
              >
                <div className="mb-3 h-4 w-1/2 rounded bg-[#EEE]" />
                <div className="h-40 w-full rounded-[12px] bg-[#EEE]" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="mt-6 rounded-[16px] border border-[#E5C6BF] bg-[#FBEDE9] p-6 text-center">
            <p className="text-[14px] text-[#991C00]">{loadError}</p>
            <button
              onClick={load}
              className="mt-3 rounded-[10px] bg-[#991C00] px-4 py-2 text-[13px] font-medium text-white"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {SLOTS.map((slot) => {
              const current = images[slot.key];
              const preview = current || slot.fallback;
              const isUploading = uploading === slot.key;
              const isCustom = Boolean(current);
              return (
                <div
                  key={slot.key}
                  className="flex flex-col rounded-[16px] border border-[#F0F0F0] bg-white p-5 transition-shadow duration-150 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-[15px] font-semibold text-[#121212]">
                        {slot.label}
                      </h2>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        isCustom
                          ? 'bg-[#C0CBF2] text-[#0072BB]'
                          : 'bg-[#F5F5F5] text-[#8E8E93]'
                      }`}
                    >
                      {isCustom ? 'Custom' : 'Default'}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#8E8E93]">
                    {slot.caption}
                  </p>

                  <div
                    className={`relative mt-3 w-full overflow-hidden rounded-[12px] border border-[#F0F0F0] ${
                      slot.shape === 'tall'
                        ? 'aspect-[3/4]'
                        : slot.shape === 'logo'
                          ? 'aspect-video bg-[#040000]'
                          : 'aspect-video bg-[#F5F5F5]'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt={`${slot.label} preview`}
                      className={`h-full w-full ${
                        slot.shape === 'logo' ? 'object-contain p-6' : 'object-cover'
                      }`}
                    />
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span
                          className="h-7 w-7 animate-spin rounded-full border-[3px] border-white/40 border-t-white"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                  </div>

                  <input
                    ref={(el) => {
                      fileInputs.current[slot.key] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(slot.key, file);
                      e.target.value = '';
                    }}
                  />

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => fileInputs.current[slot.key]?.click()}
                      disabled={isUploading || saving}
                      className="inline-flex h-[40px] flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#0072BB] px-4 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#005a96] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUploading ? 'Uploading…' : 'Upload image'}
                    </button>
                    <button
                      onClick={() => handleReset(slot.key)}
                      disabled={!isCustom || isUploading || saving}
                      className="inline-flex h-[40px] items-center justify-center rounded-[10px] border border-[#E5E5E5] px-4 text-[13px] font-medium text-[#121212] transition-colors duration-150 hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40"
                      title="Reset this slot to the bundled default image"
                    >
                      Reset to default
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GridContainer>
  );
}
