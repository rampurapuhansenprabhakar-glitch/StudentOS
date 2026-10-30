"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { DailyStudyLog, StudyAnalytics, Subject } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { Modal } from "@/components/shared/Modal";
import { EmptyState } from "@/components/shared/EmptyState";
import { Clock, Plus, Flame, Code2, AlertCircle, Trash2, Calendar } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function StudyTrackerPage() {
  const [logs, setLogs] = useState<DailyStudyLog[]>([]);
  const [analytics, setAnalytics] = useState<StudyAnalytics | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Daily Log Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalHours, setTotalHours] = useState<number | "">(3.0);
  const [sessionsCount, setSessionsCount] = useState<number>(2);
  const [revisionDone, setRevisionDone] = useState(false);
  const [asgDone, setAsgDone] = useState(false);
  const [dsaAttempted, setDsaAttempted] = useState<number>(2);
  const [dsaSolved, setDsaSolved] = useState<number>(2);
  const [codingHours, setCodingHours] = useState<number>(1.0);
  const [focusRating, setFocusRating] = useState<number>(4);
  const [diffRating, setDiffRating] = useState<number>(3);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [logsData, anData, subjData] = await Promise.all([
        apiClient<DailyStudyLog[]>("/study/logs"),
        apiClient<StudyAnalytics>("/study/analytics"),
        apiClient<Subject[]>("/academic/subjects"),
      ]);
      setLogs(logsData);
      setAnalytics(anData);
      setSubjects(subjData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (Number(dsaSolved) > Number(dsaAttempted)) {
      setFormError("Problems solved cannot exceed problems attempted.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (logDate > todayStr) {
      setFormError("Cannot record actual study logs for future dates.");
      return;
    }

    try {
      await apiClient("/study/logs", {
        method: "POST",
        body: JSON.stringify({
          date: logDate,
          total_study_hours: Number(totalHours),
          sessions_count: Number(sessionsCount),
          revision_completed: revisionDone,
          assignment_work_completed: asgDone,
          dsa_problems_attempted: Number(dsaAttempted),
          dsa_problems_solved: Number(dsaSolved),
          coding_practice_hours: Number(codingHours),
          focus_rating: Number(focusRating),
          difficulty_rating: Number(diffRating),
          notes: notes || undefined,
        }),
      });
      setIsModalOpen(false);
      setNotes("");
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || "Failed to log daily study session.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this study record?")) {
      await apiClient(`/study/logs/${id}`, { method: "DELETE" });
      await loadData();
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading study tracker...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Daily Tracker</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Log your daily learning routine, self-rated focus, and problem-solving cadence.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" size="sm" className="space-x-1.5">
          <Plus className="h-3.5 w-3.5" />
          <span>Log Daily Session</span>
        </Button>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500">Average Daily Study</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{analytics?.average_daily_hours.toFixed(1)}h</div>
          <span className="text-[11px] text-slate-400">Target: 3.5h / day</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500">Study Consistency</span>
          <div className="mt-1 text-2xl font-bold text-brand-600 flex items-center space-x-1">
            <span>{analytics?.study_consistency_score.toFixed(0)}%</span>
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <span className="text-[11px] text-slate-400">30-day window</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500">Average Focus</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{analytics?.average_focus_rating.toFixed(1)} / 5</div>
          <span className="text-[11px] text-slate-400">Self-reported focus rating</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500">DSA Velocity</span>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{analytics?.total_dsa_solved} solved</div>
          <span className="text-[11px] text-slate-400">Attempted: {analytics?.total_dsa_attempted}</span>
        </Card>
      </div>

      {/* 14-Day Trend Chart */}
      {analytics && analytics.daily_trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Study Cadence (Last 14 Days)</CardTitle>
            <CardDescription>Verified recorded study hours over rolling two-week window.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.daily_trends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day_name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} unit="h" />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                    formatter={(val: any) => [`${val} hours`, "Study Duration"]}
                  />
                  <Bar dataKey="study_hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Logs History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Logged Study Sessions</CardTitle>
          <CardDescription>Comprehensive daily log history with focus ratings and problem totals.</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No Study Sessions Logged Yet"
              description="Taking 60 seconds every evening to log your study sessions powers your digital twin simulation."
              actionLabel="Log First Session"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Study Duration</th>
                    <th className="px-4 py-3 font-medium">Sessions</th>
                    <th className="px-4 py-3 font-medium">DSA Solved</th>
                    <th className="px-4 py-3 font-medium">Focus</th>
                    <th className="px-4 py-3 font-medium">Activities</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{log.date}</td>
                      <td className="px-4 py-3 font-bold text-brand-700">{log.total_study_hours}h</td>
                      <td className="px-4 py-3 text-slate-600">{log.sessions_count}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {log.dsa_problems_solved} / {log.dsa_problems_attempted}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">{log.focus_rating}</span> / 5
                      </td>
                      <td className="px-4 py-3 space-x-1.5">
                        {log.revision_completed && <Badge variant="info">Revision</Badge>}
                        {log.assignment_work_completed && <Badge variant="success">Assignment</Badge>}
                        {log.coding_practice_hours > 0 && <Badge variant="neutral">{log.coding_practice_hours}h Code</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Delete"
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

      {/* Modal: Log Daily Study Session */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Daily Study Session">
        <form onSubmit={handleCreateLog} className="space-y-4">
          {formError && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs flex items-center space-x-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                max={new Date().toISOString().split("T")[0]}
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Total Study Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                required
                value={totalHours}
                onChange={(e) => setTotalHours(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Sessions Count</label>
              <input
                type="number"
                min="1"
                max="10"
                value={sessionsCount}
                onChange={(e) => setSessionsCount(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Focus (1-5)</label>
              <select
                value={focusRating}
                onChange={(e) => setFocusRating(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((r) => (
                  <option key={r} value={r}>{r} - {r === 5 ? "Deep Flow" : r === 1 ? "Distracted" : "Good"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Difficulty (1-5)</label>
              <select
                value={diffRating}
                onChange={(e) => setDiffRating(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">DSA Attempted</label>
              <input
                type="number"
                min="0"
                value={dsaAttempted}
                onChange={(e) => setDsaAttempted(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">DSA Solved</label>
              <input
                type="number"
                min="0"
                value={dsaSolved}
                onChange={(e) => setDsaSolved(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Coding Time (h)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={codingHours}
                onChange={(e) => setCodingHours(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6 pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={revisionDone}
                onChange={(e) => setRevisionDone(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Revision Completed</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={asgDone}
                onChange={(e) => setAsgDone(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Assignment Work Completed</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Session Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What topics or problems did you solve today?"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
