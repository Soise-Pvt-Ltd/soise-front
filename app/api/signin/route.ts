export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import axios, { isAxiosError } from 'axios';

export async function POST(req: NextRequest) {
  try {
    const BASE_URL = 'https://api.soise.ng';
    // 1. Extract email and password from the incoming JSON body
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    // 2. Attempt to log in by calling the external API
    const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password,
    });

    // 3. On successful login, extract the access token and set it in a secure, HTTP-Only cookie.
    const accessToken = authResponse.data?.data?.accessToken;

    if (!accessToken) {
      console.error(
        'Access token not found in auth response:',
        authResponse.data,
      );
      return NextResponse.json(
        { error: 'Login failed, token not provided by auth service.' },
        { status: 500 },
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
    });

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true, // Prevents client-side JS from accessing the cookie
      secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS
      path: '/', // Make the cookie available to all pages
      sameSite: 'strict', // Helps prevent CSRF attacks
      maxAge: 60 * 60 * 24, // Optional: expire cookie after 1 day
    });

    return response;
  } catch (err) {
    // 4. Handle errors, including those from the external API via axios
    if (isAxiosError(err)) {
      // This block catches errors from the backend services (e.g., wrong password)
      console.error('Axios error during signin:', err.response?.data);

      const errorData = err.response?.data || {};
      // Ensure we pass 'error' property to frontend, even if backend only sent 'message'
      const errorMessage =
        errorData.error || errorData.message || 'Signin failed';

      return NextResponse.json(
        { ...errorData, error: errorMessage },
        {
          status: err.response?.status || 500,
        },
      );
    }
    // This block catches other internal errors
    console.error('Internal Signin API Route Error:', err);
    return NextResponse.json(
      { error: 'An internal error occurred' },
      { status: 500 },
    );
  }
}
