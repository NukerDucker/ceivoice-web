"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { sendPasswordResetOtp, verifyPasswordResetOtp } from "@/services/auth";

interface EnterOtpFormProps {
  email: string;
}

export function EnterOtpForm({ email }: EnterOtpFormProps) {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = ["", "", "", "", "", ""];
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      await sendPasswordResetOtp(email);
      setResendSuccess(true);
      setCountdown(59);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend. Try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join("");
    if (token.length < 6) { setError("Please enter the full 6-digit code."); return; }

    setIsLoading(true);
    setError(null);

    try {
      await verifyPasswordResetOtp(email, token);
      router.push("/reset-password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between gap-2">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            className={`h-14 w-full rounded-xl border text-center text-lg font-semibold outline-none transition-all
              focus:border-black focus:ring-1 focus:ring-black
              ${digit ? "border-black" : "border-gray-200"}
              ${isLoading ? "bg-gray-50 text-gray-400" : "bg-white"}
            `}
          />
        ))}
      </div>

      {/* Countdown / Resend */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-black underline font-medium disabled:opacity-50"
          >
            {isResending ? "Sending..." : "Resend code"}
          </button>
        ) : (
          <>
            <svg className="h-4 w-4 animate-spin text-green-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
            </svg>
            <span>00:{String(countdown).padStart(2, "0")}</span>
          </>
        )}
      </div>

      {/* Resend success */}
      {resendSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
          <p className="text-sm text-green-700">
            A new code has been sent to <span className="font-semibold">{email}</span>
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading || otp.join("").length < 6}>
        {isLoading ? "Verifying..." : "Confirm"}
      </Button>
    </form>
  );
}