"use client";

import { LoginForm } from "./_components/login-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiGoogle, SiGithub } from "@icons-pack/react-simple-icons";

export default function LoginPage() {
  return (
    <div className="rounded-2xl border border-gray-100 p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-gray-500">Login to your CEIVoice account</p>
      </div>

      <LoginForm />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Button variant="outline" className="flex items-center justify-center gap-2">
          <SiGoogle size={20} />
          Google
        </Button>
        {/* <Button variant="outline" className="flex items-center justify-center gap-2">
          <SiGithub size={20} />
          GitHub
        </Button> */}
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-black underline">Sign up</Link>
      </p>
    </div>
  );
}