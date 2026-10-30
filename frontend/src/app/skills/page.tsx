"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { StudentSkill, SkillGapAnalysis } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { Modal } from "@/components/shared/Modal";
import { EmptyState } from "@/components/shared/EmptyState";
import { Award, Plus, Target, Briefcase, Trash2, ArrowUpRight } from "lucide-react";

export default function SkillsPage() {
  const [skills, setSkills] = useState<StudentSkill[]>([]);
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  // Add Skill Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Programming Languages");
  const [currentProf, setCurrentProf] = useState(60);
  const [targetProf, setTargetProf] = useState(85);
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    try {
      const [skillsData, analysisData] = await Promise.all([
        apiClient<StudentSkill[]>("/skills"),
        apiClient<SkillGapAnalysis>("/skills/analysis"),
      ]);
      setSkills(skillsData);
      setAnalysis(analysisData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await apiClient("/skills", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          category,
          current_proficiency: Number(currentProf),
          target_proficiency: Number(targetProf),
          notes: notes || undefined,
        }),
      });
      setIsModalOpen(false);
      setName("");
      setNotes("");
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProficiency = async (skill: StudentSkill, delta: number) => {
    const newProf = Math.min(100, Math.max(0, skill.current_proficiency + delta));
    try {
      await apiClient(`/skills/${skill.id}`, {
        method: "PATCH",
        body: JSON.stringify({ current_proficiency: newProf }),
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this skill from tracking?")) {
      await apiClient(`/skills/${id}`, { method: "DELETE" });
      await loadData();
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading technical skills...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Technical Skills & Gap Analysis</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track technical competencies against industry roles and identify high-priority skill gaps.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" size="sm" className="space-x-1.5">
          <Plus className="h-3.5 w-3.5" />
          <span>Add Technical Skill</span>
        </Button>
      </div>

      {/* Career Role Readiness Cards */}
      {analysis && analysis.career_role_readiness.length > 0 && (
        <Card className="border-brand-200/80 bg-gradient-to-br from-white via-white to-brand-50/20">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-brand-100 text-brand-700">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Industry Career Role Readiness</CardTitle>
                <CardDescription>
                  Evaluates your current proficiency against benchmark requirements for target software roles.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analysis.career_role_readiness.map((role) => (
                <div key={role.role_name} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-slate-900 text-sm">{role.role_name}</h4>
                      <Badge variant={role.readiness_percentage >= 75 ? "success" : role.readiness_percentage >= 50 ? "info" : "warning"}>
                        {role.readiness_percentage.toFixed(0)}% Ready
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">{role.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">Missing or In-Progress:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {role.missing_skills.slice(0, 2).map((m, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Identified Gaps Banner */}
      {analysis && analysis.top_skill_gaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Highest Priority Skill Gaps</CardTitle>
            <CardDescription>
              Calculated via: <code className="text-brand-600 bg-brand-50 px-1 py-0.5 rounded">max(0, Target - Current)</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {analysis.top_skill_gaps.slice(0, 3).map((gap) => (
                <div key={gap.skill_name} className="rounded-xl border border-amber-200 bg-amber-50/30 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">{gap.skill_name}</span>
                    <Badge variant="warning">Gap: {gap.gap}%</Badge>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    Current: <strong>{gap.current_proficiency}%</strong> • Target: <strong>{gap.target_proficiency}%</strong>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${gap.current_proficiency}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Skills Directory */}
      <Card>
        <CardHeader>
          <CardTitle>All Tracked Skills ({skills.length})</CardTitle>
          <CardDescription>Adjust proficiency sliders as you complete projects and laboratory assessments.</CardDescription>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No Skills Added"
              description="Add languages, algorithms, and frameworks to monitor your technical development."
              actionLabel="Add Skill"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map((s) => (
                <div key={s.id} className="rounded-xl border border-slate-200/80 p-4 bg-white shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{s.name}</h4>
                      <span className="text-xs text-slate-400">{s.category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-brand-600">{s.current_proficiency}%</span>
                      <button onClick={() => handleDelete(s.id)} className="text-slate-300 hover:text-red-600 p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden relative">
                      {/* Target Indicator */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-slate-400 z-10"
                        style={{ left: `${s.target_proficiency}%` }}
                        title={`Target: ${s.target_proficiency}%`}
                      />
                      <div
                        className="h-full rounded-full bg-brand-600"
                        style={{ width: `${s.current_proficiency}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Proficiency: {s.current_proficiency}%</span>
                      <span>Target: {s.target_proficiency}% (Gap: {s.skill_gap}%)</span>
                    </div>
                  </div>

                  {/* Quick Adjust Buttons */}
                  <div className="mt-3 flex items-center space-x-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleUpdateProficiency(s, -5)}
                      className="px-2 py-1 text-[11px] rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      -5%
                    </button>
                    <button
                      onClick={() => handleUpdateProficiency(s, +5)}
                      className="px-2 py-1 text-[11px] rounded bg-brand-50 text-brand-700 hover:bg-brand-100 font-medium"
                    >
                      +5%
                    </button>
                    <button
                      onClick={() => handleUpdateProficiency(s, +10)}
                      className="px-2 py-1 text-[11px] rounded bg-brand-50 text-brand-700 hover:bg-brand-100 font-medium"
                    >
                      +10%
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Add Skill */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Technical Skill">
        <form onSubmit={handleCreateSkill} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Skill Name</label>
            <input
              type="text"
              required
              placeholder="e.g. PyTorch, Kubernetes, Go"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
            >
              <option value="Programming Languages">Programming Languages</option>
              <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
              <option value="AI/ML">AI / Machine Learning</option>
              <option value="Databases">Databases & SQL</option>
              <option value="Backend Development">Backend Development</option>
              <option value="Cloud/DevOps">Cloud & DevOps</option>
              <option value="Core CS">Core Computer Science</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Current Proficiency: <span className="font-bold text-brand-600">{currentProf}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={currentProf}
                onChange={(e) => setCurrentProf(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Proficiency: <span className="font-bold text-brand-600">{targetProf}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={targetProf}
                onChange={(e) => setTargetProf(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Projects built, certifications, topics mastered..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Skill</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
