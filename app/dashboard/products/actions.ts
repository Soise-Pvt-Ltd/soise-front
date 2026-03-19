'use server';
import { cookies } from 'next/headers';
import { getUserInfo } from '../actions';

export async function fetchProducts(
  limit = 50,
  offset = 0,
  search = '',
  period = 'All Time',
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return {
      success: false,
      data: [],
      meta: { pagination: { limit, offset, count: 0 } },
    };
  }

  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (search) queryParams.append('search', search);

  if (period && period !== 'All Time') {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    let startDate;

    switch (period) {
      case 'Last 7 Days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'Last 30 Days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case 'Last 90 Days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        break;
    }

    if (startDate) {
      queryParams.append('startDate', startDate.toISOString());
    }
  }

  const resCollections = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/products/collections`,
    {
      credentials: 'include',
      cache: 'no-store',
    },
  );
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/products?${queryParams.toString()}`,
    {
      credentials: 'include',
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }

  const data = await res.json();
  const collectionsData = resCollections.ok
    ? await resCollections.json()
    : { data: [] };

  // Fetch user data
  const userResult = await getUserInfo();
  const user =
    userResult.success && 'user' in userResult ? userResult.user : null;

  return {
    success: Boolean(data.success),
    products: data,
    collections: collectionsData,
    user: user,
    meta: data.meta || { pagination: { limit, offset, count: 0 } },
  };
}

// Helper to delete media from storage
async function deleteMediaFromStorage(mediaId: string, accessToken: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/media/${mediaId}`,
      {
        method: 'DELETE',
        headers: {
          Cookie: `access_token=${accessToken}`,
        },
      },
    );
    return response.ok;
  } catch (error) {
    console.error('Error deleting media from storage:', error);
    return false;
  }
}

// ✅ FIXED: Helper to detach media from variant with mediaId parameter
async function detachMediaFromVariant(
  productId: string,
  variantId: string,
  accessToken: string,
  mediaId: string,
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/products/${productId}/variants/${variantId}/media/${mediaId}`,
      {
        method: 'DELETE',
        headers: {
          Cookie: `access_token=${accessToken}`,
        },
      },
    );
    return response.ok;
  } catch (error) {
    console.error('Error detaching media from variant:', error);
    return false;
  }
}

// Helper to attach media to variant
async function attachMediaToVariant(
  productId: string,
  variantId: string,
  mediaIds: string[],
  accessToken: string,
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/products/${productId}/variants/${variantId}/media`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `access_token=${accessToken}`,
        },
        body: JSON.stringify({ media_ids: mediaIds }),
      },
    );
    return response.ok;
  } catch (error) {
    console.error('Error attaching media to variant:', error);
    return false;
  }
}

// ✅ NEW: Helper to delete a variant
async function deleteVariantById(
  productId: string,
  variantId: string,
  accessToken: string,
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/products/${productId}/variants/${variantId}`,
      {
        method: 'DELETE',
        headers: {
          Cookie: `access_token=${accessToken}`,
        },
      },
    );
    return response.ok;
  } catch (error) {
    console.error('Error deleting variant:', error);
    return false;
  }
}

