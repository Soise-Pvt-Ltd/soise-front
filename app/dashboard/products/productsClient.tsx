'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import GridContainer from '../gridContainer';
import { PageHeader } from '../ui';
import RowActionMenu from '@/components/admin/RowActionMenu';
import { useDropzone } from 'react-dropzone';
import {
  ArrowLeftIcon,
  AdminUploadIcon,
  AdminSoundLevelsIcon,
  AdminPlusCircleIcon,
  CloseIconTags,
  AdminMoreVerticalIcon,
  AdminSearchIcon,
  AdminEditIcon,
  AdminExclamationIcon,
} from '@/components/icons';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  createCollection,
  updateCollection,
  deleteCollection,
  deleteVariant,
} from './actions';
import { showToast } from '../toast';
import { totalRows } from '@/lib/pagination';
import {
  COLOR_PRESETS,
  COLOR_FINISHES,
  type ColorFinish,
  isValidHex,
  guessHexFromName,
  finishSwatchStyle,
} from '@/lib/color-palette';

const MATERIALS = [
  'cotton',
  'polyester',
  'wool',
  'silk',
  'linen',
  'denim',
  'leather',
];
const FIT_TYPES = ['regular', 'slim', 'relaxed', 'oversized'];
const SEASON = ['spring', 'summer', 'fall'];

interface MyFile extends File {
  preview: string;
}

// A variant's media gallery, unified into one orderable list so existing
// photos and newly-added ones can be freely reordered together and the
// exact order is what gets persisted (via reorder_variant_media).
interface VariantMediaItem {
  key: string; // stable React key
  kind: 'existing' | 'new';
  id?: string; // set when kind === 'existing'
  url: string; // display url (server url, or a blob preview for 'new')
  file?: MyFile; // set when kind === 'new'
}

const MAX_VARIANT_MEDIA = 6;

interface VariantData {
  id: string;
  media: VariantMediaItem[];
  selectedSizes: string[];
  colors: string[];
  colorHex: string;
  finish: ColorFinish;
  price: number | string;
  stock: number | string;
}

// Updated uploadFile function to use API route
async function uploadFile(formData: FormData) {
  try {
    const response = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      return await response.json();
    }
    return { success: false, error: 'Upload failed' };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Upload error' };
  }
}

// Small inline spinner reused for save / loading affordances.
function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden="true"
    />
  );
}

// Low-stock threshold: any in-stock product at or below this is flagged.
const LOW_STOCK_THRESHOLD = 5;

async function deleteFile(mediaId: string) {
  try {
    const response = await fetch('/api/media/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mediaId }),
    });

    if (response.ok) {
      return await response.json();
    }
    return { success: false, error: 'Delete failed' };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: 'Delete error' };
  }
}

