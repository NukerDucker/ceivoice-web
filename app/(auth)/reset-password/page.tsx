import { ResetPasswordForm } from "./_components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="rounded-2xl border border-gray-100 p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Reset Password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your new password below.
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}