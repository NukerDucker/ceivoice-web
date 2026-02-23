"use client";

import Image from "next/image";
import Link from "next/link";
import { RegisterForm } from "./_components/register-form";

export default function RegisterPage() {
  return (
    <div className="rounded-2xl border border-gray-100 p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-gray-500">Enter your details to get started</p>
      </div>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-black underline">Login</Link>
      </p>
    </div>
  );
}