function VariantItem({
  variant,
  index,
  onUpdate,
  onRemove,
  canRemove,
  errors,
}: {
  variant: VariantData;
  index: number;
  onUpdate: (id: string, field: keyof VariantData, value: any) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  errors?: { size?: string; color?: string; stock?: string };
}) {
  const [colorInput, setColorInput] = useState('');
  const SIZES = ['s', 'm', 'l', 'xl', '2xl'];

  const inputRef = useRef<HTMLInputElement>(null);
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const remainingSlots = MAX_VARIANT_MEDIA - variant.media.length;

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    multiple: true,
    disabled: remainingSlots <= 0,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      const toAdd = acceptedFiles.slice(0, remainingSlots);
      if (toAdd.length < acceptedFiles.length) {
        showToast(
          'error',
          `Only added ${toAdd.length} of ${acceptedFiles.length} - a variant can have at most ${MAX_VARIANT_MEDIA} photos.`,
        );
      }
      const newItems: VariantMediaItem[] = toAdd.map((file) => {
        const withPreview = Object.assign(file, {
          preview: URL.createObjectURL(file),
        }) as MyFile;
        return {
          key: `new-${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          kind: 'new',
          url: withPreview.preview,
          file: withPreview,
        };
      });
      onUpdate(variant.id, 'media', [...variant.media, ...newItems]);
    },
  });

  const removeMediaItem = (key: string) => {
    onUpdate(
      variant.id,
      'media',
      variant.media.filter((m) => m.key !== key),
    );
  };

  const reorderMedia = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const next = [...variant.media];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onUpdate(variant.id, 'media', next);
  };

  useEffect(() => {
    return () =>
      variant.media.forEach((m) => {
        if (m.kind === 'new' && m.file) URL.revokeObjectURL(m.file.preview);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSizeClick = (size: string) => {
    const newSizes = variant.selectedSizes.includes(size) ? [] : [size];
    onUpdate(variant.id, 'selectedSizes', newSizes);
  };

  const handleColorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newColor = colorInput.trim();
      if (newColor) {
        onUpdate(variant.id, 'colors', [newColor]);
        // If the typed name matches a preset and no exact hex has been
        // picked yet, auto-fill it so the swatch renders immediately
        // instead of falling back to a guess (or nothing).
        if (!variant.colorHex) {
          const preset = COLOR_PRESETS.find(
            (p) => p.name.toLowerCase() === newColor.toLowerCase(),
          );
          if (preset) {
            onUpdate(variant.id, 'colorHex', preset.hex);
            onUpdate(variant.id, 'finish', preset.finish);
          }
        }
        setColorInput('');
      }
    } else if (
      e.key === 'Backspace' &&
      colorInput === '' &&
      variant.colors.length > 0
    ) {
      onUpdate(variant.id, 'colors', []);
      onUpdate(variant.id, 'colorHex', '');
      onUpdate(variant.id, 'finish', 'standard');
    }
  };

  const removeColor = () => {
    onUpdate(variant.id, 'colors', []);
    onUpdate(variant.id, 'colorHex', '');
    onUpdate(variant.id, 'finish', 'standard');
  };

  return (
    <div className="rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-[24px] text-[#14110E] md:col-span-3">
      <div className="rounded-[10px]">
        <div className="flex items-center justify-between pb-[24px]">
          <div>
            <span>Variant {index + 1}</span>
          </div>
          {canRemove && (
            <button
              onClick={() => onRemove(variant.id)}
              className="cursor-pointer"
            >
              <CloseIconTags />
            </button>
          )}
        </div>
        <div className="gid-cols-1 grid gap-[16px] md:grid-cols-2">
          <div>
            <div {...getRootProps({ className: 'dropzone h-full' })}>
              <div className="flex h-full cursor-pointer flex-col items-center justify-center rounded-[10px] border-1 border-dashed border-[#DFD7C6] bg-[#EFEBE1] p-6 text-center">
                <input {...getInputProps()} />
                {variant.media.length > 0 && (
                  <div className="mb-4 flex flex-wrap justify-center gap-2">
                    {variant.media.map((m, i) => (
                      <div
                        key={m.key}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          dragIndexRef.current = i;
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverIndex(i);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (dragIndexRef.current !== null) {
                            reorderMedia(dragIndexRef.current, i);
                          }
                          dragIndexRef.current = null;
                          setDragOverIndex(null);
                        }}
                        onDragEnd={(e) => {
                          e.stopPropagation();
                          dragIndexRef.current = null;
                          setDragOverIndex(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`group relative inline-flex h-24 w-24 cursor-grab rounded border p-1 active:cursor-grabbing ${
                          dragOverIndex === i
                            ? 'border-[#9C6F2E] border-dashed'
                            : 'border-[#DFD7C6]'
                        }`}
                        title="Drag to reorder"
                      >
                        <div className="flex min-w-0 overflow-hidden rounded-[6px]">
                          <img
                            src={m.url}
                            className="pointer-events-none block h-full w-full object-cover"
                            onLoad={() => {
                              if (m.kind === 'new') URL.revokeObjectURL(m.url);
                            }}
                          />
                        </div>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 rounded bg-[#0E0E10]/65 px-1 text-[9px] font-medium text-[#F4F1EA]">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMediaItem(m.key);
                          }}
                          className="absolute -top-2 -right-2 flex size-5 cursor-pointer items-center justify-center rounded-full bg-[#14110E] text-[#F4F1EA] opacity-0 shadow transition-opacity group-hover:opacity-100"
                          aria-label="Remove photo"
                        >
                          <CloseIconTags />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  disabled={remainingSlots <= 0}
                  className="flex items-center justify-center gap-x-[2.5px] rounded-[10px] border-2 border-[#9C6F2E] bg-[#F3E9D633] p-[10px] text-sm font-semibold text-[#9C6F2E] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <AdminUploadIcon /> Upload Image
                </button>
                <p className="mt-2 text-xs text-[#5C544A]">
                  {variant.media.length}/{MAX_VARIANT_MEDIA} photos
                  {remainingSlots <= 0 ? ' - limit reached' : ''}
                </p>
                {variant.media.length === 0 && (
                  <p className="mt-1 text-xs text-[#5C544A]">
                    No photos yet — the storefront will borrow another
                    variant&apos;s photos until you upload some here.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-[16px]">
            <div>
              <label className="adminsolidlabel">
                Available size (select one)
              </label>
              <div className="mt-[8px] flex items-center gap-x-[24px]">
                {SIZES.map((size) => (
                  <div
                    onClick={() => handleSizeClick(size)}
                    key={size}
                    className={`flex h-[40px] w-[54px] cursor-pointer items-center justify-center rounded-[2px] border text-[11px] uppercase transition-colors ${variant.selectedSizes.includes(size) ? 'border-3 border-[#9C6F2E] bg-[#EFEBE1]' : 'border-[#5C544A] bg-[#EFEBE1]'}`}
                  >
                    {size}
                  </div>
                ))}
              </div>
              {errors?.size && (
                <p className="mt-1 flex items-center gap-x-1 text-[12px] text-[#8C3A2B]">
                  <AdminExclamationIcon /> {errors.size}
                </p>
              )}
            </div>
            <div>
              <label className="adminsolidlabel">Color</label>

              {/* Quick-pick presets - one click sets name + hex + finish */}
              <div className="flex flex-wrap gap-2 pb-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    title={
                      preset.finish === 'standard'
                        ? preset.name
                        : `${preset.name} (${preset.finish})`
                    }
                    onClick={() => {
                      onUpdate(variant.id, 'colors', [preset.name]);
                      onUpdate(variant.id, 'colorHex', preset.hex);
                      onUpdate(variant.id, 'finish', preset.finish);
                    }}
                    className={`size-6 shrink-0 rounded-full transition-all ${
                      variant.colors[0] === preset.name
                        ? 'ring-2 ring-[#9C6F2E] ring-offset-1'
                        : 'ring-1 ring-[#DFD7C6] ring-offset-1'
                    }`}
                    style={finishSwatchStyle(preset.hex, preset.finish)}
                    aria-label={preset.name}
                  />
                ))}
              </div>

              <div
                className={`adminsolid flex flex-wrap items-center gap-x-2 py-2 ${
                  variant.colors.length > 0 ? '!h-auto px-2' : 'px-3'
                }`}
                onClick={() => inputRef.current?.focus()}
              >
                {variant.colors.map((color) => (
                  <div
                    key={color}
                    className="flex items-center gap-[4px] rounded-[6px] bg-[#FBF9F4] p-[7px] text-[11px]"
                  >
                    <div
                      className="size-3 shrink-0 rounded-full"
                      style={finishSwatchStyle(variant.colorHex, variant.finish)}
                    />
                    <span className="text-[#3F3830] capitalize">{color}</span>
                    <button
                      type="button"
                      onClick={() => removeColor()}
                      className="cursor-pointer text-[#8C8377] hover:text-[#14110E]"
                      aria-label={`Remove ${color}`}
                    >
                      <CloseIconTags />
                    </button>
                  </div>
                ))}

                <input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    variant.colors.length === 0
                      ? 'Custom color name, press enter'
                      : ''
                  }
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={handleColorKeyDown}
                  className="min-w-[120px] flex-1 border-none bg-transparent p-0 text-[12px] !outline-none focus:ring-0"
                />
              </div>

              {/* Exact swatch color + finish - covers anything not in the
                  presets above (full RGB spectrum via the native picker). */}
              <div className="mt-2 flex items-center gap-x-3">
                <label className="flex items-center gap-x-2 text-[11px] text-[#5C544A]">
                  Exact color
                  <input
                    type="color"
                    value={isValidHex(variant.colorHex) ? variant.colorHex : '#DFD7C6'}
                    onChange={(e) =>
                      onUpdate(variant.id, 'colorHex', e.target.value)
                    }
                    className="h-6 w-8 cursor-pointer rounded border border-[#DFD7C6] bg-transparent p-0"
                    aria-label="Pick exact swatch color"
                  />
                </label>
                <select
                  value={variant.finish}
                  onChange={(e) =>
                    onUpdate(variant.id, 'finish', e.target.value as ColorFinish)
                  }
                  className="rounded-[6px] border border-[#DFD7C6] bg-[#FBF9F4] px-2 py-1 text-[11px] capitalize outline-none"
                  aria-label="Color finish"
                >
                  {COLOR_FINISHES.map((f) => (
                    <option key={f} value={f} className="capitalize">
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {errors?.color && (
                <p className="mt-1 flex items-center gap-x-1 text-[12px] text-[#8C3A2B]">
                  <AdminExclamationIcon /> {errors.color}
                </p>
              )}
            </div>
            <div>
              <label className="adminsolidlabel">Product price</label>
              <input
                type="number"
                min="0"
                value={variant.price}
                onChange={(e) => onUpdate(variant.id, 'price', e.target.value)}
                className="adminsolid"
              />
            </div>
            <div>
              <label className="adminsolidlabel">Available stock</label>
              <input
                type="number"
                min="0"
                value={variant.stock}
                onChange={(e) => onUpdate(variant.id, 'stock', e.target.value)}
                className={`adminsolid ${errors?.stock ? '!ring-2 !ring-[#8C3A2B]' : ''}`}
                aria-invalid={!!errors?.stock}
              />
              {errors?.stock && (
                <p className="mt-1 flex items-center gap-x-1 text-[12px] text-[#8C3A2B]">
                  <AdminExclamationIcon /> {errors.stock}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type Product = {
  id: string;
  name: string;
  image: string;
  status: 'live' | 'draft';
  inventory: number;
  outOfStock: number;
  created_at: string;
  basePrice: number;
  minVariantPrice: number | null;
  priceVaries: boolean;
};

interface Pagination {
  limit: number;
  offset: number;
  /** Rows on this page. */
  count: number;
  /** Every row matching the filters — what pagination must be driven from. */
  total?: number;
}

interface Meta {
  pagination: Pagination;
  /** Whole-catalogue counts keyed by status, for the tab badges. */
  status_counts?: Record<string, number>;
}

export default function ProductsPage({
  products: initialData,
  collections,
  user,
  initialMeta,
  fetchServerData,
}: {
  products: any[];
  collections?: any[];
  user?: any;
  initialMeta?: Meta;
  fetchServerData?: (
    limit: number,
    offset: number,
    search: string,
    period: string,
    status?: string,
    sortBy?: string,
  ) => Promise<any>;
}) {
  const rawDataRef = useRef<any[]>(initialData || []);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionView, setCollectionView] = useState<
    'list' | 'create' | 'edit'
  >('list');
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [collectionComingSoon, setCollectionComingSoon] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(
    null,
  );
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'all' | 'active' | 'draft' | 'archived'
  >('all');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(
    null,
  );
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);

  // List controls
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<
    'newest' | 'name' | 'price' | 'stock'
  >('newest');

  // Form robustness
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteCollectionId, setPendingDeleteCollectionId] = useState<string | null>(null);
  const [editingProductMeta, setEditingProductMeta] = useState<{
    name: string;
    image: string;
  } | null>(null);
  const isDirtyRef = useRef(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const mapProducts = (data: any[]): Product[] => {
    return (
      (Array.isArray(data) ? data : [])
        .filter(Boolean)
        .map((product) => {
          const variants: any[] = Array.isArray(product?.sample_variants)
            ? product.sample_variants
            : [];
          const variantPrices = variants
            .map((v) => Number(v?.price))
            .filter((p) => Number.isFinite(p) && p > 0);
          const minVariantPrice = variantPrices.length
            ? Math.min(...variantPrices)
            : null;
          const maxVariantPrice = variantPrices.length
            ? Math.max(...variantPrices)
            : null;
          return {
            id: product?.id,
            name: product?.name ?? 'Untitled product',
            image: product?.primary_image || variants?.[0]?.media?.[0]?.url || '',
            status: product?.status === 'active' ? 'live' : 'draft',
            inventory: Number(product?.total_stock) || 0,
            outOfStock: variants.filter((v) => Number(v?.stock) <= 0).length,
            created_at: product?.created_at || '',
            basePrice: Number(product?.base_price) || 0,
            minVariantPrice,
            priceVaries:
              minVariantPrice !== null &&
              maxVariantPrice !== null &&
              minVariantPrice !== maxVariantPrice,
          } as Product;
        }) || []
    );
  };

  const [products, setProducts] = useState<Product[]>(
    mapProducts(initialData || []),
  );
  const [isLive, setIsLive] = useState(false);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [category, setCategory] = useState('');
  const [material, setMaterial] = useState('');
  const [fitType, setFitType] = useState('');
  const [season, setSeason] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [discountType, setDiscountType] = useState('');
  const [variants, setVariants] = useState<VariantData[]>([
    {
      id: Math.random().toString(36).substr(2, 9),
      media: [],
      selectedSizes: [],
      colors: [],
      colorHex: '',
      finish: 'standard',
      price: '',
      stock: '',
    },
  ]);

  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const periodOptions = ['All Time', 'Today', 'Last 7 Days', 'Last 30 Days'];
  const [pagination, setPagination] = useState<Pagination>(
    initialMeta?.pagination || { limit: 50, offset: 0, count: 0 },
  );
  // Whole-catalogue counts per status, for the tab badges. Server-supplied so
  // they describe the catalogue rather than whatever page is on screen.
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>(
    initialMeta?.status_counts || {},
  );

  // Debounce the search input into the committed search query (300ms).
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchIdRef = useRef(0);
  const lastFetchRef = useRef({
    search: initialSearch,
    status: 'all',
    period: 'All Time',
    sortBy: 'newest',
    hasFetched: (initialData?.length ?? 0) > 0,
  });

  // Server-side filtering effect (period + search + status + sort).
  useEffect(() => {
    const next = {
      search: searchQuery,
      status: activeTab,
      period: selectedPeriod,
      sortBy,
    };
    if (
      lastFetchRef.current.hasFetched &&
      next.search === lastFetchRef.current.search &&
      next.status === lastFetchRef.current.status &&
      next.period === lastFetchRef.current.period &&
      next.sortBy === lastFetchRef.current.sortBy
    ) {
      return;
    }

    const fetchData = async () => {
      if (!fetchServerData) return;
      const id = ++fetchIdRef.current;
      lastFetchRef.current = { ...next, hasFetched: true };
      setIsLoading(true);
      try {
        const result = await fetchServerData(
          pagination.limit,
          0, // Reset to first page on filter change
          searchQuery,
          selectedPeriod,
          activeTab, // server-side status filter (was client-side, page-only)
          sortBy, // server-side sort (was client-side, page-only)
        );
        if (id !== fetchIdRef.current) return;
        if (result?.success) {
          rawDataRef.current = result.products?.data || [];
          setProducts(mapProducts(result.products?.data));
          if (result.meta?.pagination) {
            setPagination(result.meta.pagination);
          }
          if (result.meta?.status_counts) {
            setStatusCounts(result.meta.status_counts);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('error', 'Could not load products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // pagination.limit intentionally excluded to avoid refetch loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, searchQuery, activeTab, sortBy]);

  const handlePageChange = async (newOffset: number) => {
    if (!fetchServerData) return;
    const id = ++fetchIdRef.current;
    setIsLoading(true);
    try {
      const result = await fetchServerData(
        pagination.limit,
        newOffset,
        searchQuery,
        selectedPeriod,
        activeTab,
        sortBy,
      );
      if (id !== fetchIdRef.current) return;
      if (result?.success) {
        rawDataRef.current = result.products?.data || [];
        setProducts(mapProducts(result.products?.data));
        if (result.meta?.pagination) {
          setPagination(result.meta.pagination);
        }
        if (result.meta?.status_counts) {
          setStatusCounts(result.meta.status_counts);
        }
      }
    } catch (error) {
      console.error('Error changing page:', error);
      showToast('error', 'Could not load that page. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Entering the focused add/edit panel: scroll to top and move keyboard
  // focus to the first field so the admin can start typing immediately.
  useEffect(() => {
    if (!showAddProduct) return;
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const t = setTimeout(() => nameInputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [showAddProduct]);

  // Warn the browser if the admin tries to close/refresh with unsaved edits.
  useEffect(() => {
    if (!showAddProduct) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [showAddProduct]);

  // Close the focused panel, confirming first if there are unsaved changes.
  const closeForm = () => {
    if (
      isDirtyRef.current &&
      !confirm('You have unsaved changes. Discard them and leave?')
    ) {
      return;
    }
    setShowAddProduct(false);
    resetForm();
  };

  // Close any open popover menu on Escape or outside click (keyboard a11y).
  // activeActionMenuId's own close-on-outside-click/Escape is handled by
  // RowActionMenu itself (it's portaled to body, so it isn't reachable via
  // the data-menu-root closest() check below).
  useEffect(() => {
    const anyOpen = isDropdownOpen || isAddDropdownOpen;
    if (!anyOpen) return;

    const closeAll = () => {
      setIsDropdownOpen(false);
      setIsAddDropdownOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll();
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-menu-root]')) closeAll();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [isDropdownOpen, isAddDropdownOpen]);

  // Close the delete-confirm dialog on Escape.
  useEffect(() => {
    if (!pendingDeleteId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) setPendingDeleteId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pendingDeleteId, isLoading]);

  // Close the collection delete-confirm dialog on Escape.
  useEffect(() => {
    if (!pendingDeleteCollectionId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) setPendingDeleteCollectionId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pendingDeleteCollectionId, isLoading]);

  // Currency formatter for list prices.
  const formatPrice = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return '—';
    try {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `₦${Math.round(value).toLocaleString()}`;
    }
  };

  const pendingDeleteProduct = pendingDeleteId
    ? products.find((p) => p.id === pendingDeleteId)
    : null;

  // Per-tab counts come from the backend, across the whole catalogue.
  // Counting the rows on screen was wrong twice over: it only ever saw one
  // page, and selecting a tab applies a server-side status filter — so the
  // Active tab reported "Draft 0", implying there was nothing in drafts.
  const tabCounts = useMemo(() => {
    const safe = Array.isArray(products) ? products : [];
    const counts = statusCounts || {};
    // The frontend deploys independently of the backend, so status_counts may
    // simply not be there yet. Fall back to counting the page — wrong in the
    // old way rather than confidently reporting zero, which would read as
    // "there are no drafts".
    if (!Object.keys(counts).length) {
      return {
        all: safe.length,
        active: safe.filter((p) => p.status === 'live').length,
        draft: safe.filter((p) => p.status === 'draft').length,
      };
    }
    return {
      all: totalRows(pagination),
      active: counts.active ?? 0,
      // mapProducts collapses archived into the draft label, so the badge has
      // to match what the tab actually shows.
      draft: (counts.draft ?? 0) + (counts.archived ?? 0),
    };
  }, [statusCounts, pagination, products]);

  const filteredProducts = useMemo(() => {
    const safe = Array.isArray(products) ? products : [];
    const byTab = safe.filter((product) => {
      if (activeTab === 'active') return product.status === 'live';
      if (activeTab === 'draft') return product.status === 'draft';
      return true; // 'all'
    });

    // No client-side re-sort. The server already ordered the full catalogue
    // and handed back the right page; re-sorting those rows here only
    // reshuffled one page and made the order look global when it wasn't.
    // `stock` is the one exception the backend can't express (it's an
    // aggregate over variants), so it stays a within-page refinement.
    if (sortBy === 'stock') {
      return [...byTab].sort((a, b) => a.inventory - b.inventory);
    }
    return byTab;
  }, [products, activeTab, sortBy]);

  const addVariant = () => {
    markDirty();
    setVariants((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        media: [],
        selectedSizes: [],
        colors: [],
        colorHex: '',
        finish: 'standard',
        price: '',
        stock: '',
      },
    ]);
  };

  const removeVariant = async (variantId: string) => {
    const isExistingVariant = variantId.length > 9;

    if (isExistingVariant && editingId) {
      if (
        !confirm(
          'Are you sure you want to delete this variant? This action cannot be undone.',
        )
      ) {
        return;
      }

      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('productId', editingId);
        formData.append('variantId', variantId);
        const result = await deleteVariant(formData);

        if (result.success) {
          setVariants((prev) => prev.filter((v) => v.id !== variantId));
          showToast('success', 'Variant deleted successfully');
        } else {
          showToast('error', `Failed to delete variant: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        showToast('error', 'Failed to delete variant');
      } finally {
        setIsLoading(false);
      }
    } else {
      markDirty();
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
    }
  };

  // Mark the focused form as dirty so we can warn before discarding edits.
  const markDirty = () => {
    isDirtyRef.current = true;
  };

  const updateVariant = (id: string, field: keyof VariantData, value: any) => {
    markDirty();
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setEditingProductMeta(null);
    setFieldErrors({});
    isDirtyRef.current = false;
    setProductName('');
    setProductDescription('');
    setCategory('');
    setMaterial('');
    setFitType('');
    setSeason('');
    setBasePrice('');
    setCareInstructions('');
    setDiscountPercentage('');
    setDiscountType('');
    setKeywords([]);
    setIsLive(false);
    setVariants([
      {
        id: Math.random().toString(36).substr(2, 9),
        media: [],
        selectedSizes: [],
        colors: [],
        colorHex: '',
        finish: 'standard',
        price: '',
        stock: '',
      },
    ]);
  };

  const handleEditClick = (id: string) => {
    const product = rawDataRef.current.find((p: any) => p?.id === id);
    if (!product) {
      showToast('error', 'Could not load that product for editing.');
      return;
    }

    setFieldErrors({});
    isDirtyRef.current = false;
    setEditingId(id);
    setEditingProductMeta({
      name: product.name || 'Untitled product',
      image: product.primary_image || product.sample_variants?.[0]?.media?.[0]?.url || '',
    });
    setProductName(product.name || '');
    setProductDescription(product.description || '');
    setCategory(product.collection?.id || '');
    setMaterial(product.material || '');
    setFitType(product.fit_type || '');
    setSeason(product.season || '');
    setBasePrice(product.base_price || '');
    setCareInstructions(product.care_instructions || '');
    setIsLive(product.status === 'active');

    try {
      setKeywords(product.keywords ? JSON.parse(product.keywords) : []);
    } catch {
      setKeywords([]);
    }

    const vars = product.variants || product.sample_variants || [];
    setVariants(
      vars.length > 0
        ? vars.map((v: any) => {
            let parsedSizes: string[] = [];
            try {
              if (v.sizes) {
                parsedSizes = Array.isArray(v.sizes)
                  ? v.sizes
                  : JSON.parse(v.sizes);
              } else if (v.size) {
                parsedSizes = [v.size];
              }
            } catch (e) {
              console.error('Error parsing sizes:', e);
              parsedSizes = [];
            }

            let parsedColors: string[] = [];
            try {
              if (v.colors) {
                parsedColors = Array.isArray(v.colors)
                  ? v.colors
                  : JSON.parse(v.colors);
              } else if (v.color) {
                parsedColors = [v.color];
              }
            } catch (e) {
              console.error('Error parsing colors:', e);
              parsedColors = [];
            }

            return {
              id: v.id || Math.random().toString(36).substr(2, 9),
              media: (v.media || []).map(
                (m: { id: string; url: string }): VariantMediaItem => ({
                  key: `existing-${m.id}`,
                  kind: 'existing',
                  id: m.id,
                  url: m.url,
                }),
              ),
              selectedSizes: parsedSizes.map((s: string) => s.toLowerCase()),
              colors: parsedColors,
              colorHex: isValidHex(v.color_hex)
                ? v.color_hex
                : guessHexFromName(parsedColors[0]),
              finish: (COLOR_FINISHES as string[]).includes(v.finish)
                ? v.finish
                : 'standard',
              price: v.price ?? '',
              stock: v.stock ?? '',
            };
          })
        : [
            {
              id: Math.random().toString(36).substr(2, 9),
              media: [],
              selectedSizes: [],
              colors: [],
              colorHex: '',
              finish: 'standard',
              price: '',
              stock: '',
            },
          ],
    );

    setShowAddProduct(true);
  };

  // Open the styled confirm dialog instead of a raw window.confirm.
  const requestDeleteProduct = (id: string) => {
    setActiveActionMenuId(null);
    setPendingDeleteId(id);
  };

  const handleDeleteProduct = async (id: string) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('id', id);

      const result = await deleteProduct(formData);

      if (result?.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        rawDataRef.current = rawDataRef.current.filter(
          (p: any) => p?.id !== id,
        );
        showToast('success', 'Product deleted successfully');
      } else {
        showToast(
          'error',
          `Failed to delete product: ${result?.error || 'Unknown error'}`,
        );
      }
    } catch (error) {
      showToast('error', 'Failed to delete product');
    } finally {
      setIsLoading(false);
      setPendingDeleteId(null);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('id', id);

      const result = await deleteCollection(formData);

      if (result?.success) {
        showToast('success', 'Collection deleted successfully');
        setShowCollectionModal(false);
        setCollectionView('list');
        setCollectionName('');
        setCollectionDescription('');
        setEditingCollectionId(null);
        setSelectedPeriod('All Time');
      } else {
        showToast(
          'error',
          `Failed to delete collection: ${result?.error || 'Unknown error'}`,
        );
      }
    } catch (error) {
      showToast('error', 'Failed to delete collection');
    } finally {
      setIsLoading(false);
      setPendingDeleteCollectionId(null);
    }
  };

  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  const handleCreateCollection = async () => {
    if (!collectionName.trim()) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', collectionName);
      formData.append('description', collectionDescription);
      formData.append('coming_soon', String(collectionComingSoon));
      const result = await createCollection(formData);

      if (result.success) {
        showToast('success', 'Collection created successfully');
        setShowCollectionModal(false);
        setCollectionName('');
        setCollectionDescription('');
        setCollectionComingSoon(false);
        setSelectedPeriod('All Time');
      } else {
        showToast('error', `Failed to create collection: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      showToast('error', 'Failed to create collection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCollection = async () => {
    if (!collectionName.trim() || !editingCollectionId) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('id', editingCollectionId);
      formData.append('name', collectionName);
      formData.append('description', collectionDescription);
      formData.append('coming_soon', String(collectionComingSoon));
      const result = await updateCollection(formData);

      if (result.success) {
        showToast('success', 'Collection updated successfully');
        setShowCollectionModal(false);
        setCollectionName('');
        setCollectionDescription('');
        setCollectionComingSoon(false);
        setEditingCollectionId(null);
        setSelectedPeriod('All Time');
      } else {
        showToast('error', `Failed to update collection: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      showToast('error', 'Failed to update collection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    // Prevent double-submit while a save is already in flight.
    if (isSaving) return;

    // Validate up-front and surface inline messages (plus one summary toast)
    // instead of failing silently or only toasting.
    const errors: Record<string, string> = {};
    if (!productName.trim()) errors.productName = 'Product name is required';
    if (!basePrice || Number(basePrice) <= 0)
      errors.basePrice = 'Enter a valid price greater than 0';
    if (!category) errors.category = 'Select a collection';

    const safeVariants = Array.isArray(variants) ? variants : [];
    if (safeVariants.length === 0) {
      errors.variants = 'Add at least one variant';
    }
    safeVariants.forEach((v, i) => {
      if (!v.selectedSizes || v.selectedSizes.length === 0)
        errors[`variant-${v.id}-size`] = `Variant ${i + 1}: select a size`;
      if (!v.colors || v.colors.length === 0)
        errors[`variant-${v.id}-color`] = `Variant ${i + 1}: add a color`;
      if (v.stock === '' || v.stock === null || Number(v.stock) < 0)
        errors[`variant-${v.id}-stock`] =
          `Variant ${i + 1}: enter a valid stock quantity`;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast('error', 'Please fix the highlighted fields before saving');
      // Focus the first invalid top-level field for quick correction.
      if (errors.productName) nameInputRef.current?.focus();
      return;
    }
    setFieldErrors({});

    setIsSaving(true);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('productName', productName);
      formData.append('productDescription', productDescription);
      formData.append('isLive', String(isLive));
      formData.append('category', category);
      formData.append('material', material);
      formData.append('fitType', fitType);
      formData.append('season', season);
      formData.append('careInstructions', careInstructions);
      formData.append('basePrice', basePrice);
      formData.append('price', basePrice);
      formData.append('discountPercentage', discountPercentage);
      formData.append('discountType', discountType);
      formData.append('keywords', JSON.stringify(keywords));

      // Each variant's media slots, in the admin's exact order - existing
      // items resolve immediately, new items start as null and get filled
      // in below once their upload completes. Uploading every new photo
      // across every variant concurrently (rather than per-variant
      // Promise.all wrapping a sequential per-file loop) is safe since
      // each variant is already capped at 6 photos.
      const mediaSlots: (string | null)[][] = variants.map((v) =>
        v.media.map((item) => (item.kind === 'existing' ? (item.id ?? null) : null)),
      );

      const uploadTasks: Promise<void>[] = [];
      variants.forEach((v, vIdx) => {
        v.media.forEach((item, mIdx) => {
          if (item.kind === 'new' && item.file) {
            const file = item.file;
            uploadTasks.push(
              (async () => {
                const fileData = new FormData();
                fileData.append('file', file);
                const res = await uploadFile(fileData);
                if (!res?.success || !res.data?.id) {
                  throw new Error(
                    `Failed to upload image: ${res?.error || 'Unknown error'}`,
                  );
                }
                mediaSlots[vIdx][mIdx] = res.data.id;
              })(),
            );
          }
        });
      });

      await Promise.all(uploadTasks);

      const variantsToSend = variants.map((v, vIdx) => {
        const { media, ...rest } = v;

        return {
          ...rest,
          price: Number(rest.price) || 0,
          stock: Number(rest.stock) || 0,
          media: mediaSlots[vIdx].filter((mediaId): mediaId is string => Boolean(mediaId)),
        };
      });

      formData.append('variants', JSON.stringify(variantsToSend));

      if (editingId) {
        formData.append('id', editingId);
        const result = await updateProduct(formData);

        if (result?.success) {
          isDirtyRef.current = false;
          showToast('success', 'Product updated successfully');
          setShowAddProduct(false);
          resetForm();
          // Refresh the list so the edit is reflected immediately.
          handlePageChange(0);
        } else {
          showToast(
            'error',
            `Failed to update product: ${result?.error || 'Unknown error'}`,
          );
        }
      } else {
        const result = await createProduct(formData);

        if (result?.success) {
          isDirtyRef.current = false;
          showToast('success', 'Product created successfully');
          setShowAddProduct(false);
          resetForm();
          // Refresh the list so the new product shows immediately.
          handlePageChange(0);
        } else {
          showToast(
            'error',
            `Failed to create product: ${result?.error || 'Unknown error'}`,
          );
        }
      }
    } catch (error) {
      showToast(
        'error',
        `Failed to save product: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      console.error('Error saving product:', error);
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  };

  return (
    <GridContainer user={user}>
      <>
        <div ref={topRef} className="px-[16px]">
          {showAddProduct ? (
            <div className="sticky top-0 z-40 -mx-[16px] mb-[8px] flex flex-col gap-3 border-b border-[#E2DBCC] bg-[#F4F1EA]/95 px-[16px] py-[16px] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between !text-[#14110E]">
              <div className="flex items-center gap-x-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-x-2 rounded-[10px] border border-[#DFD7C6] bg-[#FBF9F4] px-3 text-sm font-medium outline-none transition-colors hover:bg-[#EFEBE1] focus-visible:ring-2 focus-visible:ring-[#9C6F2E]"
                  aria-label="Back to products list"
                >
                  <ArrowLeftIcon />
                  <span className="hidden sm:inline">Back</span>
                </button>
                {editingId ? (
                  <div className="flex items-center gap-x-3">
                    {editingProductMeta?.image ? (
                      <img
                        src={editingProductMeta.image}
                        alt=""
                        className="size-10 rounded-[8px] border border-[#DFD7C6] object-cover"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-[8px] border border-[#DFD7C6] bg-[#EFEBE1] text-[#8C8377]">
                        <AdminEditIcon />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-x-2">
                        <span className="rounded-full bg-[#EAE4D7] px-2 py-0.5 text-[11px] font-semibold text-[#9C6F2E] uppercase">
                          Editing
                        </span>
                      </div>
                      <div className="mt-0.5 max-w-[260px] truncate text-[15px] font-semibold">
                        {editingProductMeta?.name || productName || 'Product'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="ad-display text-[20px]">Add product</span>
                )}
              </div>
            </div>
          ) : (
            <PageHeader
              eyebrow="The house"
              title="Products"
              description="Limited capsule drops, never floods. Everything in the catalogue — live, draft and archived — sits here."
            />
          )}
        </div>

        {!showAddProduct && (
          <div className="">
            <div className="relative rounded-t-[14px] border border-[#E2DBCC] bg-[#FBF9F4] px-[24px] pt-[24px] text-[#14110E]">
              <div className="scrollbar-hide flex flex-col-reverse items-start justify-between gap-4 overflow-visible sm:flex-row sm:items-center">
                <div className="flex items-center gap-8" role="tablist">
                  {[
                    { id: 'all', label: 'All', count: tabCounts.all },
                    { id: 'active', label: 'Active', count: tabCounts.active },
                    { id: 'draft', label: 'Draft', count: tabCounts.draft },
                  ].map(({ id, label, count }: any) => {
                    const isActive = activeTab === id;
                    return (
                      <button
                        key={id}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveTab(id)}
                        className={`relative flex cursor-pointer items-center gap-x-2 pb-4 text-[14px] outline-none transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-[#9C6F2E] ${
                          isActive
                            ? 'text-[#14110E]'
                            : 'text-[#8C8377] hover:text-[#5C544A]'
                        }`}
                      >
                        {label}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            isActive
                              ? 'bg-[#14110E] text-[#F4F1EA]'
                              : 'bg-[#EFEBE1] text-[#8C8377]'
                          }`}
                        >
                          {count}
                        </span>
                        {isActive && (
                          <span className="absolute top-full left-0 z-10 h-[2px] w-full translate-y-[-2px] rounded-t-sm bg-[#9C6F2E] sm:translate-y-[5px]" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-x-2 pb-4">
                  <div className="relative flex items-center" data-menu-root>
                    <motion.button
                      onClick={() => {
                        setIsAddDropdownOpen(false);
                        setIsDropdownOpen(!isDropdownOpen);
                      }}
                      whileTap={{ scale: 0.95 }}
                      aria-haspopup="menu"
                      aria-expanded={isDropdownOpen}
                      className="btn_admin_outline flex items-center gap-x-[2px] focus-visible:ring-2 focus-visible:ring-[#9C6F2E]"
                    >
                      <AdminSoundLevelsIcon />
                      {selectedPeriod}
                    </motion.button>
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.92, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.92, y: -6 }}
                          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute top-full right-0 z-30 mt-2 w-32 origin-top-right rounded-[10px] border border-[#E2DBCC] bg-[#FBF9F4] shadow-[0_18px_40px_-20px_rgba(20,17,14,0.35)]"
                        >
                          <div className="py-1">
                            {periodOptions.map((option) => (
                              <button
                                key={option}
                                onClick={() => {
                                  setSelectedPeriod(option);
                                  setIsDropdownOpen(false);
                                }}
                                className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#8C8377] hover:bg-[#EFEAE0] hover:text-[#8C8377]"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative flex items-center" data-menu-root>
                    <motion.button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsAddDropdownOpen(!isAddDropdownOpen);
                      }}
                      whileTap={{ scale: 0.95 }}
                      aria-haspopup="menu"
                      aria-expanded={isAddDropdownOpen}
                      className="btn_admin_outline flex items-center gap-x-[2px] focus-visible:ring-2 focus-visible:ring-[#9C6F2E]"
                    >
                      <AdminPlusCircleIcon />
                      Add
                    </motion.button>
                    <AnimatePresence>
                      {isAddDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.92, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.92, y: -6 }}
                          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute top-full right-0 z-30 mt-2 w-40 origin-top-right rounded-[10px] border border-[#E2DBCC] bg-[#FBF9F4] shadow-[0_18px_40px_-20px_rgba(20,17,14,0.35)]"
                        >
                          <div className="py-1">
                            <button
                              className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#8C8377] hover:bg-[#EFEAE0] hover:text-[#8C8377]"
                              onClick={() => {
                                setIsAddDropdownOpen(false);
                                setShowCollectionModal(true);
                              }}
                            >
                              Manage Collections
                            </button>
                            <button
                              onClick={() => {
                                resetForm();
                                setShowAddProduct(true);
                                setIsAddDropdownOpen(false);
                              }}
                              className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#8C8377] hover:bg-[#EFEAE0] hover:text-[#8C8377]"
                            >
                              Add Product
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Search + sort toolbar */}
            <div className="flex flex-col gap-3 bg-[#FBF9F4] px-[24px] pt-[20px] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex h-[44px] w-full items-center gap-x-2 rounded-[10px] bg-[#EFEBE1] px-[15px] sm:max-w-[320px]">
                <AdminSearchIcon />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search products..."
                  aria-label="Search products"
                  className="w-full border-0 bg-transparent text-[14px] placeholder:text-[#8C8377] outline-none focus:ring-0"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    aria-label="Clear search"
                    className="flex size-6 cursor-pointer items-center justify-center text-[#8C8377] hover:text-[#3F3830]"
                  >
                    <CloseIconTags />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-x-2">
                <label
                  htmlFor="sort-products"
                  className="text-[13px] text-[#8C8377]"
                >
                  Sort by
                </label>
                <select
                  id="sort-products"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="h-[44px] cursor-pointer rounded-full border border-[#DFD7C6] bg-[#EFEBE1] text-[#14110E] placeholder:text-[#8C8377] px-3 text-[13px] text-[#3F3830] outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#9C6F2E]"
                >
                  <option value="newest">Newest</option>
                  <option value="name">Name (A–Z)</option>
                  <option value="price">Price (low–high)</option>
                  <option value="stock">Stock (low–high)</option>
                </select>
              </div>
            </div>

            <div
              id="product_display"
              className="rounded-b-[14px] border border-t-0 border-[#E2DBCC] bg-[#FBF9F4] px-[24px]"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-[13px]">
                  <thead>
                    <tr>
                      <th scope="col" className="thead truncate">
                        Product
                      </th>
                      <th scope="col" className="thead">
                        Price
                      </th>
                      <th scope="col" className="thead">
                        Status
                      </th>
                      <th scope="col" className="thead">
                        Inventory
                      </th>
                      <th scope="col" className="thead whitespace-nowrap">
                        Out of Stock
                      </th>
                      <th scope="col" className="thead">
                        Manage
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Loading skeletons */}
                    {isLoading &&
                      filteredProducts.length === 0 &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={`skeleton-${i}`}>
                          <td className="td">
                            <div className="flex items-center gap-x-3">
                              <div className="size-8 animate-pulse rounded-[8px] bg-[#E2DBCC]" />
                              <div className="h-3 w-40 animate-pulse rounded bg-[#E2DBCC]" />
                            </div>
                          </td>
                          <td className="td">
                            <div className="h-3 w-16 animate-pulse rounded bg-[#E2DBCC]" />
                          </td>
                          <td className="td">
                            <div className="h-5 w-14 animate-pulse rounded-full bg-[#E2DBCC]" />
                          </td>
                          <td className="td">
                            <div className="h-3 w-8 animate-pulse rounded bg-[#E2DBCC]" />
                          </td>
                          <td className="td">
                            <div className="h-3 w-8 animate-pulse rounded bg-[#E2DBCC]" />
                          </td>
                          <td className="td">
                            <div className="size-[25px] animate-pulse rounded-[6px] bg-[#E2DBCC]" />
                          </td>
                        </tr>
                      ))}

                    {/*
                      The catalogue says there ARE products but none reached the
                      table. Previously this fell through to "Add your first
                      product", which contradicts the tab badges and the
                      "Showing 1 to N" line right below — both of which come
                      from server-supplied meta rather than from these rows, so
                      they stay correct while the table is empty. Saying so
                      out loud beats a blank tbody or a misleading empty state.
                    */}
                    {!isLoading &&
                      filteredProducts.length === 0 &&
                      totalRows(pagination) > 0 && (
                        <tr>
                          <td colSpan={6} className="td">
                            <div className="py-12 text-center">
                              <p className="text-[15px] font-medium text-[#3F3830]">
                                {totalRows(pagination)} product
                                {totalRows(pagination) === 1 ? '' : 's'} in this
                                view could not be displayed.
                              </p>
                              <p className="mt-1 text-[13px] text-[#8C8377]">
                                Reload the page. If it keeps happening, try a
                                different browser — some data-saving browsers
                                cannot render this table.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}

                    {/* Empty state per tab */}
                    {!isLoading &&
                      filteredProducts.length === 0 &&
                      totalRows(pagination) === 0 && (
                      <tr>
                        <td colSpan={6} className="td">
                          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-[#EFEBE1] text-[#8C8377]">
                              <AdminSearchIcon />
                            </div>
                            <p className="text-[15px] font-medium text-[#3F3830]">
                              {searchQuery
                                ? `No products match "${searchQuery}"`
                                : activeTab === 'active'
                                  ? 'No active products yet'
                                  : activeTab === 'draft'
                                    ? 'No draft products'
                                    : 'No products yet'}
                            </p>
                            <p className="max-w-xs text-[13px] text-[#8C8377]">
                              {searchQuery
                                ? 'Try a different search term or clear the search.'
                                : 'Add your first product to get started.'}
                            </p>
                            {!searchQuery && (
                              <button
                                type="button"
                                onClick={() => {
                                  resetForm();
                                  setShowAddProduct(true);
                                }}
                                className="mt-2 flex h-[44px] cursor-pointer items-center gap-x-1 rounded-full bg-[#14110E] px-4 text-[13px] font-semibold text-[#F4F1EA] outline-none transition-colors hover:bg-[#241F19] focus-visible:ring-2 focus-visible:ring-[#9C6F2E]"
                              >
                                <AdminPlusCircleIcon /> Add Product
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                    {filteredProducts.map((product) => {
                      const isOutOfStock = product.inventory <= 0;
                      const isLowStock =
                        !isOutOfStock &&
                        product.inventory <= LOW_STOCK_THRESHOLD;
                      const displayPrice =
                        product.minVariantPrice ?? product.basePrice;
                      return (
                        <tr key={product.id} className="ad-row group">
                          {/*
                            Laid out with inline-block, NOT flex, and deliberately
                            so. Opera Mini's proxy renderer has no flexbox: a flex
                            child there can collapse to zero width, and combined
                            with `truncate` (overflow:hidden) the product name
                            clipped to nothing — the whole table read as empty even
                            though every row was present in the markup.

                            Inline-block degrades safely instead: a renderer that
                            ignores max-width/overflow shows the untruncated name
                            rather than no name. Same result on modern browsers.
                          */}
                          <td className="td">
                            {product?.image ? (
                              <img
                                src={product.image}
                                alt={product.name || 'Product image'}
                                className="mr-3 inline-block size-9 rounded-[8px] object-cover align-middle"
                              />
                            ) : (
                              <span className="mr-3 inline-block size-9 rounded-[8px] bg-[#EFEBE1] text-center text-[10px] leading-9 text-[#8C8377] align-middle">
                                N/A
                              </span>
                            )}
                            <span className="inline-block max-w-[220px] truncate align-middle font-medium text-[#14110E]">
                              {product.name}
                            </span>
                          </td>
                          <td className="td whitespace-nowrap">
                            {product.priceVaries && (
                              <span className="mr-1 text-[#8C8377]">from</span>
                            )}
                            {formatPrice(displayPrice)}
                          </td>
                          <td className="td">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                                product.status === 'live'
                                  ? 'bg-[#E4EDE3] text-[#3D6B4A]'
                                  : 'bg-[#F3E9D6] text-[#8A6218]'
                              }`}
                            >
                              {product.status}
                            </span>
                          </td>
                          <td className="td">
                            <span className="align-middle">{product.inventory}</span>
                            {isOutOfStock ? (
                              <span className="ml-2 inline-block rounded-full bg-[#F2E1DB] px-2 py-0.5 align-middle text-[10px] font-semibold text-[#8C3A2B] uppercase">
                                Out of stock
                              </span>
                            ) : isLowStock ? (
                              <span className="ml-2 inline-block rounded-full bg-[#F3E9D6] px-2 py-0.5 align-middle text-[10px] font-semibold text-[#8A6218] uppercase">
                                Low
                              </span>
                            ) : null}
                          </td>
                          <td className="td">{product.outOfStock}</td>
                          <td className="td">
                            <div className="relative" data-menu-root>
                              <motion.button
                                onClick={(e) => {
                                  const next =
                                    activeActionMenuId === product.id
                                      ? null
                                      : product.id;
                                  // Capture the trigger element here rather
                                  // than relying on a conditionally-attached
                                  // shared ref.
                                  setMenuAnchorEl(next ? e.currentTarget : null);
                                  setActiveActionMenuId(next);
                                }}
                                whileTap={{ scale: 0.88 }}
                                aria-haspopup="menu"
                                aria-expanded={activeActionMenuId === product.id}
                                aria-label={`Actions for ${product.name}`}
                                className="flex size-[36px] cursor-pointer items-center justify-center rounded-[8px] bg-[#EFEBE1] outline-none transition-colors hover:bg-[#E2DBCC] focus-visible:ring-2 focus-visible:ring-[#9C6F2E]"
                              >
                                <AdminMoreVerticalIcon />
                              </motion.button>
                              <RowActionMenu
                                open={activeActionMenuId === product.id}
                                onClose={() => {
                                  setActiveActionMenuId(null);
                                  setMenuAnchorEl(null);
                                }}
                                anchorEl={menuAnchorEl}
                              >
                                <button
                                  role="menuitem"
                                  onClick={() => {
                                    handleEditClick(product.id);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#3F3830] outline-none hover:bg-[#EFEAE0] focus-visible:bg-[#EFEAE0]"
                                >
                                  Edit
                                </button>
                                <button
                                  role="menuitem"
                                  onClick={() =>
                                    requestDeleteProduct(product.id)
                                  }
                                  className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#8C3A2B] outline-none hover:bg-[#EFEAE0] focus-visible:bg-[#EFEAE0]"
                                >
                                  Delete
                                </button>
                              </RowActionMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Pagination Controls */}
            {totalRows(pagination) > 0 && (
              <div className="flex items-center justify-between px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() =>
                      handlePageChange(pagination.offset - pagination.limit)
                    }
                    disabled={pagination.offset === 0 || isLoading}
                    className="relative inline-flex items-center rounded-[8px] border border-[#DFD7C6] bg-[#FBF9F4] px-4 py-2 text-sm font-medium text-[#3F3830] hover:bg-[#EFEBE1] disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      handlePageChange(pagination.offset + pagination.limit)
                    }
                    disabled={
                      pagination.offset + pagination.limit >=
                        totalRows(pagination) || isLoading
                    }
                    className="relative ml-3 inline-flex items-center rounded-[8px] border border-[#DFD7C6] bg-[#FBF9F4] px-4 py-2 text-sm font-medium text-[#3F3830] hover:bg-[#EFEBE1] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-[#3F3830]">
                      Showing{' '}
                      <span className="font-medium">
                        {pagination.offset + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(
                          pagination.offset + pagination.limit,
                          totalRows(pagination),
                        )}
                      </span>{' '}
                      of <span className="font-medium">{totalRows(pagination)}</span>{' '}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="isolate inline-flex -space-x-px rounded-[8px] shadow-xs"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() =>
                          handlePageChange(pagination.offset - pagination.limit)
                        }
                        disabled={pagination.offset === 0 || isLoading}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[#8C8377] ring-1 ring-[#DFD7C6] ring-inset hover:bg-[#EFEBE1] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          handlePageChange(pagination.offset + pagination.limit)
                        }
                        disabled={
                          pagination.offset + pagination.limit >=
                            totalRows(pagination) || isLoading
                        }
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-[#8C8377] ring-1 ring-[#DFD7C6] ring-inset hover:bg-[#EFEBE1] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {showAddProduct && (
          <div id="add_product">
            {/* Product Information */}
            <div>
              <div className="space-y-[24px]">
                <div className="rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-[24px] text-[#14110E]">
                  <div className="space-y-[24px]">
                    {/* Header */}
                    <div className="flex justify-between pb-[24px]">
                      <div className="capitalize">product information</div>
                      <label
                        htmlFor="live-toggle"
                        className="relative inline-flex cursor-pointer items-center gap-x-2"
                      >
                        <span className="text-[14px] text-[#14110E]">Live</span>

                        <input
                          type="checkbox"
                          id="live-toggle"
                          checked={isLive}
                          onChange={(e) => {
                            markDirty();
                            setIsLive(e.target.checked);
                          }}
                          className="peer sr-only"
                        />

                        <div className="relative h-6 w-11 rounded-full bg-[#E2DBCC] transition-colors peer-checked:bg-[#3D6B4A] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-[#FBF9F4] after:shadow after:transition-all after:content-[''] peer-checked:after:translate-x-5" />
                      </label>
                    </div>

                    {/* Name + Price */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="product-name" className="adminsolidlabel">
                          Product name <span className="text-[#8C3A2B]">*</span>
                        </label>
                        <input
                          id="product-name"
                          ref={nameInputRef}
                          type="text"
                          className={`adminsolid ${fieldErrors.productName ? '!ring-2 !ring-[#8C3A2B]' : ''}`}
                          value={productName}
                          aria-invalid={!!fieldErrors.productName}
                          onChange={(e) => {
                            markDirty();
                            setProductName(e.target.value);
                            if (fieldErrors.productName)
                              setFieldErrors((p) => ({
                                ...p,
                                productName: '',
                              }));
                          }}
                        />
                        {fieldErrors.productName && (
                          <p className="mt-1 flex items-center gap-x-1 text-[12px] text-[#8C3A2B]">
                            <AdminExclamationIcon /> {fieldErrors.productName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="product-price"
                          className="adminsolidlabel"
                        >
                          Product price{' '}
                          <span className="text-[#8C3A2B]">*</span>
                        </label>
                        <input
                          id="product-price"
                          type="number"
                          min="0"
                          className={`adminsolid ${fieldErrors.basePrice ? '!ring-2 !ring-[#8C3A2B]' : ''}`}
                          value={basePrice}
                          aria-invalid={!!fieldErrors.basePrice}
                          onChange={(e) => {
                            markDirty();
                            setBasePrice(e.target.value);
                            if (fieldErrors.basePrice)
                              setFieldErrors((p) => ({ ...p, basePrice: '' }));
                          }}
                        />
                        {fieldErrors.basePrice && (
                          <p className="mt-1 flex items-center gap-x-1 text-[12px] text-[#8C3A2B]">
                            <AdminExclamationIcon /> {fieldErrors.basePrice}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="adminsolidlabel">
                        Product description
                      </label>
                      <textarea
                        className="adminsolid !h-[80px]"
                        value={productDescription}
                        onChange={(e) => {
                          markDirty();
                          setProductDescription(e.target.value);
                        }}
                      />
                    </div>

                    {/* Selects */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className="adminsolidlabel">
                          Collection <span className="text-[#8C3A2B]">*</span>
                        </label>
                        <select
                          className={`adminsolid ${fieldErrors.category ? '!ring-2 !ring-[#8C3A2B]' : ''}`}
                          value={category}
                          aria-invalid={!!fieldErrors.category}
                          onChange={(e) => {
                            markDirty();
                            setCategory(e.target.value);
                            if (fieldErrors.category)
                              setFieldErrors((p) => ({ ...p, category: '' }));
                          }}
                        >
                          <option value="" disabled>
                            Select Collection
                          </option>
                          {(collections || []).map((collection) => (
                            <option key={collection.id} value={collection.id}>
                              {collection.name}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.category && (
                          <p className="mt-1 flex items-center gap-x-1 text-[12px] text-[#8C3A2B]">
                            <AdminExclamationIcon /> {fieldErrors.category}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="adminsolidlabel">Material</label>
                        <select
                          className="adminsolid"
                          value={material}
                          onChange={(e) => {
                            markDirty();
                            setMaterial(e.target.value);
                          }}
                        >
                          <option value="" disabled>
                            Select Material
                          </option>
                          {MATERIALS.map((mat) => (
                            <option key={mat} value={mat}>
                              {mat.charAt(0).toUpperCase() + mat.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="adminsolidlabel">Fit Type</label>
                        <select
                          className="adminsolid"
                          value={fitType}
                          onChange={(e) => {
                            markDirty();
                            setFitType(e.target.value);
                          }}
                        >
                          <option value="" disabled>
                            Select Fit Type
                          </option>
                          {FIT_TYPES.map((fit) => (
                            <option key={fit} value={fit}>
                              {fit.charAt(0).toUpperCase() + fit.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="adminsolidlabel">Season</label>
                        <select
                          className="adminsolid"
                          value={season}
                          onChange={(e) => {
                            markDirty();
                            setSeason(e.target.value);
                          }}
                        >
                          <option value="" disabled>
                            Select Season
                          </option>
                          {SEASON.map((season) => (
                            <option key={season} value={season}>
                              {season.charAt(0).toUpperCase() + season.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Care Instructions */}
                    <div>
                      <label className="adminsolidlabel">
                        Care instructions
                      </label>
                      <textarea
                        className="adminsolid !h-[80px]"
                        value={careInstructions}
                        onChange={(e) => {
                          markDirty();
                          setCareInstructions(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between px-[16px] pt-[24px] pb-[22px] !text-[#14110E]">
                <span className="font-medium">Product Variant</span>
                <button
                  type="button"
                  onClick={addVariant}
                  className="btn_creators_solid_no_height p-[10px] focus-visible:ring-2 focus-visible:ring-[#9C6F2E]"
                >
                  + Add Variant
                </button>
              </div>
              {fieldErrors.variants && (
                <p className="mb-3 flex items-center gap-x-1 px-[16px] text-[12px] text-[#8C3A2B]">
                  <AdminExclamationIcon /> {fieldErrors.variants}
                </p>
              )}
              <div className="space-y-[24px]">
                {(Array.isArray(variants) ? variants : []).map(
                  (variant, index) => (
                    <VariantItem
                      key={variant.id}
                      variant={variant}
                      index={index}
                      onUpdate={updateVariant}
                      onRemove={removeVariant}
                      canRemove={variants.length > 1}
                      errors={{
                        size: fieldErrors[`variant-${variant.id}-size`],
                        color: fieldErrors[`variant-${variant.id}-color`],
                        stock: fieldErrors[`variant-${variant.id}-stock`],
                      }}
                    />
                  ),
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveProduct}
              disabled={isSaving}
              aria-busy={isSaving}
              className={`btn_creators_solid flex items-center justify-center gap-x-2 focus-visible:ring-2 focus-visible:ring-[#9C6F2E] ${isSaving ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              {isSaving && <Spinner />}
              {isSaving
                ? 'Saving...'
                : editingId
                  ? 'Update Product'
                  : 'Save Product'}
            </button>
          </div>
        )}

        {/* Styled delete confirmation dialog */}
        {pendingDeleteId && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0E0E10]/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            onClick={() => {
              if (!isLoading) setPendingDeleteId(null);
            }}
          >
            <div
              className="w-full max-w-sm rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-[24px] shadow-[0_30px_80px_-30px_rgba(20,17,14,0.5)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center gap-x-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-[#F2E1DB]">
                  <AdminExclamationIcon />
                </div>
                <h2
                  id="delete-dialog-title"
                  className="text-lg font-semibold text-[#14110E]"
                >
                  Delete product?
                </h2>
              </div>
              <p className="mb-6 text-sm text-[#5C544A]">
                {pendingDeleteProduct?.name
                  ? `“${pendingDeleteProduct.name}” and its variants will be permanently removed. This action cannot be undone.`
                  : 'This product and its variants will be permanently removed. This action cannot be undone.'}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(null)}
                  className="flex-1 rounded-[10px] border border-[#DFD7C6] px-4 py-2 text-sm font-medium text-[#3F3830] hover:bg-[#EFEBE1]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(pendingDeleteId)}
                  disabled={isLoading}
                  className="flex-1 rounded-full bg-[#8C3A2B] px-4 py-2 text-sm font-medium text-[#F4F1EA] hover:bg-[#6E2C20] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading && <Spinner />}
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collection delete confirmation dialog */}
        {pendingDeleteCollectionId && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0E0E10]/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-collection-dialog-title"
            onClick={() => {
              if (!isLoading) setPendingDeleteCollectionId(null);
            }}
          >
            <div
              className="w-full max-w-sm rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-[24px] shadow-[0_30px_80px_-30px_rgba(20,17,14,0.5)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center gap-x-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-[#F2E1DB]">
                  <AdminExclamationIcon />
                </div>
                <h2
                  id="delete-collection-dialog-title"
                  className="text-lg font-semibold text-[#14110E]"
                >
                  Delete collection?
                </h2>
              </div>
              <p className="mb-6 text-sm text-[#5C544A]">
                This collection will be permanently removed. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPendingDeleteCollectionId(null)}
                  className="flex-1 rounded-[10px] border border-[#DFD7C6] px-4 py-2 text-sm font-medium text-[#3F3830] hover:bg-[#EFEBE1]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCollection(pendingDeleteCollectionId)}
                  disabled={isLoading}
                  className="flex-1 rounded-full bg-[#8C3A2B] px-4 py-2 text-sm font-medium text-[#F4F1EA] hover:bg-[#6E2C20] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading && <Spinner />}
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showCollectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E0E10]/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-[24px] shadow-[0_30px_80px_-30px_rgba(20,17,14,0.5)]">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="ad-display text-[20px] text-[#14110E] capitalize">
                  {collectionView === 'list'
                    ? 'Collections'
                    : collectionView === 'create'
                      ? 'New Collection'
                      : 'Edit Collection'}
                </h2>
                <button
                  onClick={() => {
                    setShowCollectionModal(false);
                    setCollectionView('list');
                    setCollectionName('');
                    setCollectionDescription('');
                  }}
                  className="cursor-pointer"
                >
                  <CloseIconTags />
                </button>
              </div>

              {collectionView === 'list' ? (
                <div className="space-y-4">
                  <div className="max-h-[300px] overflow-y-auto">
                    {collections?.map((collection) => (
                      <div
                        key={collection.id}
                        className="flex items-center justify-between border-b border-[#E2DBCC] py-3 last:border-0"
                      >
                        <span className="flex items-center gap-2 text-[#14110E]">
                          {collection.name}
                          {collection.coming_soon && (
                            <span className="rounded-full bg-[#EFEAE0] px-2 py-0.5 text-[11px] font-medium text-[#8C8377]">
                              Coming soon
                            </span>
                          )}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingCollectionId(collection.id);
                              setCollectionName(collection.name);
                              setCollectionDescription(
                                collection.description || '',
                              );
                              setCollectionComingSoon(
                                !!collection.coming_soon,
                              );
                              setCollectionView('edit');
                            }}
                            className="text-sm text-[#9C6F2E] hover:text-[#9C6F2E]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setPendingDeleteCollectionId(collection.id)}
                            className="text-sm text-[#8C3A2B] hover:text-[#8C3A2B]"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!collections || collections.length === 0) && (
                      <p className="text-sm text-[#5C544A]">
                        No collections found.
                      </p>
                    )}
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setCollectionName('');
                        setCollectionDescription('');
                        setCollectionComingSoon(false);
                        setCollectionView('create');
                      }}
                      className="btn_creators_solid w-full justify-center"
                    >
                      Create New Collection
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="adminsolidlabel mb-2 block">
                      Collection Name
                    </label>
                    <input
                      type="text"
                      value={collectionName}
                      onChange={(e) => setCollectionName(e.target.value)}
                      className="adminsolid w-full"
                      placeholder="Enter collection name"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="adminsolidlabel mb-2 block">
                      Description
                    </label>
                    <textarea
                      value={collectionDescription}
                      onChange={(e) => setCollectionDescription(e.target.value)}
                      className="adminsolid !h-[100px] w-full"
                      placeholder="Enter collection description"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[#14110E]">
                    <input
                      type="checkbox"
                      checked={collectionComingSoon}
                      onChange={(e) => setCollectionComingSoon(e.target.checked)}
                      className="h-4 w-4 rounded border-[#DFD7C6]"
                    />
                    Coming soon (greyed out in the storefront menu, not yet
                    shoppable)
                  </label>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setCollectionView('list');
                        setCollectionName('');
                        setCollectionDescription('');
                        setCollectionComingSoon(false);
                      }}
                      className="flex-1 rounded-[10px] border border-[#DFD7C6] px-4 py-2 text-sm font-medium text-[#3F3830] hover:bg-[#EFEBE1]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={
                        collectionView === 'create'
                          ? handleCreateCollection
                          : handleUpdateCollection
                      }
                      disabled={!collectionName.trim() || isLoading}
                      className="btn_creators_solid flex-1 justify-center disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    </GridContainer>
  );
}
