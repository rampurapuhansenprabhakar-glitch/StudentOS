"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { CodingLog, CodingAnalytics, StudentGoal } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Code2,
  Flame,
  Target,
  Trophy,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export default function CodingPage() {
  const [logs, setLogs] = useState<CodingLog[]>([]);
  const [analytics, setAnalytics] = useState<CodingAnalytics | null>(null);
  const [goals, setGoals] = useState<StudentGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [platformFilter, setPlatformFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states - Log Problem
  const [problemTitle, setProblemTitle] = useState("");
  const [platform, setPlatform] = useState("LeetCode");
  const [language, setLanguage] = useState("Python");
  const [topic, setTopic] = useState("Arrays");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [status, setStatus] = useState<"Solved" | "Attempted" | "Review Needed">("Solved");
  const [timeSpent, setTimeSpent] = useState(30);
  const [confidence, setConfidence] = useState(4);
  const [problemUrl, setProblemUrl] = useState("");
  const [notes, setNotes] = useState("");

  // Form states - Goal
  const [goalTitle, setGoalTitle] = useState("");
  const [goalType, setGoalType] = useState("dsa_count");
  const [targetValue, setTargetValue] = useState(50);
  const [currentValue, setCurrentValue] = useState(0);
  const [unit, setUnit] = useState("problems");
  const [deadline, setDeadline] = useState("");

  const fetchData = async () => {
    try {
      setError(null);
      const [logsData, analyticsData, goalsData] = await Promise.all([
        apiClient<CodingLog[]>("/coding/logs"),
        apiClient<CodingAnalytics>("/coding/analytics"),
        apiClient<StudentGoal[]>("/coding/goals"),
      ]);
      setLogs(logsData);
      setAnalytics(analyticsData);
      setGoals(goalsData);
    } catch (err: any) {
      setError(err?.message || "Failed to load coding data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemTitle.trim()) return;
    setSubmitting(true);
    try {
      await apiClient("/coding/logs", {
        method: "POST",
        body: JSON.stringify({
          problem_title: problemTitle.trim(),
          platform,
          language,
          topic,
          difficulty,
          status,
          time_spent_minutes: Number(timeSpent),
          confidence_rating: Number(confidence),
          problem_url: problemUrl.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      setIsLogModalOpen(false);
      resetLogForm();
      await fetchData();
    } catch (err: any) {
      alert(err?.message || "Failed to log problem");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this log?")) return;
    try {
      await apiClient(`/coding/logs/${id}`, { method: "DELETE" });
      await fetchData();
    } catch (err: any) {
      alert(err?.message || "Failed to delete log");
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    setSubmitting(true);
    try {
      await apiClient("/coding/goals", {
        method: "POST",
        body: JSON.stringify({
          title: goalTitle.trim(),
          goal_type: goalType,
          target_value: Number(targetValue),
          current_value: Number(currentValue),
          unit: unit.trim(),
          deadline: deadline || undefined,
        }),
      });
      setIsGoalModalOpen(false);
      resetGoalForm();
      await fetchData();
    } catch (err: any) {
      alert(err?.message || "Failed to create goal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGoal = async (goalId: string, currentVal: number, targetVal: number) => {
    const newVal = prompt("Enter new current progress value:", currentVal.toString());
    if (newVal === null) return;
    const parsed = parseFloat(newVal);
    if (isNaN(parsed) || parsed < 0) return;

    try {
      await apiClient(`/coding/goals/${goalId}`, {
        method: "PATCH",
        body: JSON.stringify({
          current_value: parsed,
          is_completed: parsed >= targetVal,
        }),
      });
      await fetchData();
    } catch (err: any) {
      alert(err?.message || "Failed to update goal");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      await apiClient(`/coding/goals/${goalId}`, { method: "DELETE" });
      await fetchData();
    } catch (err: any) {
      alert(err?.message || "Failed to delete goal");
    }
  };

  const resetLogForm = () => {
    setProblemTitle("");
    setPlatform("LeetCode");
    setLanguage("Python");
    setTopic("Arrays");
    setDifficulty("Medium");
    setStatus("Solved");
    setTimeSpent(30);
    setConfidence(4);
    setProblemUrl("");
    setNotes("");
  };

  const resetGoalForm = () => {
    setGoalTitle("");
    setGoalType("dsa_count");
    setTargetValue(50);
    setCurrentValue(0);
    setUnit("problems");
    setDeadline("");
  };

  // Filtered logs
  const filteredLogs = logs.filter((log) => {
    if (platformFilter !== "all" && log.platform !== platformFilter) return false;
    if (difficultyFilter !== "all" && log.difficulty !== difficultyFilter) return false;
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    return true;
  });

  // Prepare chart data
  const difficultyData = [
    { name: "Easy", count: analytics?.difficulty_breakdown?.["Easy"] || 0, color: "#10b981" },
    { name: "Medium", count: analytics?.difficulty_breakdown?.["Medium"] || 0, color: "#f59e0b" },
    { name: "Hard", count: analytics?.difficulty_breakdown?.["Hard"] || 0, color: "#ef4444" },
  ];

  const topicData = Object.entries(analytics?.topic_breakdown || {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading coding practice records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Coding Practice & DSA Tracker</h1>
          <p className="text-sm text-slate-500">
            Log algorithmic problems, monitor current streaks, and track technical milestones.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsGoalModalOpen(true)}>
            <Target className="mr-1.5 h-4 w-4" />
            Set Goal
          </Button>
          <Button size="sm" onClick={() => setIsLogModalOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Log Problem
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Problems Solved</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {analytics?.total_problems_solved || 0}
                </span>
                <span className="text-xs text-slate-400">
                  / {analytics?.total_problems_attempted || 0} attempted
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Streak</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {analytics?.current_streak_days || 0}
                </span>
                <span className="text-xs text-slate-500">days active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Solve Rate</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {analytics?.solve_rate_percentage || 0}%
                </span>
                <span className="text-xs text-slate-500">efficiency</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Time</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {analytics?.total_time_spent_hours || 0}
                </span>
                <span className="text-xs text-slate-500">hours invested</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Section */}
      {goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Coding Milestones</CardTitle>
            <CardDescription>Track key targets for competitive programming and DSA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {goals.map((g) => {
                const pct = Math.min(100, Math.round((g.current_value / (g.target_value || 1)) * 100));
                return (
                  <div key={g.id} className="rounded-lg border border-slate-200 p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">{g.title}</h4>
                        <p className="text-xs text-slate-500">
                          Target: {g.target_value} {g.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateGoal(g.id, g.current_value, g.target_value)}
                          className="text-xs text-brand-600 hover:underline px-1 py-0.5"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          className="text-slate-400 hover:text-red-500 p-0.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-brand-600 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{g.current_value} {g.unit}</span>
                      <span className="font-medium text-slate-700">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Difficulty Distribution</CardTitle>
            <CardDescription>Problems categorized by challenge level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={difficultyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {difficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Topics Solved</CardTitle>
            <CardDescription>Distribution across algorithmic domains</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {topicData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No topic data logged yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" width={90} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Problem Practice Log</CardTitle>
            <CardDescription>History of solved and attempted problems</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Platforms</option>
              <option value="LeetCode">LeetCode</option>
              <option value="HackerRank">HackerRank</option>
              <option value="CodeChef">CodeChef</option>
              <option value="Codeforces">Codeforces</option>
              <option value="GeeksforGeeks">GeeksforGeeks</option>
            </select>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="Solved">Solved</option>
              <option value="Attempted">Attempted</option>
              <option value="Review Needed">Review Needed</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <EmptyState
              icon={Code2}
              title="No coding logs found"
              description="Start tracking your DSA problems to see your progress analytics and consistency trends."
              actionLabel="Log First Problem"
              onAction={() => setIsLogModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Problem Title</th>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Topic</th>
                    <th className="px-4 py-3">Difficulty</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                        {log.date}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{log.problem_title}</span>
                          {log.problem_url && (
                            <a
                              href={log.problem_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-brand-600"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {log.notes && (
                          <p className="text-xs text-slate-400 line-clamp-1">{log.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                          {log.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                        {log.topic}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant={
                            log.difficulty === "Easy"
                              ? "success"
                              : log.difficulty === "Medium"
                              ? "warning"
                              : "danger"
                          }
                        >
                          {log.difficulty}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            log.status === "Solved"
                              ? "bg-emerald-50 text-emerald-700"
                              : log.status === "Attempted"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                        {log.time_spent_minutes}m
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal - Log Problem */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Algorithmic Problem"
      >
        <form onSubmit={handleCreateLog} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700">Problem Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. 3Sum, Invert Binary Tree"
              value={problemTitle}
              onChange={(e) => setProblemTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="LeetCode">LeetCode</option>
                <option value="HackerRank">HackerRank</option>
                <option value="CodeChef">CodeChef</option>
                <option value="Codeforces">Codeforces</option>
                <option value="GeeksforGeeks">GeeksforGeeks</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="Python">Python</option>
                <option value="Java">Java</option>
                <option value="C++">C++</option>
                <option value="JavaScript">JavaScript</option>
                <option value="TypeScript">TypeScript</option>
                <option value="Go">Go</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">Topic / Category</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="Arrays">Arrays</option>
                <option value="Strings">Strings</option>
                <option value="Linked Lists">Linked Lists</option>
                <option value="Trees & Graphs">Trees & Graphs</option>
                <option value="Dynamic Programming">Dynamic Programming</option>
                <option value="Binary Search">Binary Search</option>
                <option value="Recursion / Backtracking">Recursion / Backtracking</option>
                <option value="Sorting & Searching">Sorting & Searching</option>
                <option value="Greedy">Greedy</option>
                <option value="Math & Bit Manipulation">Math & Bit Manipulation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="Solved">Solved</option>
                <option value="Attempted">Attempted</option>
                <option value="Review Needed">Review Needed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Time Spent (minutes)</label>
              <input
                type="number"
                min="1"
                max="720"
                value={timeSpent}
                onChange={(e) => setTimeSpent(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Confidence Rating: {confidence} / 5
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="mt-1 w-full accent-brand-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Problem URL (optional)</label>
            <input
              type="url"
              placeholder="https://leetcode.com/problems/..."
              value={problemUrl}
              onChange={(e) => setProblemUrl(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Notes / Key Takeaways</label>
            <textarea
              rows={2}
              placeholder="Edge cases encountered, time complexity, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Save Log
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal - Set Goal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="Set Coding Target"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700">Goal Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Solve 100 Medium DSA Problems"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">Target Value</label>
              <input
                type="number"
                min="1"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Unit</label>
              <input
                type="text"
                placeholder="problems, days, hours"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Target Deadline (optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Goal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
