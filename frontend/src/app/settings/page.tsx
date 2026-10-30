"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import {
  Settings,
  Bell,
  Database,
  Info,
  Trash2,
  Download,
  Server,
  Shield,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  // Notifications toggles in localStorage
  const [dailyReminder, setDailyReminder] = useState(true);
  const [attendanceAlert, setAttendanceAlert] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Check backend health
    async function checkHealth() {
      try {
        const res = await fetch("http://localhost:8000/health");
        if (res.ok) {
          setBackendStatus("online");
        } else {
          setBackendStatus("offline");
        }
      } catch {
        setBackendStatus("offline");
      }
    }
    checkHealth();

    // Load notification preferences from localStorage
    const savedDaily = localStorage.getItem("setting_daily_reminder");
    if (savedDaily !== null) setDailyReminder(savedDaily === "true");

    const savedAtt = localStorage.getItem("setting_attendance_alert");
    if (savedAtt !== null) setAttendanceAlert(savedAtt === "true");

    const savedWeekly = localStorage.getItem("setting_weekly_digest");
    if (savedWeekly !== null) setWeeklyDigest(savedWeekly === "true");
  }, []);

  const handleToggleDaily = (val: boolean) => {
    setDailyReminder(val);
    localStorage.setItem("setting_daily_reminder", String(val));
  };

  const handleToggleAttendance = (val: boolean) => {
    setAttendanceAlert(val);
    localStorage.setItem("setting_attendance_alert", String(val));
  };

  const handleToggleWeekly = (val: boolean) => {
    setWeeklyDigest(val);
    localStorage.setItem("setting_weekly_digest", String(val));
  };

  const handleExportData = async () => {
    try {
      const [profile, twin] = await Promise.all([
        apiClient<any>("/profile"),
        apiClient<any>("/digital-twin/current"),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        profile,
        digital_twin: twin,
        disclaimer: "StudentOS Personal Data Export",
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `studentos_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      alert("Failed to export data: " + (err?.message || "Unknown error"));
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") return;
    setDeleting(true);
    try {
      await apiClient("/auth/account", { method: "DELETE" });
      alert("Your account and all associated data have been deleted.");
      logout();
    } catch (err: any) {
      alert("Account deletion failed: " + (err?.message || "Unknown error"));
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Application Settings</h1>
        <p className="text-sm text-slate-500">
          Manage system preferences, notifications, data export, and infrastructure connectivity.
        </p>
      </div>

      {/* Backend Infrastructure Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-brand-600" />
              <CardTitle className="text-base">System Health & API Connection</CardTitle>
            </div>
            <Badge variant={backendStatus === "online" ? "success" : "danger"}>
              {backendStatus === "checking"
                ? "Checking..."
                : backendStatus === "online"
                ? "Backend Online"
                : "Backend Offline"}
            </Badge>
          </div>
          <CardDescription>Status of the local FastAPI backend and SQLite database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-slate-600">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span>API Gateway</span>
            <span className="font-mono text-slate-800">http://localhost:8000/api/v1</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span>ML Inference Engine</span>
            <span className="font-mono text-emerald-600 font-semibold">scikit-learn (Loaded)</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Authenticated User</span>
            <span className="font-mono text-slate-800">{user?.email || "demo@studentos.internal"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-brand-600" />
            <CardTitle className="text-base">Alerts & Notification Preferences</CardTitle>
          </div>
          <CardDescription>Configure in-app alert thresholds and study reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Attendance Threshold Warning</span>
              <span className="text-[11px] text-slate-500">Alert immediately when attendance in any subject drops below 75%</span>
            </div>
            <input
              type="checkbox"
              checked={attendanceAlert}
              onChange={(e) => handleToggleAttendance(e.target.checked)}
              className="h-4 w-4 rounded text-brand-600 accent-brand-600"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Daily Study Log Reminders</span>
              <span className="text-[11px] text-slate-500">Prompt daily at 21:00 to log study hours, focus, and DSA problem counts</span>
            </div>
            <input
              type="checkbox"
              checked={dailyReminder}
              onChange={(e) => handleToggleDaily(e.target.checked)}
              className="h-4 w-4 rounded text-brand-600 accent-brand-600"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Weekly Progress Digest</span>
              <span className="text-[11px] text-slate-500">Summarize week-over-week consistency score and assignment completion</span>
            </div>
            <input
              type="checkbox"
              checked={weeklyDigest}
              onChange={(e) => handleToggleWeekly(e.target.checked)}
              className="h-4 w-4 rounded text-brand-600 accent-brand-600"
            />
          </label>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-brand-600" />
            <CardTitle className="text-base">Data Ownership & Privacy</CardTitle>
          </div>
          <CardDescription>Export your academic profile or request account erasure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <h4 className="text-xs font-semibold text-slate-900">Export All StudentOS Data</h4>
              <p className="text-[11px] text-slate-500">
                Download a complete JSON archive of your subjects, attendance logs, and digital twin snapshots.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export JSON
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-red-200 bg-red-50/40">
            <div>
              <h4 className="text-xs font-semibold text-red-900">Delete Account & Academic Records</h4>
              <p className="text-[11px] text-red-600">
                Permanently purge all user data, digital twin snapshots, and history from local storage.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About Project */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-brand-600" />
            <CardTitle className="text-base">About StudentOS</CardTitle>
          </div>
          <CardDescription>B.Tech Computer Science & Engineering (AIML) Innovative Project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-slate-600">
          <p>
            <strong>Full Title:</strong> StudentOS: An AI-Powered Digital Twin for Personalized Student Success
          </p>
          <p>
            <strong>Core Pillars:</strong> Track. Predict. Simulate. Improve.
          </p>
          <p>
            <strong>Software Stack:</strong> Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, FastAPI, SQLAlchemy, scikit-learn.
          </p>
          <p className="text-slate-400 text-[11px] pt-1">
            Build Version: 1.0.0-production &bull; Free and Open Source Architecture
          </p>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Account Deletion"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
            <AlertTriangle className="h-5 w-5" />
            <span>This action cannot be undone</span>
          </div>
          <p>
            Deleting your account will permanently wipe all enrolled subjects, attendance records, study logs, coding progress, and generated digital twin snapshots.
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Type <strong className="text-red-600 font-mono">DELETE</strong> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE"
              className="mt-1.5 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleteConfirmation !== "DELETE"}
              loading={deleting}
              onClick={handleDeleteAccount}
            >
              Confirm Permanent Erasure
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
