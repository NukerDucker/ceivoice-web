"use client";

import { LoginForm } from "./_components/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="rounded-2xl border border-gray-100 p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-gray-500">Login to your CEIVoice account</p>
      </div>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-black underline">Sign up</Link>
      </p>
    </div>
  );
}