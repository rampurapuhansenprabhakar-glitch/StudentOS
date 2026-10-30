"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { AcademicOverview, Subject, Assessment } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { Modal } from "@/components/shared/Modal";
import { EmptyState } from "@/components/shared/EmptyState";
import { GraduationCap, Plus, Trash2, BookOpen, AlertCircle } from "lucide-react";

export default function AcademicPage() {
  const [overview, setOverview] = useState<AcademicOverview | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isSubjModalOpen, setIsSubjModalOpen] = useState(false);
  const [isAsmModalOpen, setIsAsmModalOpen] = useState(false);

  // Subject Form
  const [newSubjName, setNewSubjName] = useState("");
  const [newSubjCode, setNewSubjCode] = useState("");
  const [newSubjCredits, setNewSubjCredits] = useState(3);
  const [newSubjTargetAtt, setNewSubjTargetAtt] = useState(75);

  // Assessment Form
  const [asmSubjId, setAsmSubjId] = useState("");
  const [asmName, setAsmName] = useState("");
  const [asmType, setAsmType] = useState("internal");
  const [asmMarks, setAsmMarks] = useState<number | "">("");
  const [asmMaxMarks, setAsmMaxMarks] = useState<number | "">(50);
  const [asmNotes, setAsmNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [ovData, subjData, asmData] = await Promise.all([
        apiClient<AcademicOverview>("/academic/overview"),
        apiClient<Subject[]>("/academic/subjects"),
        apiClient<Assessment[]>("/academic/assessments"),
      ]);
      setOverview(ovData);
      setSubjects(subjData);
      setAssessments(asmData);
      if (subjData.length > 0 && !asmSubjId) {
        setAsmSubjId(subjData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;
    try {
      await apiClient("/academic/subjects", {
        method: "POST",
        body: JSON.stringify({
          name: newSubjName.trim(),
          code: newSubjCode.trim() || undefined,
          credits: Number(newSubjCredits),
          target_attendance: Number(newSubjTargetAtt),
        }),
      });
      setIsSubjModalOpen(false);
      setNewSubjName("");
      setNewSubjCode("");
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || "Failed to add subject");
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (Number(asmMarks) > Number(asmMaxMarks)) {
      setFormError("Marks obtained cannot exceed maximum marks.");
      return;
    }
    try {
      await apiClient("/academic/assessments", {
        method: "POST",
        body: JSON.stringify({
          subject_id: asmSubjId,
          name: asmName,
          assessment_type: asmType,
          marks_obtained: Number(asmMarks),
          max_marks: Number(asmMaxMarks),
          date: new Date().toISOString().split("T")[0],
          notes: asmNotes || undefined,
        }),
      });
      setIsAsmModalOpen(false);
      setAsmName("");
      setAsmMarks("");
      setAsmNotes("");
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || "Failed to record assessment");
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (confirm("Are you sure you want to delete this assessment?")) {
      await apiClient(`/academic/assessments/${id}`, { method: "DELETE" });
      await loadData();
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading academic records...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Academic Performance</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track subjects, internal marks, weightages, and performance trends.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setIsSubjModalOpen(true)} variant="outline" size="sm" className="space-x-1">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Subject</span>
          </Button>
          <Button onClick={() => setIsAsmModalOpen(true)} variant="primary" size="sm" className="space-x-1">
            <Plus className="h-3.5 w-3.5" />
            <span>Record Marks</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500">Overall Assessment Average</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{overview?.overall_marks_average.toFixed(1)}%</div>
          <span className="text-[11px] text-slate-400">Across all completed assessments</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500">Enrolled Subjects</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{overview?.total_subjects || 0}</div>
          <span className="text-[11px] text-slate-400">Semester 6 curriculum</span>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500">Total Assessments Recorded</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{overview?.total_assessments || 0}</div>
          <span className="text-[11px] text-slate-400">Internal exams, quizzes & labs</span>
        </Card>
      </div>

      {/* Subject Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance Breakdown</CardTitle>
          <CardDescription>Performance status computed from normalized assessment percentages.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overview?.subject_summaries.map((s) => (
              <div key={s.subject_id} className="rounded-xl border border-slate-200/80 p-4 bg-white shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{s.subject_name}</h4>
                    <span className="text-xs text-slate-400">{s.subject_code} • {s.credits} Credits</span>
                  </div>
                  <Badge variant={s.status === "Strong" ? "success" : s.status === "Moderate" ? "info" : "warning"}>
                    {s.status}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                  <div>
                    <span className="text-slate-400">Assessment Avg:</span>
                    <div className="font-bold text-slate-800 text-sm">{s.average_percentage.toFixed(1)}%</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Attendance:</span>
                    <div className={`font-bold text-sm ${s.attendance_percentage < 75 ? "text-red-600" : "text-slate-800"}`}>
                      {s.attendance_percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assessment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Records History</CardTitle>
          <CardDescription>Detailed log of tests, exams, quizzes, and project evaluations.</CardDescription>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Assessment Records Found"
              description="Record your internal exam and quiz scores to start training your digital twin."
              actionLabel="Add Assessment"
              onAction={() => setIsAsmModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Assessment</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Percentage</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assessments.map((a) => {
                    const subj = subjects.find((s) => s.id === a.subject_id);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-500">{a.date}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{a.name}</div>
                          <div className="text-[11px] text-slate-400">{subj?.name || "Subject"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {a.assessment_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {a.marks_obtained} / {a.max_marks}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${a.percentage >= 75 ? "text-emerald-600" : a.percentage >= 60 ? "text-brand-600" : "text-amber-600"}`}>
                            {a.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteAssessment(a.id)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Add Subject */}
      <Modal isOpen={isSubjModalOpen} onClose={() => setIsSubjModalOpen(false)} title="Add New Subject">
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Subject Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Operating Systems"
              value={newSubjName}
              onChange={(e) => setNewSubjName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Course Code</label>
              <input
                type="text"
                placeholder="CS605"
                value={newSubjCode}
                onChange={(e) => setNewSubjCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Credits</label>
              <select
                value={newSubjCredits}
                onChange={(e) => setNewSubjCredits(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              >
                <option value={1}>1 Credit</option>
                <option value={2}>2 Credits</option>
                <option value={3}>3 Credits</option>
                <option value={4}>4 Credits</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Target Attendance (%)</label>
            <input
              type="number"
              value={newSubjTargetAtt}
              onChange={(e) => setNewSubjTargetAtt(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsSubjModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Subject</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Assessment */}
      <Modal isOpen={isAsmModalOpen} onClose={() => setIsAsmModalOpen(false)} title="Record Assessment Marks">
        <form onSubmit={handleCreateAssessment} className="space-y-4">
          {formError && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs flex items-center space-x-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
            <select
              value={asmSubjId}
              onChange={(e) => setAsmSubjId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code || "No code"})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Assessment Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Midterm Exam 1"
              value={asmName}
              onChange={(e) => setAsmName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
              <select
                value={asmType}
                onChange={(e) => setAsmType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              >
                <option value="internal">Internal</option>
                <option value="midterm">Midterm</option>
                <option value="quiz">Quiz</option>
                <option value="lab">Lab</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Marks Obtained</label>
              <input
                type="number"
                step="0.5"
                required
                value={asmMarks}
                onChange={(e) => setAsmMarks(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Max Marks</label>
              <input
                type="number"
                step="0.5"
                required
                value={asmMaxMarks}
                onChange={(e) => setAsmMaxMarks(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              value={asmNotes}
              onChange={(e) => setAsmNotes(e.target.value)}
              placeholder="Key topics tested or mistakes made..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAsmModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Assessment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
