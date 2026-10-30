"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { Recommendation } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  Clock,
  Sliders,
  Filter,
  Sparkles,
  BookOpen,
  CalendarCheck,
  Code2,
  ArrowRight,
} from "lucide-react";

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await apiClient<Recommendation[]>("/recommendations");
      setRecommendations(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load personalized recommendations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleAction = async (id: string, action: "completed" | "dismissed") => {
    try {
      setUpdatingId(id);
      await apiClient(`/recommendations/${id}/actions`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      // Update local state
      setRecommendations((prev) =>
        prev.map((rec) => (rec.id === id ? { ...rec, status: action } : rec))
      );
    } catch (err: any) {
      alert(err?.message || "Failed to update recommendation status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Evaluating digital twin weak signals and generating advice...</p>
        </div>
      </div>
    );
  }

  const activeRecs = recommendations.filter(
    (r) => r.status === "active" || r.status === "accepted"
  );
  const historyRecs = recommendations.filter(
    (r) => r.status === "completed" || r.status === "dismissed"
  );

  const displayedList = (activeTab === "active" ? activeRecs : historyRecs).filter(
    (r) => activeCategory === "all" || r.category === activeCategory
  );

  const categories = [
    { id: "all", label: "All Areas" },
    { id: "academic", label: "Academic", icon: BookOpen },
    { id: "attendance", label: "Attendance", icon: CalendarCheck },
    { id: "study", label: "Study Habits", icon: Clock },
    { id: "coding", label: "Coding / DSA", icon: Code2 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Personalized Recommendations</h1>
            <Badge variant="warning">Prescriptive Engine</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Actionable guidance automatically synthesized by your digital twin to optimize performance.
          </p>
        </div>
        <Link href="/simulator">
          <Button className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Sliders className="h-4 w-4" />
            <span>Simulate Habit Changes</span>
          </Button>
        </Link>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        {/* Status Tabs */}
        <div className="flex space-x-1 rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab("active")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "active"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Active Actions ({activeRecs.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "history"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            History & Completed ({historyRecs.length})
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                activeCategory === c.id
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Cards */}
      {displayedList.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No {activeTab} recommendations in this category</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your digital twin indicators are currently aligned with your target goals!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayedList.map((rec) => {
            const isHigh = rec.priority === "high";
            const isMedium = rec.priority === "medium";
            return (
              <Card
                key={rec.id}
                className={`border transition-shadow hover:shadow-md ${
                  isHigh
                    ? "border-rose-200 bg-rose-50/15"
                    : isMedium
                    ? "border-amber-200 bg-amber-50/15"
                    : "border-slate-200 bg-white"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            isHigh ? "danger" : isMedium ? "warning" : "info"
                          }
                        >
                          {rec.priority.toUpperCase()} PRIORITY
                        </Badge>
                        <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 uppercase">
                          {rec.category}
                        </span>
                        {rec.expected_effort_hours && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="h-3 w-3" />
                            {rec.expected_effort_hours}h effort
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{rec.title}</h3>
                      <p className="text-xs text-slate-700 leading-relaxed">{rec.reason}</p>

                      {rec.evidence && (
                        <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-800">Twin Evidence: </span>
                          {rec.evidence}
                        </div>
                      )}

                      <div className="pt-1">
                        <span className="text-xs font-semibold text-indigo-700">
                          Suggested Action:{" "}
                        </span>
                        <span className="text-xs text-slate-800 font-medium">{rec.suggested_action}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {activeTab === "active" ? (
                      <div className="flex flex-row md:flex-col gap-2 shrink-0 self-end md:self-start">
                        <Button
                          size="sm"
                          disabled={updatingId === rec.id}
                          onClick={() => handleAction(rec.id, "completed")}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Mark Done</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === rec.id}
                          onClick={() => handleAction(rec.id, "dismissed")}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Dismiss</span>
                        </Button>
                        <Link href="/simulator">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            <Sliders className="h-3 w-3" />
                            <span>Simulate</span>
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="shrink-0 self-end md:self-start">
                        <Badge
                          variant={rec.status === "completed" ? "success" : "default"}
                        >
                          {rec.status === "completed" ? "Completed" : "Dismissed"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
