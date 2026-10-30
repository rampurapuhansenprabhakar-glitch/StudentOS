"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  CalendarCheck,
  CheckSquare,
  Clock,
  Award,
  Code2,
  Cpu,
  Sliders,
  TrendingUp,
  Lightbulb,
  CalendarRange,
  Bot,
  User,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/academic", label: "Academic Performance", icon: GraduationCap },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/assignments", label: "Assignments", icon: CheckSquare },
  { href: "/study-tracker", label: "Study Tracker", icon: Clock },
  { href: "/skills", label: "Skills", icon: Award },
  { href: "/coding", label: "Coding Progress", icon: Code2 },
  { href: "/digital-twin", label: "Digital Twin", icon: Cpu },
  { href: "/simulator", label: "What-If Simulator", icon: Sliders },
  { href: "/predictions", label: "Predictions", icon: TrendingUp },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/planner", label: "Study Planner", icon: CalendarRange },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/privacy", label: "Privacy", icon: ShieldCheck },
];

export function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-slate-200/80 bg-white transition-all duration-300 z-20 shrink-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Logo Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4">
        {!collapsed ? (
          <Link href="/dashboard" className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-lg">StudentOS</span>
              <span className="ml-1 text-[10px] uppercase font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                v1.0
              </span>
            </div>
          </Link>
        ) : (
          <Link href="/dashboard" className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-lg shadow-sm">
            S
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600",
                  !collapsed && "mr-3"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Tagline footer */}
      {!collapsed && (
        <div className="border-t border-slate-200/80 p-4 text-center">
          <p className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
            Track • Predict • Simulate • Improve
          </p>
        </div>
      )}
    </aside>
  );
}
