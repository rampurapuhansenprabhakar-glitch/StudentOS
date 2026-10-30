"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import {
  OverallAttendanceSummary,
  SubjectAttendanceSummary,
  TargetAttendanceCalculationResponse,
  Subject,
} from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import {
  CalendarCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Calculator,
  BookOpen,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function AttendancePage() {
  const [summary, setSummary] = useState<OverallAttendanceSummary | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Target Calculator state
  const [targetPercentage, setTargetPercentage] = useState<number>(75);
  const [calcResult, setCalcResult] = useState<TargetAttendanceCalculationResponse | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Log Attendance Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [conductedInput, setConductedInput] = useState(1);
  const [attendedInput, setAttendedInput] = useState(1);
  const [notesInput, setNotesInput] = useState("");
  const [submittingLog, setSubmittingLog] = useState(false);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const [sumData, subjData] = await Promise.all([
        apiClient<OverallAttendanceSummary>("/attendance/summary"),
        apiClient<Subject[]>("/academic/subjects"),
      ]);
      setSummary(sumData);
      setSubjects(subjData);
      if (subjData.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subjData[0].id);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  };

  const runCalculator = async (target: number) => {
    try {
      setCalcLoading(true);
      const res = await apiClient<TargetAttendanceCalculationResponse>(
        `/attendance/target-calculator?target_percentage=${target}`
      );
      setCalcResult(res);
    } catch {
      // Calculator fallback calculation
      if (summary) {
        const cur = summary.overall_percentage;
        const total = summary.total_conducted;
        const attended = summary.total_attended;
        const t = target / 100;
        let needed = 0;
        let canMiss = 0;
        if (cur < target) {
          needed = Math.max(0, Math.ceil((t * total - attended) / (1 - t)));
        } else {
          canMiss = Math.max(0, Math.floor((attended - t * total) / t));
        }
        setCalcResult({
          current_percentage: cur,
          target_percentage: target,
          is_target_met: cur >= target,
          consecutive_classes_needed: needed,
          can_miss_classes: canMiss,
          is_target_achievable: true,
          explanation: cur >= target
            ? `You are safely above your ${target}% target! You can miss up to ${canMiss} upcoming classes while maintaining compliance.`
            : `You need to attend ${needed} consecutive classes to reach your target of ${target}%.`,
        });
      }
    } finally {
      setCalcLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  useEffect(() => {
    if (summary) {
      runCalculator(targetPercentage);
    }
  }, [summary, targetPercentage]);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    setSubmittingLog(true);
    try {
      await apiClient("/attendance/records", {
        method: "POST",
        body: JSON.stringify({
          subject_id: selectedSubjectId,
          classes_conducted: Number(conductedInput),
          classes_attended: Number(attendedInput),
          date: new Date().toISOString().split("T")[0],
          notes: notesInput || undefined,
        }),
      });
      setIsLogModalOpen(false);
      setNotesInput("");
      fetchAttendanceData();
    } catch (err: any) {
      alert(err?.message || "Failed to log attendance record.");
    } finally {
      setSubmittingLog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Loading attendance and compliance analytics...</p>
        </div>
      </div>
    );
  }

  const isCompliant = summary ? summary.overall_percentage >= 75 : false;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance & Compliance</h1>
          <p className="text-sm text-slate-500">
            Real-time biometric & log tracking with regulatory compliance projections.
          </p>
        </div>
        <Button
          onClick={() => setIsLogModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4" />
          <span>Record Attendance</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overall Attendance</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span
                    className={`text-2xl font-bold ${
                      isCompliant ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {summary ? `${summary.overall_percentage.toFixed(1)}%` : "0%"}
                  </span>
                  <Badge variant={isCompliant ? "success" : "danger"}>
                    {isCompliant ? "Compliant" : "At Risk"}
                  </Badge>
                </div>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  isCompliant ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                }`}
              >
                <CalendarCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Classes Attended</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {summary?.total_attended} <span className="text-sm font-normal text-slate-400">/ {summary?.total_conducted}</span>
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Classes Missed</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {summary?.total_missed}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Subjects Below 75%</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span
                    className={`text-2xl font-bold ${
                      summary && summary.subjects_below_threshold > 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {summary?.subjects_below_threshold ?? 0}
                  </span>
                  <span className="text-xs text-slate-500">of {summary?.subjects_count ?? 0} subjects</span>
                </div>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  summary && summary.subjects_below_threshold > 0
                    ? "bg-rose-50 text-rose-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target Attendance Simulator Card */}
      <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-base text-slate-900">Attendance Target Calculator</CardTitle>
            </div>
            <span className="text-xs text-slate-400 font-medium">B.Tech Debarment Threshold: 75%</span>
          </div>
          <CardDescription>
            Simulate your target percentage to calculate consecutive classes needed or safe margin of absence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700">Target Percentage</label>
                <span className="text-sm font-bold text-indigo-600">{targetPercentage}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="95"
                step="5"
                value={targetPercentage}
                onChange={(e) => setTargetPercentage(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>60%</span>
                <span className="text-rose-600 font-semibold">75% (Min)</span>
                <span>85%</span>
                <span>95%</span>
              </div>
            </div>

            <div className="md:col-span-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              {calcLoading ? (
                <div className="text-xs text-indigo-600">Calculating target scenarios...</div>
              ) : calcResult ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {calcResult.is_target_met ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : (
                      <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
                    )}
                    <span className="text-sm font-bold text-slate-900">
                      {calcResult.is_target_met ? "Target Currently Satisfied" : "Attendance Deficit Detected"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{calcResult.explanation}</p>
                  <div className="flex flex-wrap gap-4 pt-1 text-xs">
                    <div className="rounded-lg bg-white px-3 py-1.5 border border-indigo-100 shadow-2xs">
                      <span className="text-slate-500">Consecutive classes needed: </span>
                      <span className="font-bold text-indigo-700">{calcResult.consecutive_classes_needed}</span>
                    </div>
                    <div className="rounded-lg bg-white px-3 py-1.5 border border-indigo-100 shadow-2xs">
                      <span className="text-slate-500">Margin you can miss: </span>
                      <span className="font-bold text-emerald-700">{calcResult.can_miss_classes} classes</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Wise Attendance Breakdown */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base text-slate-900">Subject Breakdown</CardTitle>
          </div>
          <CardDescription>
            Detailed attendance log and consecutive class requirements per course.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-[10px] tracking-wider text-slate-400 border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Subject</th>
                  <th className="py-3 px-4 font-semibold text-center">Conducted</th>
                  <th className="py-3 px-4 font-semibold text-center">Attended</th>
                  <th className="py-3 px-4 font-semibold text-center">Missed</th>
                  <th className="py-3 px-4 font-semibold">Attendance Bar</th>
                  <th className="py-3 px-4 font-semibold text-center">Percentage</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Action Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary?.subjects && summary.subjects.length > 0 ? (
                  summary.subjects.map((sub) => {
                    const pct = sub.percentage;
                    const isAbove = pct >= 75;
                    return (
                      <tr key={sub.subject_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900">{sub.subject_name}</p>
                          {sub.subject_code && (
                            <p className="text-[11px] text-slate-400 font-mono">{sub.subject_code}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-medium text-slate-700">{sub.total_conducted}</td>
                        <td className="py-3.5 px-4 text-center font-medium text-emerald-700">{sub.total_attended}</td>
                        <td className="py-3.5 px-4 text-center font-medium text-rose-700">{sub.total_missed}</td>
                        <td className="py-3.5 px-4 min-w-[120px]">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isAbove ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                          {pct.toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge variant={isAbove ? "success" : "danger"}>
                            {sub.status || (isAbove ? "Compliant" : "Critical Warning")}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-center text-[11px]">
                          {sub.consecutive_classes_needed > 0 ? (
                            <span className="font-medium text-rose-600">
                              Attend next {sub.consecutive_classes_needed} classes
                            </span>
                          ) : (
                            <span className="font-medium text-emerald-600">
                              Can miss {sub.can_miss_classes ?? 0} classes
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No subject attendance records found. Click "Record Attendance" to log your first class!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Log Attendance Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Record Class Attendance"
      >
        <form onSubmit={handleLogSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code || "Course"})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Classes Conducted</label>
              <input
                type="number"
                min="1"
                max="10"
                value={conductedInput}
                onChange={(e) => setConductedInput(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Classes Attended</label>
              <input
                type="number"
                min="0"
                max={conductedInput}
                value={attendedInput}
                onChange={(e) => setAttendedInput(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Lab Session on Sorting Algorithms"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLogModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submittingLog}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {submittingLog ? "Saving..." : "Save Record"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
