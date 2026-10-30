"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { StudyPlan, StudyPlanSession, Subject } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Calendar,
  Clock,
  BookOpen,
  CheckSquare,
  Square,
  Plus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  CheckCircle2,
} from "lucide-react";

export default function PlannerPage() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded plan ID
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState("Semester Mid-Term Revision Plan");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [hoursPerDay, setHoursPerDay] = useState(3.0);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [focusWeak, setFocusWeak] = useState(true);
  const [examPrep, setExamPrep] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const [plansData, subjectsData] = await Promise.all([
        apiClient<StudyPlan[]>("/study-plans"),
        apiClient<Subject[]>("/academic/subjects"),
      ]);
      setPlans(plansData);
      setSubjects(subjectsData);
      if (plansData.length > 0 && !expandedPlanId) {
        setExpandedPlanId(plansData[0].id);
      }
      if (subjectsData.length > 0 && selectedSubjectIds.length === 0) {
        setSelectedSubjectIds(subjectsData.map((s) => s.id));
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load study plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await apiClient("/study-plans", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          start_date: startDate,
          end_date: endDate,
          available_hours_per_day: Number(hoursPerDay),
          selected_subject_ids: selectedSubjectIds.length > 0 ? selectedSubjectIds : undefined,
          focus_weak_subjects: focusWeak,
          exam_prep_mode: examPrep,
        }),
      });
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err?.message || "Failed to generate study plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSession = async (sessionId: string) => {
    try {
      await apiClient(`/study-plans/sessions/${sessionId}/complete`, {
        method: "PATCH",
      });
      // Refresh local plans state
      setPlans((prevPlans) =>
        prevPlans.map((plan) => ({
          ...plan,
          sessions: plan.sessions.map((sess) =>
            sess.id === sessionId ? { ...sess, is_completed: !sess.is_completed } : sess
          ),
        }))
      );
    } catch (err: any) {
      alert(err?.message || "Failed to toggle session completion");
    }
  };

  const toggleSubjectSelect = (id: string) => {
    if (selectedSubjectIds.includes(id)) {
      setSelectedSubjectIds(selectedSubjectIds.filter((sId) => sId !== id));
    } else {
      setSelectedSubjectIds([...selectedSubjectIds, id]);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Synthesizing personalized study schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Intelligent Study Planner
          </h1>
          <p className="text-sm text-slate-500">
            Algorithmic study schedules optimized for weak subjects, target CGPA, and available daily hours.
          </p>
        </div>
        <div>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Generate New Plan
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Plans List */}
      {plans.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No study plans found"
          description="Generate your first schedule. The planner distributes your weekly study hours according to subject credits and performance gaps."
          actionLabel="Create Study Plan"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const isExpanded = expandedPlanId === plan.id;
            const completedCount = plan.sessions.filter((s) => s.is_completed).length;
            const totalCount = plan.sessions.length;
            const progressPct =
              totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            // Group sessions by date
            const sessionsByDate: Record<string, StudyPlanSession[]> = {};
            plan.sessions.forEach((sess) => {
              if (!sessionsByDate[sess.date]) {
                sessionsByDate[sess.date] = [];
              }
              sessionsByDate[sess.date].push(sess);
            });

            return (
              <Card key={plan.id} className="overflow-hidden">
                <div
                  className="p-6 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{plan.title}</h3>
                        <Badge variant={plan.status === "active" ? "success" : "neutral"}>
                          {plan.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {plan.start_date} to {plan.end_date} &bull; Total {plan.total_planned_hours} planned hours
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Progress</span>
                          <span className="font-semibold text-slate-800">
                            {completedCount}/{totalCount} ({progressPct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-brand-600 h-2 rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      <button className="text-slate-400 hover:text-slate-600 p-1">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Sessions Calendar/Timeline */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50 p-6 space-y-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Study Sessions by Date
                    </h4>

                    <div className="space-y-3">
                      {Object.entries(sessionsByDate).map(([dateStr, sessionList]) => {
                        const isToday =
                          dateStr === new Date().toISOString().split("T")[0];

                        return (
                          <div
                            key={dateStr}
                            className={`rounded-xl border p-4 bg-white ${
                              isToday
                                ? "border-brand-500 ring-1 ring-brand-500"
                                : "border-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-brand-600" />
                                {new Date(dateStr).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                                {isToday && (
                                  <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                                    Today
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-slate-400">
                                {sessionList.reduce((acc, s) => acc + s.duration_hours, 0)} hours
                              </span>
                            </div>

                            <div className="space-y-2">
                              {sessionList.map((session) => (
                                <div
                                  key={session.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 hover:bg-slate-100 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => handleToggleSession(session.id)}
                                      className="text-slate-400 hover:text-brand-600 transition-colors"
                                    >
                                      {session.is_completed ? (
                                        <CheckSquare className="h-5 w-5 text-emerald-600" />
                                      ) : (
                                        <Square className="h-5 w-5" />
                                      )}
                                    </button>
                                    <div>
                                      <p
                                        className={`text-sm font-medium ${
                                          session.is_completed
                                            ? "text-slate-400 line-through"
                                            : "text-slate-900"
                                        }`}
                                      >
                                        {session.subject_name}
                                      </p>
                                      {session.topic && (
                                        <p className="text-xs text-slate-500">{session.topic}</p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{session.duration_hours} hrs</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal - Create Plan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Automated Study Schedule"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700">Plan Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              placeholder="e.g. End Semester Exam Revision"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Available Daily Study Hours: {hoursPerDay} hrs / day
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
              className="mt-1 w-full accent-brand-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Select Subjects to Include:
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
              {subjects.map((sub) => (
                <label
                  key={sub.id}
                  className="flex items-center gap-2 text-xs text-slate-700 rounded border border-slate-200 p-2 hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjectIds.includes(sub.id)}
                    onChange={() => toggleSubjectSelect(sub.id)}
                    className="rounded text-brand-600"
                  />
                  <span className="truncate">{sub.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={focusWeak}
                onChange={(e) => setFocusWeak(e.target.checked)}
                className="rounded text-brand-600"
              />
              <span>Prioritize weak subjects & lower internal marks automatically</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={examPrep}
                onChange={(e) => setExamPrep(e.target.checked)}
                className="rounded text-brand-600"
              />
              <span>Exam Preparation Mode (intensive revision sessions)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Generate Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
