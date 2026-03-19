import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { mediaId } = await request.json();

    if (!mediaId) {
      return NextResponse.json(
        { success: false, error: 'mediaId is required' },
        { status: 400 },
      );
    }

    // ✅ Fixed: Delete media, not variant
    const res = await fetch(`${BASE_URL}/media/${mediaId}`, {
      method: 'DELETE',
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { success: false, error: 'Delete failed' },
      { status: res.status },
    );
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Delete error' },
      { status: 500 },
    );
  }
}
