"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ username: "", password: "", confirm: "" });

  const passwordMismatch = form.confirm.length > 0 && form.password !== form.confirm;

  // Get current user's email to display
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (passwordMismatch) return;
  if (form.password.length < 8) {
    setError("Password must be at least 8 characters");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error: dbError } = await supabase
      .from("users")
      .update({
        user_name: form.username,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
    if (dbError) throw new Error(dbError.message);

    // 3. Password update AFTER — triggers new session,
    //    hook fires and reads onboarding_completed: true already in DB ✅
    const { error: passwordError } = await supabase.auth.updateUser({
      password: form.password,
    });
    if (passwordError) throw new Error(passwordError.message);
    console.log('Onboarding Done')
    // 4. Let middleware handle the redirect
    await supabase.auth.refreshSession();

// Get updated session to know the role
    const { data: { session: newSession } } = await supabase.auth.getSession();
    const jwt = newSession?.access_token
      ? JSON.parse(atob(newSession.access_token.split('.')[1]))
      : {};
    const appRole = jwt.app_role ?? 'user';

    // router.push(`/${appRole}/dashboard`);
    router.push("/auth-test");
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : "Something went wrong");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 shadow-sm p-8">

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback>
                {email?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">One last step</h1>
          <p className="text-sm text-gray-500 mt-1">
            Set up your username and password to finish creating your account.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>

          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="e.g. john_doe"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordMismatch && (
              <p className="text-xs text-red-500">Passwords do not match.</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={loading || passwordMismatch}
          >
            {loading ? "Saving..." : "Complete Setup"}
          </Button>

        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Signed in as{" "}
          <span className="font-medium text-gray-600">{email}</span>
        </p>

      </div>
    </div>
  );
}
