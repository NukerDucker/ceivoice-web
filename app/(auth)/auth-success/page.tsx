"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      // Store tokens
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Redirect to dashboard
      router.push("/dashboard");
    } else {
      // Redirect to login if tokens are missing
      router.push("/login?error=missing_tokens");
    }
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-xl font-semibold">Authenticating...</h2>
      <p className="text-gray-500">Please wait while we complete your login.</p>
      <div className="mt-4 h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent"></div>
    </div>
  );
}