// ✅ NEW: Helper to get all variants of a product
async function getProductVariants(productId: string, accessToken: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/products/${productId}/variants`,
      {
        headers: {
          Cookie: `access_token=${accessToken}`,
        },
        cache: 'no-store',
      },
    );
    if (response.ok) {
      const data = await response.json();
      return data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching product variants:', error);
    return [];
  }
}

export async function createProduct(formData: FormData) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const rawFormData = {
    productName: formData.get('productName') as string,
    productDescription: formData.get('productDescription') as string,
    isLive: formData.get('isLive') === 'true',
    category: formData.get('category') as string,
    material: formData.get('material') as string,
    fitType: formData.get('fitType') as string,
    season: formData.get('season') as string,
    careInstructions: formData.get('careInstructions') as string,
    basePrice: formData.get('basePrice') as string,
    price: formData.get('price') as string,
    discountPercentage: formData.get('discountPercentage') as string,
    discountType: formData.get('discountType') as string,
    keywords: JSON.parse((formData.get('keywords') as string) || '[]'),
    variants: JSON.parse((formData.get('variants') as string) || '[]'),
  };

  const processedVariants = rawFormData.variants.map((variant: any) => {
    const { existingMedia, newMedia, hasImageChanged, ...rest } = variant;
    return { ...rest, media: newMedia || [] };
  });

  const finalData = {
    ...rawFormData,
    variants: processedVariants,
  };

  const productPayload = {
    name: finalData.productName,
    description: finalData.productDescription,
    base_price: Number(finalData.basePrice),
    material: finalData.material,
    fit_type: finalData.fitType,
    care_instructions: finalData.careInstructions,
    season: finalData.season,
    collection_id: finalData.category,
    status: finalData.isLive ? 'active' : 'draft',
    metadata: {},
  };

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/products`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `access_token=${accessToken}`,
    },
    body: JSON.stringify(productPayload),
  });

  const productResponse = await res.json();

  if (productResponse.success && productResponse.data?.id) {
    const productId = productResponse.data.id;

    for (const variant of processedVariants) {
      if (variant.colors && variant.selectedSizes) {
        for (const color of variant.colors) {
          for (const size of variant.selectedSizes) {
            const variantPayload = {
              color: color,
              size: size,
              stock: variant.stock,
              price: variant.price,
            };

            const variantRes = await fetch(
              `${process.env.NEXT_PUBLIC_BASE_URL}/products/${productId}/variants`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Cookie: `access_token=${accessToken}`,
                },
                body: JSON.stringify(variantPayload),
              },
            );

            const variantResponse = await variantRes.json();

            if (
              variantResponse.success &&
              variantResponse.data?.id &&
              variant.media?.length > 0
            ) {
              const mediaAttachRes = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/products/${productId}/variants/${variantResponse.data.id}/media`,
                {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Cookie: `access_token=${accessToken}`,
                  },
                  body: JSON.stringify({ media_ids: variant.media }),
                },
              );
              await mediaAttachRes.json();
            }
          }
        }
      }
    }
  }

  return productResponse;
}

export async function updateProduct(formData: FormData) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) {
    return { success: false, error: 'No access token found' };
  }

  const id = formData.get('id') as string;

  const rawFormData = {
    productName: formData.get('productName') as string,
    productDescription: formData.get('productDescription') as string,
    isLive: formData.get('isLive') === 'true',
    category: formData.get('category') as string,
    material: formData.get('material') as string,
    fitType: formData.get('fitType') as string,
    season: formData.get('season') as string,
    careInstructions: formData.get('careInstructions') as string,
    basePrice: formData.get('basePrice') as string,
    keywords: JSON.parse((formData.get('keywords') as string) || '[]'),
    variants: JSON.parse((formData.get('variants') as string) || '[]'),
  };

  const productPayload = {
    name: rawFormData.productName,
    description: rawFormData.productDescription,
    base_price: Number(rawFormData.basePrice),
    material: rawFormData.material,
    fit_type: rawFormData.fitType,
    care_instructions: rawFormData.careInstructions,
    season: rawFormData.season,
    collection_id: rawFormData.category,
    status: rawFormData.isLive ? 'active' : 'draft',
  };

  // Update the product
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/products/${id}`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `access_token=${accessToken}`,
      },
      body: JSON.stringify(productPayload),
    },
  );

  const productResponse = await res.json();

  if (productResponse.success) {
    for (const variant of rawFormData.variants) {
      // Handle image changes for existing variants
      if (variant.id && variant.id.length > 9 && variant.hasImageChanged) {
        // Step 1: Delete old media files from storage
        if (variant.existingMedia && variant.existingMedia.length > 0) {
          for (const media of variant.existingMedia) {
            // Detach media from variant
            const detached = await detachMediaFromVariant(
              id,
              variant.id,
              accessToken,
              media.id,
            );
            if (!detached) {
              console.error(
                `Failed to detach media from variant ${variant.id}`,
              );
            }

            const deleted = await deleteMediaFromStorage(media.id, accessToken);
            if (!deleted) {
              console.error(`Failed to delete media ${media.id} from storage`);
            }
          }
        }

        // ✅ FIXED: Step 3: Delete the variant after media is removed
        const variantDeleted = await deleteVariantById(
          id,
          variant.id,
          accessToken,
        );
        if (!variantDeleted) {
          console.error(`Failed to delete variant ${variant.id}`);
        }

        // Step 4: Create new variant with new media
        if (variant.colors && variant.selectedSizes) {
          for (const color of variant.colors) {
            for (const size of variant.selectedSizes) {
              const variantPayload = {
                color: color,
                size: size,
                stock: variant.stock,
                price: variant.price,
              };

              const variantRes = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/products/${id}/variants`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Cookie: `access_token=${accessToken}`,
                  },
                  body: JSON.stringify(variantPayload),
                },
              );

              const variantResponse = await variantRes.json();

              // Attach new media to newly created variant
              if (
                variantResponse.success &&
                variantResponse.data?.id &&
                variant.newMedia?.length > 0
              ) {
                await attachMediaToVariant(
                  id,
                  variantResponse.data.id,
                  variant.newMedia,
                  accessToken,
                );
              }
            }
          }
        }
      } else {
        // Handle variant updates without image changes
        if (variant.colors && variant.selectedSizes) {
          for (const color of variant.colors) {
            for (const size of variant.selectedSizes) {
              const variantPayload = {
                color: color,
                size: size,
                stock: variant.stock,
                price: variant.price,
              };

              if (variant.id && variant.id.length > 9) {
                let shouldUpdate = true;
                try {
                  const existingVariantRes = await fetch(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/products/${id}/variants/${variant.id}`,
                    {
                      headers: {
                        Cookie: `access_token=${accessToken}`,
                      },
                      cache: 'no-store',
                    },
                  );

                  if (existingVariantRes.ok) {
                    const existingVariantData = await existingVariantRes.json();
                    const existingVariant = existingVariantData.data;

                    if (
                      existingVariant.color === variantPayload.color &&
                      existingVariant.size === variantPayload.size &&
                      Number(existingVariant.stock) ===
                        Number(variantPayload.stock) &&
                      Number(existingVariant.price) ===
                        Number(variantPayload.price)
                    ) {
                      shouldUpdate = false;
                    }
                  }
                } catch (error) {
                  console.error('Error fetching existing variant:', error);
                }

                if (shouldUpdate) {
                  const variantRes = await fetch(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/products/${id}/variants/${variant.id}`,
                    {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        Cookie: `access_token=${accessToken}`,
                      },
                      body: JSON.stringify(variantPayload),
                    },
                  );
                  await variantRes.json();
                }
              } else {
                // Create new variant
                const variantRes = await fetch(
                  `${process.env.NEXT_PUBLIC_BASE_URL}/products/${id}/variants`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Cookie: `access_token=${accessToken}`,
                    },
                    body: JSON.stringify(variantPayload),
                  },
                );

                const variantResponse = await variantRes.json();

                // Attach media to newly created variant
                if (
                  variantResponse.success &&
                  variantResponse.data?.id &&
                  variant.newMedia?.length > 0
                ) {
                  await attachMediaToVariant(
                    id,
                    variantResponse.data.id,
                    variant.newMedia,
                    accessToken,
                  );
                }
              }
            }
          }
        }
      }
    }
  }

  return productResponse;
}

// ✅ FIXED: Complete implementation of deleteProduct
export async function deleteProduct(formData: FormData) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) {
    return { success: false, error: 'No access token found' };
  }

  const id = formData.get('id') as string;

  try {
    // Step 1: Get all variants for this product
    const variants = await getProductVariants(id, accessToken);

    // Step 2: Delete all media and variants
    for (const variant of variants) {
      // Delete media from variant
      if (variant.media && variant.media.length > 0) {
        for (const media of variant.media) {
          const mediaId = media.id || media;
          // Detach media from variant first
          await detachMediaFromVariant(id, variant.id, accessToken, mediaId);

          // Delete media from storage
          const deleted = await deleteMediaFromStorage(mediaId, accessToken);
          if (!deleted) {
            console.error(`Failed to delete media ${mediaId}`);
          }
        }
      }

      // Delete the variant
      const variantDeleted = await deleteVariantById(
        id,
        variant.id,
        accessToken,
      );
      if (!variantDeleted) {
        console.error(`Failed to delete variant ${variant.id}`);
      }
    }

    // Step 3: Delete the product itself
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/products/${id}`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `access_token=${accessToken}`,
        },
      },
    );

    const productResponse = await res.json();
    return productResponse;
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: 'Failed to delete product' };
  }
}

// ✅ FIXED: Correct implementation of createCollection
export async function createCollection(formData: FormData) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) {
    return { success: false, error: 'No access token found' };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/admin/collections`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `access_token=${accessToken}`,
        },
        body: JSON.stringify({ name, description }),
      },
    );

    const response = await res.json();
    return response;
  } catch (error) {
    console.error('Error creating collection:', error);
    return { success: false, error: 'Failed to create collection' };
  }
}

// ✅ FIXED: Correct implementation of updateCollection
export async function updateCollection(formData: FormData) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) {
    return { success: false, error: 'No access token found' };
  }

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  try {
    const payload = { name, description };

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/admin/collections/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `access_token=${accessToken}`,
        },
        body: JSON.stringify(payload),
      },
    );

    const response = await res.json();
    return response;
  } catch (error) {
    console.error('Error updating collection:', error);
    return { success: false, error: 'Failed to update collection' };
  }
}

// ✅ NEW: Function to delete a collection
export async function deleteCollection(formData: FormData) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) {
    return { success: false, error: 'No access token found' };
  }

  const id = formData.get('id') as string;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/admin/collections/${id}`,
      {
        method: 'DELETE',
        headers: {
          Cookie: `access_token=${accessToken}`,
        },
      },
    );

    const response = await res.json();
    return response;
  } catch (error) {
    console.error('Error deleting collection:', error);
    return { success: false, error: 'Failed to delete collection' };
  }
}

