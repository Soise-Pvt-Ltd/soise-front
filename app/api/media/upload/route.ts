import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 },
      );
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    // ✅ Fixed: Added parentheses
    const res = await fetch(`${BASE_URL}/media/upload`, {
      method: 'POST',
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
      body: uploadFormData,
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: res.status },
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload error' },
      { status: 500 },
    );
  }
}
