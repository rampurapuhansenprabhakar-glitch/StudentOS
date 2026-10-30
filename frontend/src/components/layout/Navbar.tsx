"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Menu, LogOut, User, Cpu, Sparkles } from "lucide-react";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur transition-colors md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu */}
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Digital Twin Status Pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <Cpu className="h-3.5 w-3.5" />
          <span>Digital Twin Online</span>
        </div>

        <span className="text-xs text-slate-400 hidden lg:inline-block">|</span>
        <span className="text-xs text-slate-500 hidden lg:inline-block font-medium">{today}</span>
      </div>

      {/* User profile and actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/digital-twin"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Twin Insights</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-semibold text-xs text-white">
                {user.display_name
                  ? user.display_name.charAt(0).toUpperCase()
                  : user.email.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left text-xs">
                <p className="font-semibold text-slate-800 leading-tight">
                  {user.display_name || user.email.split("@")[0]}
                </p>
                <p className="text-slate-400 text-[10px] truncate max-w-[140px]">{user.email}</p>
              </div>
            </Link>

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <User className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
