import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { migrateGuestCart } from '@/lib/cart-migrate';

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

    // Prove the token is real before minting cookies from it: this endpoint
    // takes the access token from a query parameter, so without this anyone
    // could POST an arbitrary string and have it stored. axios throws on a
    // non-2xx, which the catch below turns into a 500. The response body is
    // deliberately unused — role is carried by the token itself.
    await axios.get(`${BASE_URL}/profiles`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    const cookieStore = await cookies();

    // Set the access token in an HTTP-Only cookie
    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'lax',
    });

    // No `isAdmin` cookie: middleware reads the role from the token claim.

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

    // Carry the guest bag onto the account before we hand control back — a
    // Google sign-in mid-checkout must not read as an emptied cart.
    await migrateGuestCart(accessToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Google callback:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to complete authentication' },
      { status: 500 },
    );
  }
}
