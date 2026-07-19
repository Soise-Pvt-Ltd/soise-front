'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import GridContainer from '../gridContainer';
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
  const SIZES = ['m', 'l', 'xl', '2xl'];

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
        setColorInput('');
      }
    } else if (
      e.key === 'Backspace' &&
      colorInput === '' &&
      variant.colors.length > 0
    ) {
      onUpdate(variant.id, 'colors', []);
    }
  };

  const removeColor = (colorToRemove: string) => {
    onUpdate(variant.id, 'colors', []);
  };

  return (
    <div className="rounded-[20px] bg-white p-[24px] text-[#121212] md:col-span-3">
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
              <div className="flex h-full cursor-pointer flex-col items-center justify-center rounded-lg border-1 border-dashed border-[#DADDDC] bg-gray-50 p-6 text-center">
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
                            ? 'border-[#0072BB] border-dashed'
                            : 'border-gray-300'
                        }`}
                        title="Drag to reorder"
                      >
                        <div className="flex min-w-0 overflow-hidden rounded-sm">
                          <img
                            src={m.url}
                            className="pointer-events-none block h-full w-full object-cover"
                            onLoad={() => {
                              if (m.kind === 'new') URL.revokeObjectURL(m.url);
                            }}
                          />
                        </div>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] font-medium text-white">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMediaItem(m.key);
                          }}
                          className="absolute -top-2 -right-2 flex size-5 cursor-pointer items-center justify-center rounded-full bg-black text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
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
                  className="flex items-center justify-center gap-x-[2.5px] rounded-[10px] border-2 border-[#0072BB] bg-[#B3D5EB33] p-[10px] text-sm font-semibold text-[#0072BB] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <AdminUploadIcon /> Upload Image
                </button>
                <p className="mt-2 text-xs text-[#8E8E93]">
                  {variant.media.length}/{MAX_VARIANT_MEDIA} photos
                  {remainingSlots <= 0 ? ' - limit reached' : ''}
                </p>
                {variant.media.length === 0 && (
                  <p className="mt-1 text-xs text-[#8E8E93]">
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
                    className={`flex h-[40px] w-[54px] cursor-pointer items-center justify-center rounded-[2px] border text-[11px] uppercase transition-colors ${variant.selectedSizes.includes(size) ? 'border-3 border-[#0072BB] bg-[#F5F5F5]' : 'border-[#8E8E93] bg-[#F5F5F5]'}`}
                  >
                    {size}
                  </div>
                ))}
              </div>
              {errors?.size && (
                <p className="mt-1 flex items-center gap-x-1 text-[12px] text-[#991C00]">
                  <AdminExclamationIcon /> {errors.size}
                </p>
              )}
            </div>
            <div>
              <label className="adminsolidlabel">
                Color (press enter to add color)
              </label>
              <div
                className={`adminsolid flex flex-wrap items-center gap-x-2 py-2 ${
                  variant.colors.length > 0 ? '!h-auto px-2' : 'px-3'
                }`}
                onClick={() => inputRef.current?.focus()}
              >
                {variant.colors.map((color) => (
                  <div
                    key={color}
                    className="flex items-center gap-[4px] rounded-sm bg-white p-[7px] text-[11px]"
                  >
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[#424242] capitalize">{color}</span>
                    <button
                      type="button"
                      onClick={() => removeColor(color)}
                      className="cursor-pointer text-gray-500 hover:text-gray-800"
                      aria-label={`Remove ${color}`}
                    >
                      <CloseIconTags />
                    </button>
                  </div>
                ))}

                <input
                  ref={inputRef}
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={handleColorKeyDown}
                  className="min-w-[120px] flex-1 border-none bg-transparent p-0 text-[12px] !outline-none focus:ring-0"
                />
              </div>
              {errors?.color && (
                <p className="mt-1 flex items-center gap-x-1 text-[12px] text-[#991C00]">
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
                className={`adminsolid ${errors?.stock ? '!ring-2 !ring-[#991C00]' : ''}`}
                aria-invalid={!!errors?.stock}
              />
              {errors?.stock && (
                <p className="mt-1 flex items-center gap-x-1 text-[12px] text-[#991C00]">
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
  count: number;
}

interface Meta {
  pagination: Pagination;
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
  const [actionMenuOpensUp, setActionMenuOpensUp] = useState(false);

  // List controls
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get('search') ?? '',
  );
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get('search') ?? '',
  );
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
      price: '',
      stock: '',
    },
  ]);

  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const periodOptions = ['All Time', 'Today', 'Last 7 Days', 'Last 30 Days'];
  const [pagination, setPagination] = useState<Pagination>(
    initialMeta?.pagination || { limit: 50, offset: 0, count: 0 },
  );

  // Debounce the search input into the committed search query (300ms).
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Server-side filtering effect (period + search). Skip the very first run
  // so we don't refetch data that was already provided by the server.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const fetchData = async () => {
      if (!fetchServerData) return;
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
        if (result?.success) {
          rawDataRef.current = result.products?.data || [];
          setProducts(mapProducts(result.products?.data));
          if (result.meta?.pagination) {
            setPagination(result.meta.pagination);
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
      if (result?.success) {
        rawDataRef.current = result.products?.data || [];
        setProducts(mapProducts(result.products?.data));
        if (result.meta?.pagination) {
          setPagination(result.meta.pagination);
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
  useEffect(() => {
    const anyOpen =
      isDropdownOpen || isAddDropdownOpen || activeActionMenuId !== null;
    if (!anyOpen) return;

    const closeAll = () => {
      setIsDropdownOpen(false);
      setIsAddDropdownOpen(false);
      setActiveActionMenuId(null);
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
  }, [isDropdownOpen, isAddDropdownOpen, activeActionMenuId]);

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

  // Per-tab counts (search/period are already applied server-side).
  const tabCounts = useMemo(() => {
    const safe = Array.isArray(products) ? products : [];
    return {
      all: safe.length,
      active: safe.filter((p) => p.status === 'live').length,
      draft: safe.filter((p) => p.status === 'draft').length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const safe = Array.isArray(products) ? products : [];
    const byTab = safe.filter((product) => {
      if (activeTab === 'active') return product.status === 'live';
      if (activeTab === 'draft') return product.status === 'draft';
      return true; // 'all'
    });

    const sorted = [...byTab].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'price': {
          const pa = a.minVariantPrice ?? a.basePrice;
          const pb = b.minVariantPrice ?? b.basePrice;
          return pa - pb;
        }
        case 'stock':
          return a.inventory - b.inventory;
        case 'newest':
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });
    return sorted;
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
      const result = await createCollection(formData);

      if (result.success) {
        showToast('success', 'Collection created successfully');
        setShowCollectionModal(false);
        setCollectionName('');
        setCollectionDescription('');
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
      const result = await updateCollection(formData);

      if (result.success) {
        showToast('success', 'Collection updated successfully');
        setShowCollectionModal(false);
        setCollectionName('');
        setCollectionDescription('');
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
            <div className="sticky top-0 z-40 -mx-[16px] mb-[8px] flex flex-col gap-3 border-b border-[#AEAEB266]/40 bg-[#f9f9f9]/95 px-[16px] py-[16px] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between !text-[#121212]">
              <div className="flex items-center gap-x-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-x-2 rounded-[10px] border border-[#E5E5E5] bg-white px-3 text-sm font-medium outline-none transition-colors hover:bg-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-[#0072BB]"
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
                        className="size-10 rounded-[8px] border border-[#E5E5E5] object-cover"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-[8px] border border-[#E5E5E5] bg-[#F5F5F5] text-[#AFB1B0]">
                        <AdminEditIcon />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-x-2">
                        <span className="rounded-full bg-[#C0CBF2] px-2 py-0.5 text-[11px] font-semibold text-[#0072BB] uppercase">
                          Editing
                        </span>
                      </div>
                      <div className="mt-0.5 max-w-[260px] truncate text-[15px] font-semibold">
                        {editingProductMeta?.name || productName || 'Product'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-[18px] font-semibold">Add product</span>
                )}
              </div>
            </div>
          ) : (
            <div className="py-[22px]">
              <span className="text-[20px] font-medium">Products</span>
            </div>
          )}
        </div>

        {!showAddProduct && (
          <div className="">
            <div className="relative rounded-t-[20px] border-b border-[#AEAEB266]/40 bg-white px-[24px] pt-[24px] text-[#121212]">
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
                        className={`relative flex cursor-pointer items-center gap-x-2 pb-4 text-[14px] outline-none transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-[#0072BB] ${
                          isActive
                            ? 'text-gray-900'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {label}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            isActive
                              ? 'bg-[#121212] text-white'
                              : 'bg-[#F5F5F5] text-[#AFB1B0]'
                          }`}
                        >
                          {count}
                        </span>
                        {isActive && (
                          <span className="absolute top-full left-0 z-10 h-[2px] w-full translate-y-[-2px] rounded-t-sm bg-gray-900 sm:translate-y-[5px]" />
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
                      className="btn_admin_outline flex items-center gap-x-[2px] focus-visible:ring-2 focus-visible:ring-[#0072BB]"
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
                          className="ring-opacity-6 absolute top-full right-0 z-30 mt-2 w-32 origin-top-right rounded-md bg-white ring-1 ring-gray-200"
                        >
                          <div className="py-1">
                            {periodOptions.map((option) => (
                              <button
                                key={option}
                                onClick={() => {
                                  setSelectedPeriod(option);
                                  setIsDropdownOpen(false);
                                }}
                                className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#AFB1B0] hover:bg-gray-100 hover:text-gray-400"
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
                      className="btn_admin_outline flex items-center gap-x-[2px] focus-visible:ring-2 focus-visible:ring-[#0072BB]"
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
                          className="ring-opacity-6 absolute top-full right-0 z-30 mt-2 w-40 origin-top-right rounded-md bg-white ring-1 ring-gray-200"
                        >
                          <div className="py-1">
                            <button
                              className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#AFB1B0] hover:bg-gray-100 hover:text-gray-400"
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
                              className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#AFB1B0] hover:bg-gray-100 hover:text-gray-400"
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
            <div className="flex flex-col gap-3 bg-white px-[24px] pt-[20px] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex h-[44px] w-full items-center gap-x-2 rounded-[10px] bg-[#F5F5F5] px-[15px] sm:max-w-[320px]">
                <AdminSearchIcon />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search products..."
                  aria-label="Search products"
                  className="w-full border-0 bg-transparent text-[14px] placeholder:text-[#9A9A9A] outline-none focus:ring-0"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    aria-label="Clear search"
                    className="flex size-6 cursor-pointer items-center justify-center text-[#9A9A9A] hover:text-[#35373C]"
                  >
                    <CloseIconTags />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-x-2">
                <label
                  htmlFor="sort-products"
                  className="text-[13px] text-[#AFB1B0]"
                >
                  Sort by
                </label>
                <select
                  id="sort-products"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="h-[44px] cursor-pointer rounded-[10px] border-0 bg-[#F5F5F5] px-3 text-[13px] text-[#35373C] outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#0072BB]"
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
              className="rounded-b-[20px] bg-white px-[24px]"
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
                              <div className="size-8 animate-pulse rounded-md bg-[#F0F0F0]" />
                              <div className="h-3 w-40 animate-pulse rounded bg-[#F0F0F0]" />
                            </div>
                          </td>
                          <td className="td">
                            <div className="h-3 w-16 animate-pulse rounded bg-[#F0F0F0]" />
                          </td>
                          <td className="td">
                            <div className="h-5 w-14 animate-pulse rounded-full bg-[#F0F0F0]" />
                          </td>
                          <td className="td">
                            <div className="h-3 w-8 animate-pulse rounded bg-[#F0F0F0]" />
                          </td>
                          <td className="td">
                            <div className="h-3 w-8 animate-pulse rounded bg-[#F0F0F0]" />
                          </td>
                          <td className="td">
                            <div className="size-[25px] animate-pulse rounded-[6px] bg-[#F0F0F0]" />
                          </td>
                        </tr>
                      ))}

                    {/* Empty state per tab */}
                    {!isLoading && filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="td">
                          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-[#F5F5F5] text-[#AFB1B0]">
                              <AdminSearchIcon />
                            </div>
                            <p className="text-[15px] font-medium text-[#35373C]">
                              {searchQuery
                                ? `No products match "${searchQuery}"`
                                : activeTab === 'active'
                                  ? 'No active products yet'
                                  : activeTab === 'draft'
                                    ? 'No draft products'
                                    : 'No products yet'}
                            </p>
                            <p className="max-w-xs text-[13px] text-[#AFB1B0]">
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
                                className="mt-2 flex h-[44px] cursor-pointer items-center gap-x-1 rounded-[10px] bg-[#0072BB] px-4 text-[13px] font-semibold text-white outline-none transition-colors hover:bg-[#005a94] focus-visible:ring-2 focus-visible:ring-[#0072BB]"
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
                        <tr key={product.id} className="group">
                          <td className="td">
                            <div className="flex items-center gap-x-3">
                              {product?.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name || 'Product image'}
                                  className="size-9 rounded-md object-cover"
                                />
                              ) : (
                                <div className="flex size-9 items-center justify-center rounded-md bg-[#F5F5F5] text-[10px] text-[#AFB1B0]">
                                  N/A
                                </div>
                              )}
                              <div className="max-w-[220px] truncate whitespace-nowrap font-medium text-[#121212]">
                                {product.name}
                              </div>
                            </div>
                          </td>
                          <td className="td whitespace-nowrap">
                            {product.priceVaries && (
                              <span className="mr-1 text-[#AFB1B0]">from</span>
                            )}
                            {formatPrice(displayPrice)}
                          </td>
                          <td className="td">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                                product.status === 'live'
                                  ? 'bg-[#CCEAD6] text-[#32AC5B]'
                                  : 'bg-[#F5F1CC] text-[#D8C732]'
                              }`}
                            >
                              {product.status}
                            </span>
                          </td>
                          <td className="td">
                            <div className="flex items-center gap-x-2">
                              <span>{product.inventory}</span>
                              {isOutOfStock ? (
                                <span className="rounded-full bg-[#E5C6BF] px-2 py-0.5 text-[10px] font-semibold text-[#991C00] uppercase">
                                  Out of stock
                                </span>
                              ) : isLowStock ? (
                                <span className="rounded-full bg-[#F5E6CC] px-2 py-0.5 text-[10px] font-semibold text-[#B26A00] uppercase">
                                  Low
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="td">{product.outOfStock}</td>
                          <td className="td">
                            <div className="relative" data-menu-root>
                              <motion.button
                                onClick={(e) => {
                                  if (activeActionMenuId === product.id) {
                                    setActiveActionMenuId(null);
                                    return;
                                  }
                                  const rect =
                                    e.currentTarget.getBoundingClientRect();
                                  const MENU_HEIGHT = 96; // ~2 items, roughly
                                  setActionMenuOpensUp(
                                    window.innerHeight - rect.bottom <
                                      MENU_HEIGHT &&
                                      rect.top > MENU_HEIGHT,
                                  );
                                  setActiveActionMenuId(product.id);
                                }}
                                whileTap={{ scale: 0.88 }}
                                aria-haspopup="menu"
                                aria-expanded={activeActionMenuId === product.id}
                                aria-label={`Actions for ${product.name}`}
                                className="flex size-[36px] cursor-pointer items-center justify-center rounded-[8px] bg-[#F5F5F5] outline-none transition-colors hover:bg-[#EBEBEB] focus-visible:ring-2 focus-visible:ring-[#0072BB]"
                              >
                                <AdminMoreVerticalIcon />
                              </motion.button>
                              <AnimatePresence>
                                {activeActionMenuId === product.id && (
                                  <motion.div
                                    role="menu"
                                    initial={{ opacity: 0, scale: 0.92, y: actionMenuOpensUp ? 6 : -6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.92, y: actionMenuOpensUp ? 6 : -6 }}
                                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                                    className={`ring-opacity-5 absolute right-0 z-60 w-32 origin-top-right rounded-md bg-white text-sm shadow-md ring-1 ring-[#F5F5F5] focus:outline-none ${
                                      actionMenuOpensUp ? 'bottom-full mb-2' : 'mt-2'
                                    }`}
                                  >
                                    <div className="py-1">
                                      <button
                                        role="menuitem"
                                        onClick={() => {
                                          handleEditClick(product.id);
                                          setActiveActionMenuId(null);
                                        }}
                                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 outline-none hover:bg-gray-100 focus-visible:bg-gray-100"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        role="menuitem"
                                        onClick={() =>
                                          requestDeleteProduct(product.id)
                                        }
                                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-red-700 outline-none hover:bg-gray-100 focus-visible:bg-gray-100"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
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
            {pagination.count > 0 && (
              <div className="flex items-center justify-between px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() =>
                      handlePageChange(pagination.offset - pagination.limit)
                    }
                    disabled={pagination.offset === 0 || isLoading}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      handlePageChange(pagination.offset + pagination.limit)
                    }
                    disabled={
                      pagination.offset + pagination.limit >=
                        pagination.count || isLoading
                    }
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {pagination.offset + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(
                          pagination.offset + pagination.limit,
                          pagination.count,
                        )}
                      </span>{' '}
                      of <span className="font-medium">{pagination.count}</span>{' '}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="isolate inline-flex -space-x-px rounded-md shadow-xs"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() =>
                          handlePageChange(pagination.offset - pagination.limit)
                        }
                        disabled={pagination.offset === 0 || isLoading}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
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
                            pagination.count || isLoading
                        }
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
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
                <div className="rounded-[20px] bg-white p-[24px] text-[#121212]">
                  <div className="space-y-[24px]">
                    {/* Header */}
                    <div className="flex justify-between pb-[24px]">
                      <div className="capitalize">product information</div>
                      <label
                        htmlFor="live-toggle"
                        className="relative inline-flex cursor-pointer items-center gap-x-2"
                      >
                        <span className="text-[14px] text-[#121212]">Live</span>

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

                        <div className="relative h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-[#32AC5B] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:after:translate-x-5" />
                      </label>
                    </div>

                    {/* Name + Price */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="product-name" className="adminsolidlabel">
                          Product name <span className="text-[#991C00]">*</span>
                        </label>
                        <input
                          id="product-name"
                          ref={nameInputRef}
                          type="text"
                          className={`adminsolid ${fieldErrors.productName ? '!ring-2 !ring-[#991C00]' : ''}`}
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
                          <p className="mt-1 flex items-center gap-x-1 text-[12px] text-[#991C00]">
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
                          <span className="text-[#991C00]">*</span>
                        </label>
                        <input
                          id="product-price"
                          type="number"
                          min="0"
                          className={`adminsolid ${fieldErrors.basePrice ? '!ring-2 !ring-[#991C00]' : ''}`}
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
                          <p className="mt-1 flex items-center gap-x-1 text-[12px] text-[#991C00]">
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
                          Collection <span className="text-[#991C00]">*</span>
                        </label>
                        <select
                          className={`adminsolid ${fieldErrors.category ? '!ring-2 !ring-[#991C00]' : ''}`}
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
                          <p className="mt-1 flex items-center gap-x-1 text-[12px] text-[#991C00]">
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
              <div className="flex items-center justify-between px-[16px] pt-[24px] pb-[22px] !text-[#121212]">
                <span className="font-medium">Product Variant</span>
                <button
                  type="button"
                  onClick={addVariant}
                  className="btn_creators_solid_no_height p-[10px] focus-visible:ring-2 focus-visible:ring-[#0072BB]"
                >
                  + Add Variant
                </button>
              </div>
              {fieldErrors.variants && (
                <p className="mb-3 flex items-center gap-x-1 px-[16px] text-[12px] text-[#991C00]">
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
              className={`btn_creators_solid mt-[24px] flex items-center justify-center gap-x-2 focus-visible:ring-2 focus-visible:ring-[#0072BB] ${isSaving ? 'cursor-not-allowed opacity-60' : ''}`}
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
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            onClick={() => {
              if (!isLoading) setPendingDeleteId(null);
            }}
          >
            <div
              className="w-full max-w-sm rounded-[20px] bg-white p-[24px] shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center gap-x-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-[#E5C6BF]">
                  <AdminExclamationIcon />
                </div>
                <h2
                  id="delete-dialog-title"
                  className="text-lg font-semibold text-[#121212]"
                >
                  Delete product?
                </h2>
              </div>
              <p className="mb-6 text-sm text-[#6B6B6B]">
                {pendingDeleteProduct?.name
                  ? `“${pendingDeleteProduct.name}” and its variants will be permanently removed. This action cannot be undone.`
                  : 'This product and its variants will be permanently removed. This action cannot be undone.'}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(null)}
                  className="flex-1 rounded-[10px] border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(pendingDeleteId)}
                  disabled={isLoading}
                  className="flex-1 rounded-[10px] bg-[#991C00] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A1600] disabled:cursor-not-allowed disabled:opacity-60"
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
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-collection-dialog-title"
            onClick={() => {
              if (!isLoading) setPendingDeleteCollectionId(null);
            }}
          >
            <div
              className="w-full max-w-sm rounded-[20px] bg-white p-[24px] shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center gap-x-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-[#E5C6BF]">
                  <AdminExclamationIcon />
                </div>
                <h2
                  id="delete-collection-dialog-title"
                  className="text-lg font-semibold text-[#121212]"
                >
                  Delete collection?
                </h2>
              </div>
              <p className="mb-6 text-sm text-[#6B6B6B]">
                This collection will be permanently removed. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPendingDeleteCollectionId(null)}
                  className="flex-1 rounded-[10px] border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCollection(pendingDeleteCollectionId)}
                  disabled={isLoading}
                  className="flex-1 rounded-[10px] bg-[#991C00] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A1600] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading && <Spinner />}
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showCollectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[20px] bg-white p-[24px] shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-medium capitalize">
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
                        className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0"
                      >
                        <span className="text-[#121212]">
                          {collection.name}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingCollectionId(collection.id);
                              setCollectionName(collection.name);
                              setCollectionDescription(
                                collection.description || '',
                              );
                              setCollectionView('edit');
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setPendingDeleteCollectionId(collection.id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!collections || collections.length === 0) && (
                      <p className="text-sm text-[#8E8E93]">
                        No collections found.
                      </p>
                    )}
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setCollectionName('');
                        setCollectionDescription('');
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
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setCollectionView('list');
                        setCollectionName('');
                        setCollectionDescription('');
                      }}
                      className="flex-1 rounded-[10px] border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
