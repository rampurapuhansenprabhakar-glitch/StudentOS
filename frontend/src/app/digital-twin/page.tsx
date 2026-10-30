"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { DigitalTwinResponse, SnapshotHistoryItem } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import {
  Brain,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  GraduationCap,
  Activity,
  Code2,
  Award,
  ChevronRight,
  Sparkles,
  Sliders,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function DigitalTwinPage() {
  const [twin, setTwin] = useState<DigitalTwinResponse | null>(null);
  const [history, setHistory] = useState<SnapshotHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTwinData = async () => {
    try {
      setError(null);
      const [twinData, historyData] = await Promise.all([
        apiClient<DigitalTwinResponse>("/digital-twin/current"),
        apiClient<SnapshotHistoryItem[]>("/digital-twin/history"),
      ]);
      setTwin(twinData);
      setHistory(historyData);
    } catch (err: any) {
      setError(err?.message || "Failed to load Digital Twin state");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTwinData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTwinData();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Synthesizing Digital Twin representation...</p>
        </div>
      </div>
    );
  }

  const chartHistoryData = [...history]
    .reverse()
    .map((item, idx) => ({
      index: idx + 1,
      date: new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      predicted_cgpa: item.predicted_cgpa ?? 0,
      risk_level: item.academic_risk_level,
    }));

  const riskBadgeVariant =
    twin?.academic_risk_level === "Low"
      ? "success"
      : twin?.academic_risk_level === "Moderate"
      ? "warning"
      : "danger";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Student Digital Twin
            </h1>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200">
              Active Twin v{twin?.model_version || "1.0"}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Real-time multi-dimensional virtual representation synthesizing your academic, behavioral, and technical trajectory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} loading={refreshing}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Twin
          </Button>
          <Link href="/simulator">
            <Button size="sm">
              <Sliders className="mr-1.5 h-4 w-4" />
              Open Simulator
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Hero Prediction Banner */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand-300">
              <Brain className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Predicted Next Semester CGPA
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black tracking-tight text-white">
                {twin?.predicted_cgpa !== null ? twin?.predicted_cgpa?.toFixed(2) : "N/A"}
              </span>
              <span className="text-sm font-medium text-slate-300">/ 10.0 scale</span>
            </div>
            <p className="text-xs text-slate-400">
              Target goal: <span className="text-brand-300 font-semibold">{twin?.academic_state.target_cgpa?.toFixed(2) || "9.00"}</span>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Academic Risk Assessment
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span
                className={`text-2xl font-bold px-3 py-1 rounded-lg ${
                  twin?.academic_risk_level === "Low"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : twin?.academic_risk_level === "Moderate"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                }`}
              >
                {twin?.academic_risk_level || "Low"} Risk
              </span>
              <span className="text-xs text-slate-400">
                Probability:{" "}
                <span className="text-white font-medium">
                  {twin?.academic_risk_probability !== null
                    ? `${(twin?.academic_risk_probability! * 100).toFixed(1)}%`
                    : "N/A"}
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Evaluated by Gradient Boosting Classifier on derived feature state.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <span>Data Completeness</span>
              <span className="text-brand-300 font-bold">
                {twin?.data_completeness_percentage || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  (twin?.data_completeness_percentage || 0) >= 75
                    ? "bg-emerald-400"
                    : (twin?.data_completeness_percentage || 0) >= 50
                    ? "bg-amber-400"
                    : "bg-red-400"
                }`}
                style={{ width: `${twin?.data_completeness_percentage || 0}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              Last synchronized:{" "}
              {twin?.last_updated
                ? new Date(twin.last_updated).toLocaleString()
                : "Just now"}
            </p>
          </div>
        </div>
      </div>

      {/* 4 State Dimension Panels */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Academic State */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Academic Dimension</CardTitle>
                  <CardDescription>Curriculum & evaluation records</CardDescription>
                </div>
              </div>
              <Badge variant="info">Curriculum</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="text-xs text-slate-500">Current CGPA</span>
                <p className="text-lg font-bold text-slate-900">
                  {twin?.academic_state.current_cgpa?.toFixed(2) ?? "N/A"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="text-xs text-slate-500">Previous Sem CGPA</span>
                <p className="text-lg font-bold text-slate-900">
                  {twin?.academic_state.previous_cgpa?.toFixed(2) ?? "N/A"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="text-xs text-slate-500">Attendance Rate</span>
                <p className="text-lg font-bold text-slate-900">
                  {twin?.academic_state.attendance_percentage?.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="text-xs text-slate-500">Internal Assessment Avg</span>
                <p className="text-lg font-bold text-slate-900">
                  {twin?.academic_state.internal_assessment_avg?.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>Active Subjects: <strong className="text-slate-800">{twin?.academic_state.subjects_count || 0}</strong></span>
              <span>Backlogs: <strong className="text-slate-800">{twin?.academic_state.backlogs || 0}</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Behavioral State */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Behavioral & Study Dimension</CardTitle>
                  <CardDescription>Habits, focus & consistency</CardDescription>
                </div>
              </div>
              <Badge variant="warning">Habits</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="text-xs text-slate-500">Daily Study Hours</span>
                <p className="text-lg font-bold text-slate-900">
                  {twin?.behavioral_state.daily_study_hours?.toFixed(1)} hrs/day
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="text-xs text-slate-500">Consistency Score</span>
                <p className="text-lg font-bold text-slate-900">
                  {twin?.behavioral_state.study_consistency_score?.toFixed(0)} / 100
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="text-xs text-slate-500">Average Focus Rating</span>
                <p className="text-lg font-bold text-slate-900">
                  {twin?.behavioral_state.average_focus_rating?.toFixed(1)} / 5.0
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="text-xs text-slate-500">Assignment Completion</span>
                <p className="text-lg font-bold text-slate-900">
                  {twin?.behavioral_state.assignment_completion_rate?.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>Days Logged (Past 14d): <strong className="text-slate-800">{twin?.behavioral_state.days_logged_last_14_days || 0} / 14</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Skill State */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Skill Competency Dimension</CardTitle>
                  <CardDescription>Technical proficiencies & career target</CardDescription>
                </div>
              </div>
              <Badge variant="success">Skills</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="text-xs text-slate-500">Tracked Skills</span>
                <p className="text-lg font-bold text-slate-900">
                  {twin?.skill_state.skills_count || 0} skills
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="text-xs text-slate-500">Average Proficiency</span>
                <p className="text-lg font-bold text-slate-900">
                  {twin?.skill_state.average_proficiency?.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <span className="text-xs text-slate-500">Target Career Goal</span>
              <p className="text-sm font-semibold text-brand-700">
                {twin?.skill_state.career_goal || "Not specified"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Coding State */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Code2 className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Algorithmic & Problem Solving</CardTitle>
                  <CardDescription>DSA velocity & practice volume</CardDescription>
                </div>
              </div>
              <Badge variant="neutral">Coding</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="text-xs text-slate-500">DSA Problems Solved</span>
                <p className="text-lg font-bold text-slate-900">
                  {twin?.coding_state.problems_solved || 0}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="text-xs text-slate-500">Weekly Coding Hours</span>
                <p className="text-lg font-bold text-slate-900">
                  {twin?.coding_state.coding_hours_per_week?.toFixed(1)} hrs/wk
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <span className="text-xs text-slate-500">Digital Twin Engine Status</span>
              <p className="text-xs font-medium text-slate-700">
                Model Ridge & GradientBoosting synchronized with real-time state.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Derived Features Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Derived Feature Vector</CardTitle>
          <CardDescription>
            Engineered parameters fed into the machine learning inference models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(twin?.derived_features || {}).map(([key, val]) => (
              <div key={key} className="rounded-lg border border-slate-200 bg-white p-3">
                <span className="text-xs font-mono text-slate-500 block truncate" title={key}>
                  {key}
                </span>
                <span className="text-base font-bold text-slate-900">
                  {typeof val === "number" ? val.toFixed(2) : String(val)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Snapshot History Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prediction Evolution Over Snapshots</CardTitle>
          <CardDescription>
            Historical trajectory of predicted CGPA across system state updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {chartHistoryData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Only one snapshot exists. Update study or academic records to view trajectory changes.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted_cgpa"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: "#2563eb", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Predicted CGPA"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Snapshot History Table */}
          {history.length > 0 && (
            <div className="mt-6 overflow-x-auto border-t border-slate-100 pt-4">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Timestamp</th>
                    <th className="px-3 py-2">Predicted CGPA</th>
                    <th className="px-3 py-2">Risk Level</th>
                    <th className="px-3 py-2">Model Version</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.slice(0, 5).map((snap) => (
                    <tr key={snap.id}>
                      <td className="px-3 py-2">{new Date(snap.timestamp).toLocaleString()}</td>
                      <td className="px-3 py-2 font-semibold text-slate-900">
                        {snap.predicted_cgpa?.toFixed(2) ?? "N/A"}
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          variant={
                            snap.academic_risk_level === "Low"
                              ? "success"
                              : snap.academic_risk_level === "Moderate"
                              ? "warning"
                              : "danger"
                          }
                        >
                          {snap.academic_risk_level}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-slate-400 font-mono">{snap.model_version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
