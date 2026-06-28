"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  CheckSquare,
  FolderKanban,
  Users,
  ShieldCheck,
  User,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

function AuthPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const joinToken = searchParams.get("joinToken");
  const joinTokenRef = React.useRef<string | null>(joinToken);

  useEffect(() => {
    if (user && joinTokenRef.current) {
      router.push(`/join?token=${joinTokenRef.current}`);
      joinTokenRef.current = null;
    }
  }, [user, router]);

  const [mode, setMode] = useState<"signin" | "signup" | "reset" | "sent">("signin");
  const [isAdminRole, setIsAdminRole] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "sent") {
      setMode("signin");
      return;
    }

    if (mode === "reset") {
      if (!email.trim() || !email.includes("@")) {
        setError("Please enter a valid email address.");
        return;
      }
      setLoading(true);
      try {
        await api.auth.resetRequest({ email: email.trim() });
        setMode("sent");
      } catch (err: any) {
        setError(err.message || "Failed to send reset link.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setError("Please tell us your name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const data = await api.auth.register({ name: name.trim(), email: email.trim(), password });
        toast("Account created successfully!");
        login(data.token, data.user);
      } else {
        const data = await api.auth.login({ email: email.trim(), password });
        toast(`Welcome back, ${data.user.name.split(" ")[0]}!`);
        login(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    signin: "Welcome back",
    signup: "Create your account",
    reset: "Reset password",
    sent: "Check your inbox",
  };

  const defaultPlaceholder = isAdminRole ? "admin@taskflow.app" : "you@company.com";

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Left hero banner */}
      <div className="lg:col-span-7 bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950 p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
            <CheckSquare className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">TaskFlow</span>
        </div>

        <div className="relative z-10 max-w-xl my-12 lg:my-0 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Modern Team Productivity & Project Manager
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Everything your team owes today, in one calm place.
          </h1>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Tasks, projects and the people executing them. No ceremony — write it down, hand it off, and watch it close with TypeScript, Neon Serverless Postgres, and Drizzle ORM.
          </p>
        </div>

        {/* Live workspace metrics */}
        <div className="relative z-10 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 pt-6 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-indigo-400" />
            <span>Multiple Workspaces</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-indigo-400" />
            <span>Kanban & List Views</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Collaborative Teammates</span>
          </div>
        </div>
      </div>

      {/* Right auth form */}
      <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-slate-950">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{titles[mode]}</h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                  isAdminRole
                    ? "bg-purple-500/15 text-purple-300 border-purple-500/40"
                    : "bg-indigo-500/15 text-indigo-300 border-indigo-500/40"
                )}
              >
                {isAdminRole ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                {isAdminRole ? "Admin Role" : "Member Role"}
              </span>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-300 text-xs font-medium leading-relaxed animate-in fade-in duration-150">
                {error}
              </div>
            )}

            {mode === "sent" ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6" />
                </div>
                <p className="text-sm text-slate-300">
                  A reset link has been dispatched to your email. Check your spam folder if it doesn't arrive within a few minutes.
                </p>
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="w-full py-2.5 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white transition"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Alex Rivera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder={defaultPlaceholder}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {mode !== "reset" && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-slate-300">Password</label>
                      {mode === "signin" && (
                        <button
                          type="button"
                          onClick={() => {
                            setError("");
                            setMode("reset");
                          }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                        required
                      />
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>
                        {mode === "signup"
                          ? "Create Account"
                          : mode === "reset"
                          ? "Send Reset Link"
                          : "Sign In"}
                      </span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>

                {/* Role Switcher */}
                <button
                  type="button"
                  onClick={() => setIsAdminRole(!isAdminRole)}
                  className="w-full py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-center gap-2"
                >
                  {isAdminRole ? <User className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />}
                  <span>{isAdminRole ? "Switch to standard Member sign in" : "Switch to Admin sign in"}</span>
                </button>
              </form>
            )}

            {/* Bottom tab toggles */}
            {mode !== "sent" && (
              <div className="pt-4 border-t border-slate-800/60 text-center text-xs text-slate-400">
                {mode === "signin" ? (
                  <p>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setMode("signup");
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
                    >
                      Sign up for free
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setMode("signin");
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
                    >
                      Sign in instead
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <AuthPage />
    </Suspense>
  );
}
