"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/services/auth";

/**
 * Landing page for the OAuth2 callback redirect.
 *
 * The backend sets the access_token / refresh_token httpOnly cookies
 * BEFORE redirecting here, so we never see the tokens in the URL.
 * We simply call /auth/me (which sends the cookie automatically via
 * credentials:"include") to determine the user's role, then redirect.
 */
export default function AuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    getMe()
      .then((user) => {
        if (user.role === "admin") {
          router.replace("/admin/dashboard");
        } else if (user.role === "user") {
          router.replace("/user/dashboard");
        }
      })
      .catch(() => {
        router.replace("/login?error=auth_failed");
      });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Signing you in…</p>
    </div>
  );
}
