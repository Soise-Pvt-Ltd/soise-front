'use client';

import { useEffect, useRef, useState } from 'react';
import GridContainer from '../gridContainer';
import { showToast } from '../toast';
import {
  getHomepageContent,
  saveHomepageContent,
  type HomepageImages,
  type HomepageSlot,
  type HomepageTexts,
  type HomepageTextSlot,
} from './actions';

interface SlotDef {
  key: HomepageSlot;
  label: string;
  caption: string;
  fallback: string;
  // 'wide' previews render 16:9-ish; 'tall' previews render portrait gallery tiles.
  shape: 'wide' | 'tall' | 'logo';
}

interface TextSlotDef {
  key: HomepageTextSlot;
  label: string;
  caption: string;
  fallback: string;
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

const TEXT_SLOTS: TextSlotDef[] = [
  {
    key: 'hero_headline',
    label: 'Hero headline',
    caption: 'Large tagline at the bottom left of the hero banner.',
    fallback: 'Wear the culture',
  },
  {
    key: 'hero_subheadline',
    label: 'Hero sub-headline',
    caption: 'Second line below the hero headline.',
    fallback: 'New Collection Available',
  },
  {
    key: 'mens_tops_title',
    label: "Men's Tops heading",
    caption: 'Title shown over the Men’s Tops section background.',
    fallback: 'Men\'s Tops',
  },
  {
    key: 'mens_tops_cta',
    label: "Men's Tops CTA text",
    caption: 'Link text at the bottom of the Men’s Tops section.',
    fallback: 'Explore Collection',
  },
];

const SLOT_KEYS = SLOTS.map((s) => s.key);
const TEXT_SLOT_KEYS = TEXT_SLOTS.map((s) => s.key);

function normalizeImages(images: HomepageImages): HomepageImages {
  const next: HomepageImages = {};
  for (const key of SLOT_KEYS) {
    next[key] = images[key] ?? null;
  }
  return next;
}

function normalizeTexts(texts: HomepageTexts): HomepageTexts {
  const next: HomepageTexts = {};
  for (const key of TEXT_SLOT_KEYS) {
    next[key] = texts[key] ?? null;
  }
  return next;
}

export default function HomeContentClient() {
  const [images, setImages] = useState<HomepageImages>(normalizeImages({}));
  const [texts, setTexts] = useState<HomepageTexts>(normalizeTexts({}));
  const [initialImages, setInitialImages] = useState<HomepageImages>(normalizeImages({}));
  const [initialTexts, setInitialTexts] = useState<HomepageTexts>(normalizeTexts({}));
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
      const normImages = normalizeImages(res.images);
      const normTexts = normalizeTexts(res.texts);
      setImages(normImages);
      setInitialImages(normImages);
      setTexts(normTexts);
      setInitialTexts(normTexts);
    } else {
      setLoadError(res.error || 'Failed to load homepage content');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const imagesDirty = SLOT_KEYS.some(
    (k) => (images[k] ?? null) !== (initialImages[k] ?? null),
  );
  const textsDirty = TEXT_SLOT_KEYS.some(
    (k) => (texts[k] ?? null) !== (initialTexts[k] ?? null),
  );
  const dirty = imagesDirty || textsDirty;

  const persist = async (
    nextImages: HomepageImages,
    nextTexts: HomepageTexts,
    okMsg: string,
  ): Promise<boolean> => {
    setSaving(true);
    const res = await saveHomepageContent(nextImages, nextTexts);
    setSaving(false);
    if (res.success) {
      setImages(normalizeImages(nextImages));
      setInitialImages(normalizeImages(nextImages));
      setTexts(normalizeTexts(nextTexts));
      setInitialTexts(normalizeTexts(nextTexts));
      showToast('success', okMsg);
      return true;
    }
    showToast('error', res.error || 'Failed to save changes.');
    return false;
  };

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
        // Auto-persist immediately — no separate "Save" step to forget.
        await persist(
          { ...images, [slot]: url },
          texts,
          'Image updated and live on the homepage.',
        );
      } else {
        showToast('error', json?.error || 'Upload failed. Please try again.');
      }
    } catch {
      showToast('error', 'Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleReset = async (slot: HomepageSlot) => {
    await persist({ ...images, [slot]: null }, texts, 'Reset to the default image.');
  };

  const handleSave = async () => {
    await persist(images, texts, 'Homepage content saved.');
  };

  if (loading) {
    return (
      <GridContainer>
        <div className="px-2 pb-10">
          <div className="h-6 w-1/3 animate-pulse rounded bg-[#EEE]" />
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
        </div>
      </GridContainer>
    );
  }

  if (loadError) {
    return (
      <GridContainer>
        <div className="px-2 pb-10">
          <div className="rounded-[16px] border border-[#E5C6BF] bg-[#FBEDE9] p-6 text-center">
            <p className="text-[14px] text-[#991C00]">{loadError}</p>
            <button
              onClick={load}
              className="mt-3 rounded-[10px] bg-[#991C00] px-4 py-2 text-[13px] font-medium text-white"
            >
              Try again
            </button>
          </div>
        </div>
      </GridContainer>
    );
  }

  return (
    <GridContainer>
      <div className="px-2 pb-10">
        <div className="flex flex-col gap-1 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#121212]">
              Appearance · Home Page
            </h1>
            <p className="mt-1 max-w-2xl text-[14px] text-[#8E8E93]">
              Swap the imagery and copy used across the public homepage. Leave a
              slot on its default to keep the bundled design. Changes go live after
              you save.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
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

        {/* Images */}
        <section className="mt-8">
          <h2 className="text-[16px] font-semibold text-[#121212]">Images</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
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
        </section>

        {/* Text */}
        <section className="mt-10">
          <h2 className="text-[16px] font-semibold text-[#121212]">Text</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            {TEXT_SLOTS.map((slot) => {
              const value = texts[slot.key] ?? '';
              const fallback = slot.fallback;
              return (
                <div
                  key={slot.key}
                  className="rounded-[16px] border border-[#F0F0F0] bg-white p-5"
                >
                  <label
                    htmlFor={slot.key}
                    className="block text-[15px] font-semibold text-[#121212]"
                  >
                    {slot.label}
                  </label>
                  <p className="mb-3 mt-1 text-[12px] leading-relaxed text-[#8E8E93]">
                    {slot.caption} Default: “{fallback}”
                  </p>
                  <input
                    id={slot.key}
                    type="text"
                    value={value}
                    placeholder={fallback}
                    onChange={(e) => setTexts({ ...texts, [slot.key]: e.target.value })}
                    className="h-[48px] w-full rounded-[12px] border border-[#E5E5E5] px-4 text-[14px] text-[#121212] outline-none transition-colors duration-150 placeholder:text-[#AEAEB2] focus:border-[#0072BB]"
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </GridContainer>
  );
}
