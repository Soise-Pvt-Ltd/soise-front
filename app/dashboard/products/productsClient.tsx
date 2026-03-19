'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import GridContainer from '../gridContainer';
import { useDropzone } from 'react-dropzone';
import {
  ArrowLeftIcon,
  AdminUploadIcon,
  AdminSoundLevelsIcon,
  AdminPlusCircleIcon,
  CloseIconTags,
  AdminMoreVerticalIcon,
} from '@/components/icons';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  createCollection,
  updateCollection,
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

interface VariantData {
  id: string;
  files: MyFile[];
  existingMedia?: { id: string; url: string }[];
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
}: {
  variant: VariantData;
  index: number;
  onUpdate: (id: string, field: keyof VariantData, value: any) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  const [colorInput, setColorInput] = useState('');
  const SIZES = ['m', 'l', 'xl', '2xl'];

  const inputRef = useRef<HTMLInputElement>(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    multiple: false,
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        }),
      ) as MyFile[];
      onUpdate(variant.id, 'files', newFiles);
    },
  });

  const thumbs = variant.files.map((file) => (
    <div
      key={file.name}
      className="inline-flex h-24 w-24 rounded border border-gray-300 p-1"
    >
      <div className="flex min-w-0 overflow-hidden">
        <img
          src={file.preview}
          className="block h-full w-full object-cover"
          onLoad={() => {
            URL.revokeObjectURL(file.preview);
          }}
        />
      </div>
    </div>
  ));

  const existingThumbs = variant.existingMedia?.map((media) => (
    <div
      key={media.id}
      className="inline-flex h-24 w-24 rounded border border-gray-300 p-1"
    >
      <div className="flex min-w-0 overflow-hidden">
        <img src={media.url} className="block h-full w-full object-cover" />
      </div>
    </div>
  ));

  useEffect(() => {
    return () =>
      variant.files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [variant.files]);

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
                {(variant.files.length > 0 ||
                  (variant.existingMedia &&
                    variant.existingMedia.length > 0)) && (
                  <div className="mb-4 flex flex-wrap justify-center gap-2">
                    {existingThumbs}
                    {thumbs}
                  </div>
                )}
                <button
                  type="button"
                  className="flex items-center justify-center gap-x-[2.5px] rounded-[10px] border-2 border-[#0072BB] bg-[#B3D5EB33] p-[10px] text-sm font-semibold text-[#0072BB]"
                >
                  <AdminUploadIcon /> Upload Image
                </button>
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
            </div>
            <div>
              <label className="adminsolidlabel">Product price</label>
              <input
                type="number"
                value={variant.price}
                onChange={(e) => onUpdate(variant.id, 'price', e.target.value)}
                className="adminsolid"
              />
            </div>
            <div>
              <label className="adminsolidlabel">Available stock</label>
              <input
                type="number"
                value={variant.stock}
                onChange={(e) => onUpdate(variant.id, 'stock', e.target.value)}
                className="adminsolid"
              />
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(
    null,
  );

  const mapProducts = (data: any[]): Product[] => {
    return (
      data?.map((product) => ({
        id: product.id,
        name: product.name,
        image: product.sample_variants?.[0]?.media?.[0]?.url || '',
        status: product.status === 'active' ? 'live' : 'draft',
        inventory: product.total_stock,
        outOfStock:
          product.sample_variants?.filter((v: any) => v.stock <= 0).length || 0,
        created_at: product.created_at,
      })) || []
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
      files: [],
      existingMedia: [],
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

  // Server-side filtering effect
  useEffect(() => {
    const fetchData = async () => {
      if (!fetchServerData) return;
      setIsLoading(true);
      try {
        const result = await fetchServerData(
          pagination.limit,
          0, // Reset to first page on filter change
          '',
          selectedPeriod,
        );
        if (result.success) {
          rawDataRef.current = result.products.data || [];
          setProducts(mapProducts(result.products.data));
          if (result.meta?.pagination) {
            setPagination(result.meta.pagination);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedPeriod]);

  const handlePageChange = async (newOffset: number) => {
    if (!fetchServerData) return;
    setIsLoading(true);
    try {
      const result = await fetchServerData(
        pagination.limit,
        newOffset,
        '',
        selectedPeriod,
      );
      if (result.success) {
        rawDataRef.current = result.products.data || [];
        setProducts(mapProducts(result.products.data));
        if (result.meta?.pagination) {
          setPagination(result.meta.pagination);
        }
      }
    } catch (error) {
      console.error('Error changing page:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    let matchesTab = true;
    if (activeTab === 'active') matchesTab = product.status === 'live';
    if (activeTab === 'draft') matchesTab = product.status === 'draft';

    // Date filtering is now handled server-side via selectedPeriod
    return matchesTab;
  });

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        files: [],
        existingMedia: [],
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
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
    }
  };

  const updateVariant = (id: string, field: keyof VariantData, value: any) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
  };

  const resetForm = () => {
    setEditingId(null);
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
        files: [],
        existingMedia: [],
        selectedSizes: [],
        colors: [],
        price: '',
        stock: '',
      },
    ]);
  };

  const handleEditClick = (id: string) => {
    const product = rawDataRef.current.find((p: any) => p.id === id);
    if (!product) return;

    setEditingId(id);
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
              files: [],
              existingMedia: v.media || [],
              selectedSizes: parsedSizes.map((s: string) => s.toLowerCase()),
              colors: parsedColors,
              price: v.price ?? '',
              stock: v.stock ?? '',
            };
          })
        : [
            {
              id: Math.random().toString(36).substr(2, 9),
              files: [],
              existingMedia: [],
              selectedSizes: [],
              colors: [],
              price: '',
              stock: '',
            },
          ],
    );

    setShowAddProduct(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this product? This action cannot be undone.',
      )
    ) {
      setActiveActionMenuId(null);
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('id', id);

      const result = await deleteProduct(formData);

      if (result.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        showToast('success', 'Product deleted successfully');
      } else {
        showToast('error', `Failed to delete product: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      showToast('error', 'Failed to delete product');
    } finally {
      setIsLoading(false);
      setActiveActionMenuId(null);
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
    if (!productName.trim()) {
      showToast('error', 'Please enter a product name');
      return;
    }

    if (!basePrice || Number(basePrice) <= 0) {
      showToast('error', 'Please enter a valid product price');
      return;
    }

    if (!category) {
      showToast('error', 'Please select a collection');
      return;
    }

    if (variants.length === 0) {
      showToast('error', 'Please add at least one variant');
      return;
    }

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (v.selectedSizes.length === 0) {
        showToast('error', `Variant ${i + 1}: Please select a size`);
        return;
      }
      if (v.colors.length === 0) {
        showToast('error', `Variant ${i + 1}: Please add a color`);
        return;
      }
      if (!v.stock || Number(v.stock) < 0) {
        showToast('error', `Variant ${i + 1}: Please enter a valid stock quantity`);
        return;
      }
    }

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

      const variantsToSend = await Promise.all(
        variants.map(async (v) => {
          let mediaIds: string[] = [];
          let hasImageChanged = false;
          let existingMediaIds: string[] = [];

          if (editingId && v.existingMedia && v.existingMedia.length > 0) {
            existingMediaIds = v.existingMedia.map((m) => m.id);

            if (v.files.length > 0) {
              hasImageChanged = true;

              for (const media of v.existingMedia) {
                const deleteResult = await deleteFile(media.id);
                if (!deleteResult.success) {
                  console.error(
                    `Failed to delete media ${media.id}:`,
                    deleteResult.error,
                  );
                  throw new Error(
                    `Failed to delete existing image: ${deleteResult.error}`,
                  );
                }
              }

              const uploadedIds = [];
              for (const file of v.files) {
                const fileData = new FormData();
                fileData.append('file', file);
                const res = await uploadFile(fileData);
                if (!res?.success) {
                  console.error('Upload failed:', res?.error);
                  throw new Error(
                    `Failed to upload new image: ${res?.error || 'Unknown error'}`,
                  );
                }
                if (res.data?.id) {
                  uploadedIds.push(res.data.id);
                }
              }
              mediaIds = uploadedIds;
            } else {
              mediaIds = existingMediaIds;
            }
          } else if (v.files.length > 0) {
            hasImageChanged = true;
            const uploadedIds = [];
            for (const file of v.files) {
              const fileData = new FormData();
              fileData.append('file', file);
              const res = await uploadFile(fileData);
              if (!res?.success) {
                console.error('Upload failed:', res?.error);
                throw new Error(
                  `Failed to upload image: ${res?.error || 'Unknown error'}`,
                );
              }
              if (res.data?.id) {
                uploadedIds.push(res.data.id);
              }
            }
            mediaIds = uploadedIds;
          }

          const { files, existingMedia, ...rest } = v;

          return {
            ...rest,
            price: Number(rest.price) || 0,
            stock: Number(rest.stock) || 0,
            media: mediaIds,
            newMedia: mediaIds,
            existingMedia: hasImageChanged
              ? []
              : existingMediaIds.map((id) => ({ id })),
            hasImageChanged,
          };
        }),
      );

      formData.append('variants', JSON.stringify(variantsToSend));

      if (editingId) {
        formData.append('id', editingId);
        const result = await updateProduct(formData);

        if (result.success) {
          showToast('success', 'Product updated successfully');
          setShowAddProduct(false);
          resetForm();
          setSelectedPeriod('All Time');
        } else {
          showToast('error', `Failed to update product: ${result.error || 'Unknown error'}`);
        }
      } else {
        const result = await createProduct(formData);

        if (result.success) {
          showToast('success', 'Product created successfully');
          setShowAddProduct(false);
          resetForm();
          setSelectedPeriod('All Time');
        } else {
          showToast('error', `Failed to create product: ${result.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      showToast('error', `Failed to save product: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Error saving product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GridContainer user={user}>
      <>
        <div className="px-[16px]">
          {showAddProduct ? (
            <div className="flex items-center justify-between py-[22px] !text-[#121212]">
              <div
                className="hover: flex cursor-pointer items-center gap-x-2"
                onClick={() => {
                  setShowAddProduct(false);
                  resetForm();
                }}
              >
                <ArrowLeftIcon />
                <span className="font-medium">
                  {editingId ? 'Edit product' : 'Add product'}
                </span>
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
                <div className="flex items-center gap-8">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'active', label: 'Active' },
                    { id: 'draft', label: 'Draft' },
                  ].map(({ id, label }: any) => {
                    const isActive = activeTab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`relative cursor-pointer pb-4 text-[14px] transition-all duration-200 ease-in-out ${
                          isActive
                            ? 'text-gray-900'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {label}
                        {isActive && (
                          <span className="absolute top-full left-0 z-10 h-[2px] w-full translate-y-[-2px] rounded-t-sm bg-gray-900 sm:translate-y-[5px]" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-x-2 pb-4">
                  <div className="relative flex items-center">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="btn_admin_outline flex items-center gap-x-[2px]"
                    >
                      <AdminSoundLevelsIcon />
                      {selectedPeriod}
                    </button>
                    {isDropdownOpen && (
                      <div className="ring-opacity-6 absolute top-full right-0 z-30 mt-2 w-32 origin-top-right rounded-md bg-white ring-1 ring-gray-200">
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
                      </div>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <button
                      onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                      className="btn_admin_outline flex items-center gap-x-[2px]"
                    >
                      <AdminPlusCircleIcon />
                      Add
                    </button>
                    {isAddDropdownOpen && (
                      <div className="ring-opacity-6 absolute top-full right-0 z-30 mt-2 w-40 origin-top-right rounded-md bg-white ring-1 ring-gray-200">
                        <div className="py-1">
                          <button
                            className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#AFB1B0] hover:bg-gray-100 hover:text-gray-400"
                            onClick={() => {
                              setIsAddDropdownOpen(false);
                              setShowCollectionModal(true);
                            }}
                          >
                            Add Collection
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
                      </div>
                    )}
                  </div>
                </div>
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
                    {filteredProducts.map((product, index, arr) => (
                      <tr key={product.id}>
                        <td className="td">
                          <div className="flex items-center gap-x-3">
                            {product?.image && (
                              <img
                                src={product.image}
                                alt={product.name || 'Product image'}
                                className="size-8 rounded-md object-cover"
                              />
                            )}
                            <div className="truncate whitespace-nowrap">
                              {product.name}
                            </div>
                          </div>
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
                        <td className="td">{product.inventory}</td>
                        <td className="td">{product.outOfStock}</td>
                        <td className="td">
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveActionMenuId(
                                  activeActionMenuId === product.id
                                    ? null
                                    : product.id,
                                )
                              }
                              className="flex size-[25px] cursor-pointer items-center justify-center rounded-[6px] bg-[#F5F5F5]"
                            >
                              <AdminMoreVerticalIcon />
                            </button>
                            {activeActionMenuId === product.id && (
                              <div
                                className={`ring-opacity-5 absolute right-0 z-60 w-32 origin-top-right rounded-md bg-white text-sm shadow-md ring-1 ring-[#F5F5F5] focus:outline-none ${
                                  index === arr.length - 1
                                    ? 'bottom-full mb-2'
                                    : 'mt-2'
                                }`}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      handleEditClick(product.id);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteProduct(product.id)
                                    }
                                    className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-red-700 hover:bg-gray-100"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
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
                          onChange={(e) => setIsLive(e.target.checked)}
                          className="peer sr-only"
                        />

                        <div className="relative h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-[#32AC5B] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:after:translate-x-5" />
                      </label>
                    </div>

                    {/* Name + Price */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="adminsolidlabel">Product name</label>
                        <input
                          type="text"
                          className="adminsolid"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="adminsolidlabel">Product price</label>
                        <input
                          type="number"
                          className="adminsolid"
                          value={basePrice}
                          onChange={(e) => setBasePrice(e.target.value)}
                        />
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
                        onChange={(e) => setProductDescription(e.target.value)}
                      />
                    </div>

                    {/* Selects */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className="adminsolidlabel">Collection</label>
                        <select
                          className="adminsolid"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="" disabled>
                            Select Collection
                          </option>
                          {collections?.map((collection) => (
                            <option key={collection.id} value={collection.id}>
                              {collection.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="adminsolidlabel">Material</label>
                        <select
                          className="adminsolid"
                          value={material}
                          onChange={(e) => setMaterial(e.target.value)}
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
                          onChange={(e) => setFitType(e.target.value)}
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
                          onChange={(e) => setSeason(e.target.value)}
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
                        onChange={(e) => setCareInstructions(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between px-[16px] pt-[24px] pb-[22px] !text-[#121212]">
                <div
                  className="hover: flex cursor-pointer items-center gap-x-2"
                  onClick={() => setShowAddProduct(false)}
                >
                  <span className="font-medium">Product Variant</span>
                </div>
                <button
                  onClick={addVariant}
                  className="btn_creators_solid_no_height p-[10px]"
                >
                  + Add Variant
                </button>
              </div>
              <div className="space-y-[24px]">
                {variants.map((variant, index) => (
                  <VariantItem
                    key={variant.id}
                    variant={variant}
                    index={index}
                    onUpdate={updateVariant}
                    onRemove={removeVariant}
                    canRemove={variants.length > 1}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveProduct}
              disabled={isLoading}
              className={`btn_creators_solid mt-[24px] ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {isLoading
                ? 'Saving...'
                : editingId
                  ? 'Update Product'
                  : 'Save Product'}
            </button>
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
