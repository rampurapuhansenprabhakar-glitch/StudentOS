"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiClient, ApiError } from "@/lib/api";
import { Button } from "@/components/shared/Button";
import { Sparkles, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await apiClient<{ access_token: string; token_type: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // Fetch user profile to check onboarding status
      localStorage.setItem("studentos_token", resp.access_token);
      const userResp = await apiClient<any>("/auth/me");
      login(resp.access_token, userResp);

      if (userResp.onboarding_completed) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to connect to StudentOS server. Please check your backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("demo@studentos.internal");
    setPassword("StudentOS@Demo2026");
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 border border-slate-200/80 shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white font-bold text-xl shadow-sm">
              S
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to StudentOS</h2>
          <p className="text-xs text-slate-500 mt-1">Access your personalized student digital twin</p>
        </div>

        {/* Demo Account Callout */}
        <div className="mb-6 rounded-xl bg-brand-50/70 border border-brand-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-brand-600 shrink-0" />
              <span className="text-xs font-semibold text-brand-900">Project Viva / Demo Mode</span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 underline focus:outline-none"
            >
              Fill Demo Credentials
            </button>
          </div>
          <p className="text-[11px] text-brand-800 mt-1.5 leading-relaxed">
            Click above to instantly load pre-seeded synthetic data for Alex Rivera (3rd Year CSE AIML).
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center space-x-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@institution.edu"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" loading={loading}>
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-brand-600 hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
