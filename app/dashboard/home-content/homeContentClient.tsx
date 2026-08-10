'use client';

import { useEffect, useRef, useState } from 'react';
import GridContainer from '../gridContainer';
import { PageHeader } from '../ui';
import { showToast } from '../toast';
import {
  getCollections,
  getHomepageContent,
  saveHomepageContent,
  type CollectionOption,
  type HomepageImages,
  type HomepageSlot,
  type HomepageTexts,
  type HomepageTextSlot,
} from './actions';
import { compressImage } from '@/lib/image-compress';

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
    label: 'Featured collection background',
    caption: 'Background image behind the featured collection band. Recommended 1600×600 (landscape). Falls back to the collection banner.',
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
    label: 'Featured collection title override',
    caption: 'Title shown over the featured collection band. Leave empty to use the collection name.',
    fallback: "Men's Tops",
  },
  {
    key: 'mens_tops_cta',
    label: 'Featured collection CTA text',
    caption: 'Link text at the bottom of the featured collection band.',
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
  const [featuredCollectionId, setFeaturedCollectionId] = useState<string | null>(null);
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [initialImages, setInitialImages] = useState<HomepageImages>(normalizeImages({}));
  const [initialTexts, setInitialTexts] = useState<HomepageTexts>(normalizeTexts({}));
  const [initialFeaturedCollectionId, setInitialFeaturedCollectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<HomepageSlot | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    const [contentRes, collectionsRes] = await Promise.all([
      getHomepageContent(),
      getCollections(),
    ]);
    if (contentRes.success) {
      const normImages = normalizeImages(contentRes.images);
      const normTexts = normalizeTexts(contentRes.texts);
      const normFeatured = contentRes.featuredCollectionId || null;
      setImages(normImages);
      setInitialImages(normImages);
      setTexts(normTexts);
      setInitialTexts(normTexts);
      setFeaturedCollectionId(normFeatured);
      setInitialFeaturedCollectionId(normFeatured);
    } else {
      setLoadError(contentRes.error || 'Failed to load homepage content');
    }
    if (collectionsRes.success) {
      setCollections(collectionsRes.collections);
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
  const featuredDirty =
    (featuredCollectionId ?? null) !== (initialFeaturedCollectionId ?? null);
  const dirty = imagesDirty || textsDirty || featuredDirty;

  const persist = async (
    nextImages: HomepageImages,
    nextTexts: HomepageTexts,
    nextFeatured: string | null,
    okMsg: string,
  ): Promise<boolean> => {
    setSaving(true);
    const res = await saveHomepageContent(
      nextImages,
      nextTexts,
      nextFeatured ?? '',
    );
    setSaving(false);
    if (res.success) {
      setImages(normalizeImages(nextImages));
      setInitialImages(normalizeImages(nextImages));
      setTexts(normalizeTexts(nextTexts));
      setInitialTexts(normalizeTexts(nextTexts));
      setFeaturedCollectionId(nextFeatured ?? null);
      setInitialFeaturedCollectionId(nextFeatured ?? null);
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
      // Every slot compresses now. The explore_collection exemption existed
      // only because compressImage flattened alpha to JPEG; it encodes WebP for
      // alpha-capable sources, so the transparent slots are safe and large
      // uploads in every slot get shrunk below the server's size limit.
      const uploadFile = await compressImage(file);
      const formData = new FormData();
      formData.append('file', uploadFile);
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
          featuredCollectionId,
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
    await persist(
      { ...images, [slot]: null },
      texts,
      featuredCollectionId,
      'Reset to the default image.',
    );
  };

  const handleSave = async () => {
    await persist(images, texts, featuredCollectionId, 'Homepage content saved.');
  };

  if (loading) {
    return (
      <GridContainer>
        <div className="px-2 pb-10">
          <div className="h-6 w-1/3 animate-pulse rounded bg-[#E2DBCC]" />
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {SLOTS.map((slot) => (
              <div
                key={slot.key}
                className="animate-pulse rounded-[14px] border border-[#E2DBCC] p-5"
              >
                <div className="mb-3 h-4 w-1/2 rounded bg-[#E2DBCC]" />
                <div className="h-40 w-full rounded-[12px] bg-[#E2DBCC]" />
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
          <div className="rounded-[14px] border border-[#F2E1DB] bg-[#F2E1DB] p-6 text-center">
            <p className="text-[14px] text-[#8C3A2B]">{loadError}</p>
            <button
              onClick={load}
              className="mt-3 rounded-full bg-[#8C3A2B] px-4 py-2 text-[13px] font-medium text-[#F4F1EA]"
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
      <div className="pb-10">
        <PageHeader
          eyebrow="The house"
          title="Appearance · Home page"
          description="Swap the imagery and copy used across the public homepage. Leave a slot on its default to keep the bundled design. Changes go live after you save."
          actions={
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="ad-btn-primary"
            >
              {saving && (
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#F4F1EA]/30 border-t-[#F4F1EA]"
                  aria-hidden="true"
                />
              )}
              {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
            </button>
          }
        />

        {/* Images */}
        <section>
          <h2 className="ad-display text-[19px] text-[#14110E]">Images</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {SLOTS.map((slot) => {
              const current = images[slot.key];
              const preview = current || slot.fallback;
              const isUploading = uploading === slot.key;
              const isCustom = Boolean(current);
              return (
                <div
                  key={slot.key}
                  className="flex flex-col rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-5 transition-shadow duration-150 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-[15px] font-semibold text-[#14110E]">
                        {slot.label}
                      </h2>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        isCustom
                          ? 'bg-[#EAE4D7] text-[#9C6F2E]'
                          : 'bg-[#EFEBE1] text-[#5C544A]'
                      }`}
                    >
                      {isCustom ? 'Custom' : 'Default'}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#5C544A]">
                    {slot.caption}
                  </p>

                  <div
                    className={`relative mt-3 w-full overflow-hidden rounded-[12px] border border-[#E2DBCC] ${
                      slot.shape === 'tall'
                        ? 'aspect-[3/4]'
                        : // The logo slot only keeps its dark, letterboxed look
                          // for the bundled default; a custom upload fills the
                          // panel edge-to-edge just like it does on the site.
                          slot.shape === 'logo' && !isCustom
                          ? 'aspect-video bg-[#14110E]'
                          : 'aspect-video bg-[#EFEBE1]'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt={`${slot.label} preview`}
                      className={`h-full w-full ${
                        slot.shape === 'logo' && !isCustom
                          ? 'object-contain p-6'
                          : 'object-cover'
                      }`}
                    />
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0E0E10]/55">
                        <span
                          className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#F4F1EA]/40 border-t-white"
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
                      className="inline-flex h-[40px] flex-1 items-center justify-center gap-2 rounded-full bg-[#14110E] px-4 text-[13px] font-medium text-[#F4F1EA] transition-colors duration-150 hover:bg-[#241F19] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUploading ? 'Uploading…' : 'Upload image'}
                    </button>
                    <button
                      onClick={() => handleReset(slot.key)}
                      disabled={!isCustom || isUploading || saving}
                      className="inline-flex h-[40px] items-center justify-center rounded-[10px] border border-[#DFD7C6] px-4 text-[13px] font-medium text-[#14110E] transition-colors duration-150 hover:bg-[#EFEBE1] disabled:cursor-not-allowed disabled:opacity-40"
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

        {/* Featured Collection */}
        <section className="mt-10">
          <h2 className="ad-display text-[19px] text-[#14110E]">
            Featured Collection
          </h2>
          <div className="mt-4 rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-5">
            <label
              htmlFor="featured_collection_id"
              className="block text-[15px] font-semibold text-[#14110E]"
            >
              Collection to spotlight on the homepage
            </label>
            <p className="mb-3 mt-1 text-[12px] leading-relaxed text-[#5C544A]">
              Replaces the Men’s Tops band with this collection’s name, banner,
              and Explore Collection link. Leave empty to fall back to the
              default image and text.
            </p>
            <select
              id="featured_collection_id"
              value={featuredCollectionId ?? ''}
              onChange={async (e) => {
                const next = e.target.value || null;
                setFeaturedCollectionId(next);
                setSaving(true);
                const res = await saveHomepageContent(
                  initialImages,
                  initialTexts,
                  next || '',
                );
                setSaving(false);
                if (res.success) {
                  setInitialFeaturedCollectionId(next);
                  showToast('success', 'Featured collection updated.');
                } else {
                  setFeaturedCollectionId(initialFeaturedCollectionId);
                  showToast(
                    'error',
                    res.error || 'Failed to update featured collection.',
                  );
                }
              }}
              className="h-[48px] w-full rounded-[12px] border border-[#DFD7C6] bg-[#FBF9F4] px-4 text-[14px] text-[#14110E] outline-none transition-colors duration-150 focus:border-[#9C6F2E]"
            >
              <option value="">None selected</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Text */}
        <section className="mt-10">
          <h2 className="ad-display text-[19px] text-[#14110E]">Text</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            {TEXT_SLOTS.map((slot) => {
              const value = texts[slot.key] ?? '';
              const fallback = slot.fallback;
              return (
                <div
                  key={slot.key}
                  className="rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-5"
                >
                  <label
                    htmlFor={slot.key}
                    className="block text-[15px] font-semibold text-[#14110E]"
                  >
                    {slot.label}
                  </label>
                  <p className="mb-3 mt-1 text-[12px] leading-relaxed text-[#5C544A]">
                    {slot.caption} Default: “{fallback}”
                  </p>
                  <input
                    id={slot.key}
                    type="text"
                    value={value}
                    placeholder={fallback}
                    onChange={(e) => setTexts({ ...texts, [slot.key]: e.target.value })}
                    className="h-[48px] w-full rounded-[12px] border border-[#DFD7C6] px-4 text-[14px] text-[#14110E] outline-none transition-colors duration-150 placeholder:text-[#8C8377] focus:border-[#9C6F2E]"
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
