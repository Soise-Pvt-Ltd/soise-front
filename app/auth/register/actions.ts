'use server';

interface RegisterPayload {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

export async function register(payload: RegisterPayload) {
  const BASE_URL = 'https://api.soise.ng';
  const { email, password, username, firstName, lastName } = payload;

  if (!email || !password || !username || !firstName || !lastName) {
    return { success: false, message: 'All fields are required' };
  }

  // Check if email is already registered
  try {
    const checkEmailResponse = await fetch(`${BASE_URL}/auth/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const checkEmailData = await checkEmailResponse.json();

    if (checkEmailData?.success && checkEmailData?.data?.exists) {
      return { success: false, message: 'Email already used' };
    }
  } catch (error) {
    // Log error but allow signup to proceed if check fails (fail-open)
    console.error('Email check failed:', error);
  }

  try {
    // Proceed with signup by calling the external API
    const authResponse = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        username,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      const errorMessage =
        authData?.error || authData?.message || 'Signup failed';
      return { success: false, message: errorMessage };
    }

    return { success: true, data: authData };
  } catch (err) {
    console.error('Internal Signup Action Error:', err);
    return { success: false, message: 'An internal error occurred' };
  }
}

// export async function googleSignup() {
//   try {
//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_BASE_URL}/auth/google/login`,
//       {
//         method: 'GET',
//       },
//     );

//     const data = await response.json();

//     if (!response.ok) {
//       const errorMessage =
//         data?.error || data?.message || 'Google signup failed';
//       return { success: false, message: errorMessage };
//     }

//     // Return the authorization URL
//     return {
//       success: true,
//       data: {
//         url: data?.data?.authorization_url,
//       },
//     };
//   } catch (err) {
//     console.error('Internal Google Register Error:', err);
//     return { success: false, message: 'An internal error occurred' };
//   }
// }
