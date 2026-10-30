"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { StudentProfile } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import {
  User,
  GraduationCap,
  Target,
  BookOpen,
  Save,
  CheckCircle,
  Briefcase,
  Code2,
  Clock,
  Sparkles,
} from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [institution, setInstitution] = useState("");
  const [degree, setDegree] = useState("B.Tech");
  const [branch, setBranch] = useState("Computer Science & Engineering (AIML)");
  const [currentYear, setCurrentYear] = useState(3);
  const [currentSemester, setCurrentSemester] = useState(6);
  const [expectedGraduationYear, setExpectedGraduationYear] = useState(2027);

  const [currentCgpa, setCurrentCgpa] = useState<number | "">("");
  const [previousCgpa, setPreviousCgpa] = useState<number | "">("");
  const [targetCgpa, setTargetCgpa] = useState<number | "">(9.0);

  const [preferredHours, setPreferredHours] = useState(3.0);
  const [primaryGoal, setPrimaryGoal] = useState("AI/ML Engineer");
  const [preferredLang, setPreferredLang] = useState("Python");
  const [skillLevel, setSkillLevel] = useState("Intermediate");

  const [weakSubjects, setWeakSubjects] = useState("");
  const [strongSubjects, setStrongSubjects] = useState("");

  const fetchProfile = async () => {
    try {
      setError(null);
      const data = await apiClient<StudentProfile>("/profile");
      setProfile(data);

      setDisplayName(data.display_name || "");
      setInstitution(data.institution || "");
      setDegree(data.degree || "B.Tech");
      setBranch(data.branch || "Computer Science & Engineering (AIML)");
      setCurrentYear(data.current_year || 3);
      setCurrentSemester(data.current_semester || 6);
      setExpectedGraduationYear(data.expected_graduation_year || 2027);

      setCurrentCgpa(data.current_cgpa ?? "");
      setPreviousCgpa(data.previous_semester_cgpa ?? "");
      setTargetCgpa(data.target_cgpa ?? 9.0);

      setPreferredHours(data.preferred_study_hours_per_day || 3.0);
      setPrimaryGoal(data.primary_career_goal || "AI/ML Engineer");
      setPreferredLang(data.preferred_programming_language || "Python");
      setSkillLevel(data.technical_skill_level || "Intermediate");

      setWeakSubjects(data.weak_subjects || "");
      setStrongSubjects(data.strong_subjects || "");
    } catch (err: any) {
      setError(err?.message || "Failed to load student profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const updated = await apiClient<StudentProfile>("/profile", {
        method: "PATCH",
        body: JSON.stringify({
          display_name: displayName.trim(),
          institution: institution.trim() || undefined,
          degree,
          branch,
          current_year: Number(currentYear),
          current_semester: Number(currentSemester),
          expected_graduation_year: Number(expectedGraduationYear),
          current_cgpa: currentCgpa === "" ? undefined : Number(currentCgpa),
          previous_semester_cgpa: previousCgpa === "" ? undefined : Number(previousCgpa),
          target_cgpa: targetCgpa === "" ? undefined : Number(targetCgpa),
          preferred_study_hours_per_day: Number(preferredHours),
          primary_career_goal: primaryGoal,
          preferred_programming_language: preferredLang,
          technical_skill_level: skillLevel,
          weak_subjects: weakSubjects.trim() || undefined,
          strong_subjects: strongSubjects.trim() || undefined,
        }),
      });
      setProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading student profile details...</p>
        </div>
      </div>
    );
  }

  // Calculate profile completeness
  const fields = [
    displayName,
    institution,
    degree,
    branch,
    currentCgpa,
    targetCgpa,
    primaryGoal,
    preferredLang,
    weakSubjects,
    strongSubjects,
  ];
  const filledCount = fields.filter((f) => f !== "" && f !== undefined && f !== null).length;
  const completenessPct = Math.round((filledCount / fields.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Profile & Academic Settings
          </h1>
          <p className="text-sm text-slate-500">
            Maintain your academic credentials, career target parameters, and subject focus notes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle className="h-4 w-4" />
              Saved Successfully
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Completeness Card */}
      <Card className="border-brand-100 bg-gradient-to-r from-brand-50/40 via-white to-slate-50">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white font-bold text-lg">
              {displayName ? displayName.charAt(0).toUpperCase() : "S"}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{displayName || "Student"}</h3>
              <p className="text-xs text-slate-500">
                {branch} &bull; Year {currentYear}, Sem {currentSemester}
              </p>
            </div>
          </div>

          <div className="w-48 space-y-1">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Profile Completeness</span>
              <span className="font-bold text-brand-600">{completenessPct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-brand-600 h-2 rounded-full transition-all"
                style={{ width: `${completenessPct}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Institutional Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-brand-600" />
              Institutional & Curriculum Details
            </CardTitle>
            <CardDescription>Academic enrollment and current collegiate status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">Display Name *</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Institution / College Name</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. National Institute of Technology"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">Degree Program</label>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Branch / Specialization</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">Current Academic Year</label>
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Current Semester</label>
                <select
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Graduation Year</label>
                <input
                  type="number"
                  min="2024"
                  max="2032"
                  value={expectedGraduationYear}
                  onChange={(e) => setExpectedGraduationYear(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: CGPA Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-brand-600" />
              Cumulative Grade Benchmarks
            </CardTitle>
            <CardDescription>Academic targets and semester GPA records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">Current Cumulative CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={currentCgpa}
                  onChange={(e) => setCurrentCgpa(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 8.45"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Previous Semester SGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={previousCgpa}
                  onChange={(e) => setPreviousCgpa(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 8.20"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Target CGPA Goal</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={targetCgpa}
                  onChange={(e) => setTargetCgpa(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 9.00"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Career Aspirations & Habits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-brand-600" />
              Career Aspirations & Learning Preferences
            </CardTitle>
            <CardDescription>Configures personalized skill gaps and study schedules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">Primary Career Goal</label>
                <select
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="AI/ML Engineer">AI/ML Engineer</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Software Development Engineer (SDE)">Software Development Engineer (SDE)</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Cloud / DevOps Engineer">Cloud / DevOps Engineer</option>
                  <option value="Cybersecurity Analyst">Cybersecurity Analyst</option>
                  <option value="Higher Studies (M.Tech / MS)">Higher Studies (M.Tech / MS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Preferred Language</label>
                <select
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="Python">Python</option>
                  <option value="C++">C++</option>
                  <option value="Java">Java</option>
                  <option value="TypeScript / JavaScript">TypeScript / JavaScript</option>
                  <option value="Go">Go</option>
                  <option value="Rust">Rust</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">Technical Skill Level</label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="Beginner">Beginner (Foundations & Syntax)</option>
                  <option value="Intermediate">Intermediate (DSA & Projects)</option>
                  <option value="Advanced">Advanced (Complex Systems & Research)</option>
                  <option value="Expert">Expert (Production & Competitive Pro)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Target Daily Study Hours: {preferredHours} hrs/day
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={preferredHours}
                  onChange={(e) => setPreferredHours(Number(e.target.value))}
                  className="mt-2 w-full accent-brand-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Subject Self-Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-brand-600" />
              Subject Self-Assessment Notes
            </CardTitle>
            <CardDescription>Informs automated recommendations and priority planner allocations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">Subjects Needing Attention (Weak)</label>
                <textarea
                  rows={3}
                  value={weakSubjects}
                  onChange={(e) => setWeakSubjects(e.target.value)}
                  placeholder="e.g. Discrete Mathematics, Computer Networks"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">High Confidence Subjects (Strong)</label>
                <textarea
                  rows={3}
                  value={strongSubjects}
                  onChange={(e) => setStrongSubjects(e.target.value)}
                  placeholder="e.g. Data Structures, Machine Learning, Operating Systems"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" loading={saving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
