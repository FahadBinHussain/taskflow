"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Moon,
  Sun,
  Bell,
  Menu,
  LogOut,
  CheckCheck,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, NotificationItem } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { relativeTime } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface TopbarProps {
  onToggleSidebar: () => void;
  onSearch?: (query: string) => void;
}

export function Topbar({ onToggleSidebar, onSearch }: TopbarProps) {
  const { user, logout, theme, toggleTheme } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const loadNotifications = async () => {
    try {
      const data = await api.notifications.list();
      setNotifications(data);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.readAll();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDismissNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.notifications.dismiss(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/tasks?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm hidden sm:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks, projects..."
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              onSearch?.(e.target.value);
            }}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
        </form>
      </div>

      {/* Topbar Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
          title="Toggle theme"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={theme === "dark"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Notification Bell & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              if (!notifOpen) loadNotifications();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 relative transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-950 animate-pulse" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-400">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 flex items-start gap-3 transition ${
                        n.read ? "opacity-60 bg-transparent" : "bg-indigo-950/20"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-200 leading-snug">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {relativeTime(n.createdAt)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDismissNotif(n.id, e)}
                        className="text-slate-400 hover:text-white p-1 rounded transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <Sparkles className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                    All caught up! No new notifications.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown / signout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <Avatar name={user?.name} size="sm" />
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-white truncate max-w-[100px]">{user?.name}</div>
            <div className="text-[10px] text-slate-400 truncate capitalize">{user?.role}</div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition ml-1"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
