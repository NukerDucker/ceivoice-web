'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      // Redirect to login with error message
      router.push(`/login?error=${error}`);
      return;
    }

    if (accessToken && refreshToken) {
      // Store tokens in localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Redirect to dashboard
      router.push('/dashboard');
    } else {
      // No tokens found, redirect to login
      router.push('/login?error=missing_tokens');
    }
  }, [searchParams, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
