"use client";

import { LoginForm } from "./_components/login-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiGoogle, SiGithub } from "@icons-pack/react-simple-icons";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'auth_failed') {
      setErrorMessage('Authentication failed. Please try again.');
    } else if (error === 'missing_tokens') {
      setErrorMessage('Authentication incomplete. Please try again.');
    } else if (error) {
      setErrorMessage('An error occurred during authentication.');
    }
  }, [searchParams]);

  return (
    <div className="rounded-2xl border border-gray-100 p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-gray-500">Login to your CEIVoice account</p>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <LoginForm />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2"
          onClick={() => {
            window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/google`;
          }}
        >
          <SiGoogle size={20} />
          Google
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-black underline">Sign up</Link>
      </p>
    </div>
  );
}