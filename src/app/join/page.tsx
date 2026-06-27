"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CheckSquare, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

function JoinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/");
    }
  }, [token, router]);

  const handleJoin = async () => {
    if (!user) {
      router.push(`/?joinToken=${token}`);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      toast("You have successfully joined the project!");
      router.push("/projects");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
          <CheckSquare className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Project Invitation</h1>
          <p className="text-sm text-slate-400">
            You've been invited to collaborate with your team on TaskFlow.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 space-y-1">
          <div>Invitation Token:</div>
          <code className="text-indigo-400 font-mono break-all">{token || "Invalid token"}</code>
        </div>

        <button
          onClick={handleJoin}
          disabled={loading || !token}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{user ? "Accept & Join Workspace" : "Sign In to Accept"}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading invitation...</div>}>
      <JoinContent />
    </Suspense>
  );
}
