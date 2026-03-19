'use server';

export async function googleAuth() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/auth/google/login`,
      {
        method: 'GET',
      },
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data?.error || data?.message || 'Google authentication failed';
      return { success: false, message: errorMessage };
    }

    // Return the authorization URL

    return {
      success: true,
      data: {
        url: data?.data?.authorization_url,
      },
    };
  } catch (err) {
    console.error('Internal Google Auth Error:', err);
    return { success: false, message: 'An internal error occurred' };
  }
}
