export const initiateGoogleAuth = async () => {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      throw new Error("Backend URL is not configured");
    }

    const response = await fetch(`${backendUrl}/api/auth/google`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    const authUrl = data.auth_url || data.authUrl;

    if (!authUrl) {
      throw new Error("Backend did not return auth URL");
    }

    window.location.href = authUrl;
  } catch (error) {
    console.error("Failed to initiate Google authentication:", error);
    throw error;
  }
};

export const handleGoogleAuthError = (errorParam: string | null) => {
  const errorMessages: Record<string, string> = {
    oauth_error: 'OAuth authentication failed. Please try again.',
    invalid_code: 'Invalid authorization code.',
    access_denied: 'You denied access to your Google account.',
  };

  return errorParam ? errorMessages[errorParam] || 'An error occurred during authentication.' : null;
};
