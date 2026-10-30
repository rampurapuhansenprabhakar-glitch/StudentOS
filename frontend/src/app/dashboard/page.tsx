"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { OverviewAnalytics, DigitalTwinResponse } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  GraduationCap,
  CalendarCheck,
  CheckSquare,
  Clock,
  Code2,
  Lightbulb,
  TrendingUp,
  Cpu,
  Sliders,
  AlertTriangle,
  ArrowRight,
  Flame,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<OverviewAnalytics | null>(null);
  const [twin, setTwin] = useState<DigitalTwinResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [anData, twinData] = await Promise.all([
          apiClient<OverviewAnalytics>("/analytics/overview"),
          apiClient<DigitalTwinResponse>("/digital-twin/current"),
        ]);
        setAnalytics(anData);
        setTwin(twinData);
      } catch (err: any) {
        setError(err?.message || "Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Synchronizing digital twin state...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to Load Dashboard"
        description={error || "Please verify backend server connection."}
        actionLabel="Retry Connection"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Student Success Twin
            </h1>
            <Badge variant={analytics.academic_risk_level === "Low" ? "success" : "warning"}>
              {analytics.academic_risk_level} Risk
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time digital twin state evolving from your verified academic records and daily habits.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link href="/simulator">
            <Button variant="outline" size="sm" className="space-x-1.5">
              <Sliders className="h-3.5 w-3.5" />
              <span>What-If Simulator</span>
            </Button>
          </Link>
          <Link href="/study-tracker">
            <Button variant="primary" size="sm" className="space-x-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>Log Study Session</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 8 Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current CGPA */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Current CGPA</span>
            <div className="rounded-lg bg-blue-50 p-2 text-brand-600">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {analytics.current_cgpa ? analytics.current_cgpa.toFixed(2) : "N/A"}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Target: <span className="font-semibold text-slate-700">{analytics.target_cgpa || "N/A"}</span>
          </div>
        </Card>

        {/* Card 2: ML Predicted CGPA */}
        <Card className="p-4 border-brand-200/70 bg-gradient-to-br from-white to-brand-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-700">ML Predicted CGPA</span>
            <div className="rounded-lg bg-brand-100 p-2 text-brand-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-brand-700">
            {analytics.predicted_cgpa ? analytics.predicted_cgpa.toFixed(2) : "Pending"}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Next Semester Horizon • <span className="text-brand-600 font-medium">Ridge Regressor</span>
          </div>
        </Card>

        {/* Card 3: Overall Attendance */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Attendance</span>
            <div className={`rounded-lg p-2 ${analytics.overall_attendance < 75 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <div className={`mt-2 text-2xl font-bold ${analytics.overall_attendance < 75 ? "text-red-600" : "text-slate-900"}`}>
            {analytics.overall_attendance.toFixed(1)}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Benchmark: <span className="font-semibold text-slate-700">75.0%</span>
          </div>
        </Card>

        {/* Card 4: Assignment Completion */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Assignments Done</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {analytics.assignment_completion_rate.toFixed(0)}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Completed on schedule
          </div>
        </Card>

        {/* Card 5: Daily Study Hours */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Avg Study / Day</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {analytics.average_daily_study_hours.toFixed(1)}h
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Last 14 days observation
          </div>
        </Card>

        {/* Card 6: Study Consistency */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Study Consistency</span>
            <div className="rounded-lg bg-blue-50 p-2 text-brand-600">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {analytics.study_consistency_score.toFixed(0)}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Routine adherence score
          </div>
        </Card>

        {/* Card 7: Coding Progress */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">DSA Solved</span>
            <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
              <Code2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {analytics.total_dsa_solved}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Problems verified solved
          </div>
        </Card>

        {/* Card 8: Active Interventions */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Recommendations</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Lightbulb className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {analytics.active_recommendations_count}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Prioritized action items
          </div>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Study Hours Past 7 Days */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Study Cadence</CardTitle>
            <CardDescription>Verified recorded study hours over the last 7 calendar days.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.study_hours_trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} unit="h" />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                    formatter={(val: any) => [`${val} hours`, "Study Time"]}
                  />
                  <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Subject Marks vs Target */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance vs Benchmark</CardTitle>
            <CardDescription>Internal assessment averages compared against target performance (80%).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.subject_marks_comparison}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="subject" stroke="#94a3b8" fontSize={10} interval={0} />
                  <YAxis stroke="#94a3b8" fontSize={11} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Bar dataKey="score" name="Average Marks %" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" name="Target Benchmark %" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Quick Twin Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights Column */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Data-Grounded Digital Twin Insights</CardTitle>
                <CardDescription>Transparent analytical observations derived from your records.</CardDescription>
              </div>
              <Cpu className="h-5 w-5 text-brand-600" />
            </CardHeader>
            <CardContent>
              {analytics.key_insights.length > 0 ? (
                <div className="space-y-3">
                  {analytics.key_insights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs text-slate-800"
                    >
                      <div className="h-2 w-2 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                      <p className="leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Keep logging study and assessment records to generate active insights.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Simulator CTA */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-brand-900 via-slate-900 to-slate-950 text-white p-6 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-300 mb-2">
                <Sliders className="h-3.5 w-3.5" />
                <span>Core Innovation Engine</span>
              </div>
              <h3 className="text-lg font-bold mb-2">What-If Simulation Engine</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                “What happens if I increase daily study hours to 4.0h and attend 85% of lectures?” Experiment with hypothetical habit shifts using the live inference model.
              </p>
            </div>
            <Link href="/simulator">
              <Button variant="primary" size="sm" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold">
                Launch Simulator <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