// ✅ NEW: Function to delete a single variant with its media
export async function deleteVariant(formData: FormData) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) {
    return { success: false, error: 'No access token found' };
  }

  const productId = formData.get('productId') as string;
  const variantId = formData.get('variantId') as string;

  try {
    // Step 1: Get variant details to find associated media
    const variantRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/products/${productId}/variants/${variantId}`,
      {
        headers: {
          Cookie: `access_token=${accessToken}`,
        },
        cache: 'no-store',
      },
    );

    if (variantRes.ok) {
      const variantData = await variantRes.json();
      const variant = variantData.data;

      // Step 2: Delete all media associated with this variant
      if (variant.media && variant.media.length > 0) {
        for (const media of variant.media) {
          const mediaId = media.id || media;

          // Detach media from variant
          await detachMediaFromVariant(
            productId,
            variantId,
            accessToken,
            mediaId,
          );

          // Delete media from storage
          const deleted = await deleteMediaFromStorage(mediaId, accessToken);
          if (!deleted) {
            console.error(`Failed to delete media ${mediaId}`);
          }
        }
      }
    }

    // Step 3: Delete the variant itself
    const deleteRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/products/${productId}/variants/${variantId}`,
      {
        method: 'DELETE',
        headers: {
          Cookie: `access_token=${accessToken}`,
        },
      },
    );

    const response = await deleteRes.json();
    return response;
  } catch (error) {
    console.error('Error deleting variant:', error);
    return { success: false, error: 'Failed to delete variant' };
  }
}
