"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, AdminStats, AdminUserItem, FlaggedContentItem } from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { AddUserModal } from "@/components/modals/AddUserModal";
import { relativeTime, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Users,
  FolderKanban,
  CheckSquare,
  AlertOctagon,
  UserPlus,
  ArrowLeftRight,
  Trash2,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast, toastError } = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [flagged, setFlagged] = useState<FlaggedContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [s, u, f] = await Promise.all([
        api.admin.stats(),
        api.admin.users(),
        api.admin.flagged(),
      ]);
      setStats(s);
      setUsers(u);
      setFlagged(f);
    } catch (err: any) {
      toastError(err.message || "Failed to load admin data");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== "Admin") {
      router.push("/dashboard");
      return;
    }
    loadAdminData();
  }, [user]);

  const handleToggleRole = async (userId: string) => {
    try {
      const updated = await api.admin.toggleRole(userId);
      toast(`Role updated to ${updated.role} for ${updated.name}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u))
      );
    } catch (err: any) {
      toastError(err.message || "Failed to toggle role");
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      await api.admin.removeUser(userId);
      toast("User removed from workspace.");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      toastError(err.message || "Failed to delete user");
    }
  };

  const handleApproveFlag = async (id: string) => {
    try {
      await api.admin.approveFlag(id);
      toast("Item marked as not spam.");
      setFlagged((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      toastError(err.message || "Failed to approve content");
    }
  };

  const handleRemoveFlagged = async (id: string) => {
    try {
      await api.admin.removeFlag(id);
      toast("Flagged item and associated task purged.");
      setFlagged((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      toastError(err.message || "Failed to remove item");
    }
  };

  if (loading || !stats) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm">Loading admin dashboard...</span>
      </div>
    );
  }

  const completionPct = stats.totalTasks
    ? Math.round((stats.doneTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Workspace Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Admin Control Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage teammates, oversee permissions, and moderate automated spam flags
          </p>
        </div>

        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add user</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Members"
          value={stats.totalUsers}
          hint={`${stats.adminCount} workspace administrator${stats.adminCount === 1 ? "" : "s"}`}
          pct={100}
          barColor="purple"
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Projects"
          value={stats.totalProjects}
          hint="Active workspaces"
          pct={100}
          barColor="indigo"
          icon={<FolderKanban className="w-4 h-4" />}
        />
        <StatCard
          label="Tasks"
          value={stats.totalTasks}
          hint={`${stats.openTasks} open in flight`}
          pct={completionPct}
          barColor="sky"
          icon={<CheckSquare className="w-4 h-4" />}
        />
        <StatCard
          label="Flagged Content"
          value={stats.flagged}
          hint={stats.flagged > 0 ? "Review needed" : "Queue all clear"}
          pct={stats.flagged > 0 ? 100 : 0}
          barColor="rose"
          icon={<AlertOctagon className="w-4 h-4" />}
        />
      </div>

      {/* Users Table Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden shadow-sm space-y-4">
        <div className="px-6 pt-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Users Directory</h2>
            <p className="text-xs text-slate-400 mt-0.5">{users.length} total team members registered</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Assigned Tasks</th>
                <th className="py-3.5 px-4">Last Seen</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="sm" />
                      <span className="font-semibold text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={u.role === "Admin" ? "admin" : "member"}>{u.role}</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 text-xs font-medium">{u.taskCount}</td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs">
                    {u.lastSeen ? relativeTime(u.lastSeen) : "Never"}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    {u.id !== user?.id && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleRole(u.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1"
                          title={u.role === "Admin" ? "Demote to Member" : "Promote to Admin"}
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>{u.role === "Admin" ? "Demote" : "Promote"}</span>
                        </button>
                        <button
                          onClick={() => handleRemoveUser(u.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Remove user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flagged Content Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Flagged Content Moderation</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated anti-spam filter caught the following submissions
            </p>
          </div>
          {flagged.length > 0 && (
            <Badge variant="danger">{flagged.length} pending moderation</Badge>
          )}
        </div>

        {flagged.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flagged.map((f) => (
              <div
                key={f.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                    <AlertOctagon className="w-4 h-4" />
                    <span>Confidence Score: {f.confidence}%</span>
                  </div>
                  <p className="text-sm font-medium text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                    "{f.content}"
                  </p>
                  <span className="text-[11px] text-slate-500 block">
                    Reported by {f.reporter} • {relativeTime(f.createdAt)}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleApproveFlag(f.id)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Not Spam</span>
                  </button>
                  <button
                    onClick={() => handleRemoveFlagged(f.id)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-950/80 hover:bg-rose-900/80 border border-rose-800/60 transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge Content</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400/50 mx-auto" />
            <p className="font-medium text-slate-300">Moderation Queue is Clean</p>
            <p>No flagged or suspicious content detected by the filter.</p>
          </div>
        )}
      </div>

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSuccess={loadAdminData}
      />
    </div>
  );
}
