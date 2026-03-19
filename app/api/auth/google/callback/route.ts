import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

const BASE_URL = 'https://api.soise.ng';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, userId } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'No access token provided' },
        { status: 400 },
      );
    }

    // Fetch user profile to get role/admin status
    const profileResponse = await axios.get(`${BASE_URL}/profiles`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    const user = profileResponse.data?.data;
    const isAdmin = user?.role === 'admin';

    const cookieStore = await cookies();

    // Set the access token in an HTTP-Only cookie
    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'lax',
    });

    // Store admin status in a cookie
    cookieStore.set('isAdmin', isAdmin.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'lax',
    });

    // Optionally store user ID
    if (userId) {
      cookieStore.set('userId', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
        sameSite: 'lax',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Google callback:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to complete authentication' },
      { status: 500 },
    );
  }
}
