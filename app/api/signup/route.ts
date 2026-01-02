export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import axios, { isAxiosError } from 'axios';

export async function POST(req: NextRequest) {
  try {
    const BASE_URL = 'https://api.soise.ng';
    // 1. Extract user details from the incoming JSON body
    const { email, password, username, firstName, lastName } = await req.json();

    if (!email || !password || !username || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 },
      );
    }

    console.log(email, password, username, firstName, lastName);

    // Check if email is already registered
    try {
      const checkEmailResponse = await axios.post(
        `${BASE_URL}/auth/check-email`,
        {
          email,
        },
      );

      if (
        checkEmailResponse.data?.success &&
        checkEmailResponse.data?.data?.exists
      ) {
        return NextResponse.json(
          { error: 'Email already used' },
          { status: 400 },
        );
      }
    } catch (error) {
      // Log error but allow signup to proceed if check fails (fail-open)
      console.error('Email check failed:', error);
    }

    // 2. Proceed with signup by calling the external API
    const authResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      email,
      password,
      username,
      first_name: firstName,
      last_name: lastName,
    });

    // 3. On successful signup, return a success response.
    // The frontend will then redirect to the OTP page.
    return NextResponse.json(authResponse.data);
  } catch (err) {
    // 4. Handle errors, including those from the external API via axios
    if (isAxiosError(err)) {
      // This block catches errors from the backend services (e.g., user already exists)
      console.error('Axios error during signup:', err.response?.data);
      return NextResponse.json(
        err.response?.data || { error: 'Signup failed' },
        {
          status: err.response?.status || 500,
        },
      );
    }
    // This block catches other internal errors
    console.error('Internal Signup API Route Error:', err);
    return NextResponse.json(
      { error: 'An internal error occurred' },
      { status: 500 },
    );
  }
}
