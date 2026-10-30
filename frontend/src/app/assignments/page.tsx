"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { Assignment, AssignmentWorkload, Subject } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { Modal } from "@/components/shared/Modal";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { CheckSquare, Plus, Clock, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [workload, setWorkload] = useState<AssignmentWorkload | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Create Assignment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subjId, setSubjId] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estHours, setEstHours] = useState(2.0);
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  const loadData = async () => {
    try {
      const [asgData, wlData, subjData] = await Promise.all([
        apiClient<Assignment[]>("/assignments"),
        apiClient<AssignmentWorkload>("/assignments/workload"),
        apiClient<Subject[]>("/academic/subjects"),
      ]);
      setAssignments(asgData);
      setWorkload(wlData);
      setSubjects(subjData);
      if (subjData.length > 0 && !subjId) {
        setSubjId(subjData[0].id);
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

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    try {
      await apiClient("/assignments", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          subject_id: subjId || undefined,
          description: description || undefined,
          due_date: new Date(dueDate).toISOString(),
          estimated_duration_hours: Number(estHours),
          priority,
          status: "not_started",
        }),
      });
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (asg: Assignment) => {
    const nextStatus = asg.status === "completed" ? "in_progress" : "completed";
    try {
      await apiClient(`/assignments/${asg.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this assignment?")) {
      await apiClient(`/assignments/${id}`, { method: "DELETE" });
      await loadData();
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filterStatus === "all") return true;
    return a.status === filterStatus;
  });

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading assignments...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Assignments & Deadlines</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track coursework deadlines, workload balance, and completion efficiency.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" size="sm" className="space-x-1.5">
          <Plus className="h-3.5 w-3.5" />
          <span>New Assignment</span>
        </Button>
      </div>

      {/* 7-Day Workload Bar & Summary */}
      {workload && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Next 7 Days Workload Horizon</CardTitle>
                <CardDescription>
                  Estimated effort: <span className="font-semibold text-slate-800">{workload.total_estimated_hours_next_7_days} hours</span> across {workload.total_active} pending deliverables.
                </CardDescription>
              </div>
              <Badge variant="info">Completion Rate: {workload.completion_rate}%</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-center">
              {workload.upcoming_7_days.map((day) => (
                <div
                  key={day.date}
                  className={`rounded-xl border p-3 ${
                    day.assignments_count > 0 ? "border-brand-200 bg-brand-50/40" : "border-slate-100 bg-slate-50/50"
                  }`}
                >
                  <div className="text-[11px] font-semibold text-slate-500">{day.day_name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{day.date.slice(5)}</div>
                  <div className="my-2">
                    <span className="text-lg font-bold text-slate-900">{day.assignments_count}</span>
                    <span className="text-[10px] text-slate-500 block">due</span>
                  </div>
                  <div className="text-[10px] font-medium text-brand-700 bg-white/80 py-0.5 rounded border border-slate-200/60">
                    {day.estimated_hours}h
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>Assignments Directory</CardTitle>
            <div className="flex items-center space-x-2 text-xs">
              {["all", "not_started", "in_progress", "completed", "overdue"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                    filterStatus === st
                      ? "bg-slate-900 text-white font-medium"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No Assignments in this View"
              description="You're all caught up! Click 'New Assignment' to log upcoming deliverables."
              actionLabel="Add Assignment"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAssignments.map((a) => {
                const isDone = a.status === "completed";
                const priorityBadge =
                  a.priority === "urgent"
                    ? "danger"
                    : a.priority === "high"
                    ? "warning"
                    : "neutral";

                return (
                  <div key={a.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handleToggleStatus(a)}
                        className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                          isDone
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 hover:border-brand-500"
                        }`}
                      >
                        {isDone && <CheckCircle2 className="h-4 w-4" />}
                      </button>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-sm font-semibold ${isDone ? "line-through text-slate-400" : "text-slate-900"}`}>
                            {a.title}
                          </h4>
                          <Badge variant={priorityBadge as any}>{a.priority}</Badge>
                          {a.is_overdue && <Badge variant="danger">Overdue</Badge>}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center space-x-3">
                          <span>{a.subject_name || "General Coursework"}</span>
                          <span>•</span>
                          <span>Due: {formatDate(a.due_date)}</span>
                          <span>•</span>
                          <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {a.estimated_duration_hours || 2}h</span>
                        </div>
                        {a.description && (
                          <p className="text-xs text-slate-600 mt-1.5">{a.description}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: New Assignment */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Assignment">
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement Transformer Attention Layer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
              <select
                value={subjId}
                onChange={(e) => setSubjId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Due Date & Time</label>
              <input
                type="datetime-local"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Estimated Hours</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="50"
                value={estHours}
                onChange={(e) => setEstHours(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Requirements, rubric guidelines..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Assignment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
