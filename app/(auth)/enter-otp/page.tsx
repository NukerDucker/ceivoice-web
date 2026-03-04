import { EnterOtpForm } from "./_components/enter-otp-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface EnterOtpPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function EnterOtpPage({ searchParams }: EnterOtpPageProps) {
  const { email = "" } = await searchParams;

  return (
    <div className="rounded-2xl border border-gray-100 p-8 shadow-sm">
      <div className="mb-6">
        <Link
          href="/forget-password"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-4"
        >
          <ArrowLeft size={14} />
          Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Enter OTP</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter the 6-digit OTP code that we sent to{" "}
          <span className="font-semibold text-gray-800">{email}</span>
        </p>
      </div>

      <EnterOtpForm email={email} />
    </div>
  );
}