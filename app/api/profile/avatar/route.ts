import { NextRequest, NextResponse } from 'next/server';
import { getBackendToken } from '@/lib/server-auth';

/**
 * Avatar upload for the signed-in user. Forwards the multipart file to the
 * backend's auth-only `POST /profiles/avatar`, which uploads to Cloudinary and
 * sets the user's `avatar`. Unlike `/api/media/upload` (admin-gated), any
 * authenticated user can use this. Returns the updated profile.
 */
export async function POST(request: NextRequest) {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  try {
    const token = await getBackendToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 },
      );
    }

    // Reject oversized / non-image files early (the backend also validates).
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Please select an image file.' },
        { status: 400 },
      );
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Image must be 8MB or smaller.' },
        { status: 400 },
      );
    }

    const upstream = new FormData();
    upstream.append('file', file);

    const res = await fetch(`${BASE_URL}/profiles/avatar`, {
      method: 'POST',
      headers: { Cookie: `access_token=${token}` },
      body: upstream,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: json?.message || 'Upload failed.' },
        { status: res.status },
      );
    }

    // Backend returns the updated profile (with `avatar`) under `data`.
    const avatar = json?.data?.avatar ?? null;
    return NextResponse.json({ success: true, avatar, data: json?.data ?? null });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload error' },
      { status: 500 },
    );
  }
}
