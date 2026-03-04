"use client";

import { ForgetPasswordForm } from "./_components/forget-password-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ForgetPasswordPage() {
  return (
    <div className="rounded-2xl border border-gray-100 p-8 shadow-sm">
      <div className="mb-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-4"
        >
          <ArrowLeft size={14} />
          Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Forgot Password?
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          If you&apos;ve forgotten your password, please enter your email to reset it.
        </p>
      </div>

      <ForgetPasswordForm />
    </div>
  );
}