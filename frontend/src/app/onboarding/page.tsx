"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/shared/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/shared/Card";
import { CheckCircle2, ChevronRight, ChevronLeft, Plus, Trash2, Sparkles } from "lucide-react";

interface SubjectInput {
  name: string;
  code: string;
  credits: number;
  target_attendance: number;
  initial_conducted: number;
  initial_attended: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Personal Profile
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [institution, setInstitution] = useState("National Institute of Technology");
  const [degree, setDegree] = useState("B.Tech");
  const [branch, setBranch] = useState("Computer Science & Engineering (AIML)");
  const [currentYear, setCurrentYear] = useState(3);
  const [currentSemester, setCurrentSemester] = useState(6);
  const [gradYear, setGradYear] = useState(2027);
  const [currentCgpa, setCurrentCgpa] = useState<number | "">(7.8);
  const [prevCgpa, setPrevCgpa] = useState<number | "">(7.5);
  const [targetCgpa, setTargetCgpa] = useState(8.8);
  const [studyHours, setStudyHours] = useState(3.5);
  const [careerGoal, setCareerGoal] = useState("AI/ML Engineer");
  const [primaryLang, setPrimaryLang] = useState("Python");
  const [skillLevel, setSkillLevel] = useState("Intermediate");

  // Step 2: Subjects
  const [subjects, setSubjects] = useState<SubjectInput[]>([
    { name: "Machine Learning", code: "CS601", credits: 4, target_attendance: 75, initial_conducted: 24, initial_attended: 22 },
    { name: "Deep Learning", code: "CS602", credits: 4, target_attendance: 80, initial_conducted: 22, initial_attended: 20 },
    { name: "Computer Networks", code: "CS603", credits: 3, target_attendance: 75, initial_conducted: 26, initial_attended: 18 },
  ]);

  const [newSubjName, setNewSubjName] = useState("");
  const [newSubjCode, setNewSubjCode] = useState("");
  const [newSubjCredits, setNewSubjCredits] = useState(3);

  // Step 3: Preferences
  const [weakSubjects, setWeakSubjects] = useState("Computer Networks");
  const [strongSubjects, setStrongSubjects] = useState("Machine Learning, Python");

  // Step 4: Technical Skills
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "Python",
    "Machine Learning",
    "Data Structures & Algorithms",
    "SQL & Databases",
  ]);
  const [customSkill, setCustomSkill] = useState("");

  const availableSkillsList = [
    "Python", "Java", "C++", "TypeScript",
    "Data Structures & Algorithms", "SQL & Databases",
    "Operating Systems", "Computer Networks",
    "Machine Learning", "Deep Learning",
    "Backend Development (FastAPI/Node)", "React / Next.js",
    "Docker & DevOps", "Cloud Computing"
  ];

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills([...selectedSkills, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const addSubject = () => {
    if (newSubjName.trim()) {
      setSubjects([
        ...subjects,
        {
          name: newSubjName.trim(),
          code: newSubjCode.trim() || `CS${subjects.length + 601}`,
          credits: newSubjCredits,
          target_attendance: 75,
          initial_conducted: 0,
          initial_attended: 0,
        },
      ]);
      setNewSubjName("");
      setNewSubjCode("");
      setNewSubjCredits(3);
    }
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiClient("/profile/onboarding", {
        method: "POST",
        body: JSON.stringify({
          display_name: displayName || user?.display_name || "Student",
          institution,
          degree,
          branch,
          current_year: Number(currentYear),
          current_semester: Number(currentSemester),
          expected_graduation_year: Number(gradYear),
          current_cgpa: currentCgpa === "" ? null : Number(currentCgpa),
          previous_semester_cgpa: prevCgpa === "" ? null : Number(prevCgpa),
          target_cgpa: Number(targetCgpa),
          preferred_study_hours_per_day: Number(studyHours),
          primary_career_goal: careerGoal,
          preferred_programming_language: primaryLang,
          technical_skill_level: skillLevel,
          subjects,
          weak_subjects: weakSubjects,
          strong_subjects: strongSubjects,
          initial_skills: selectedSkills,
        }),
      });

      await refreshUser();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to save onboarding profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full mb-3 border border-brand-200">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Digital Twin Calibration Wizard</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Setup Your Student Profile</h1>
          <p className="text-xs text-slate-500 mt-1">Step {step} of 5: {
            step === 1 ? "Academic Profile" :
            step === 2 ? "Semester Subjects" :
            step === 3 ? "Study Target & Preferences" :
            step === 4 ? "Technical Skills" : "Review & Initialize Twin"
          }</p>

          <div className="mt-4 flex items-center justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step ? "w-8 bg-brand-600" : s < step ? "w-4 bg-emerald-500" : "w-4 bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Academic & Personal Profile</CardTitle>
              <CardDescription>Tell us about your institution, current program, and academic baseline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">College / Institution</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Degree</label>
                  <input
                    type="text"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Current Year</label>
                  <select
                    value={currentYear}
                    onChange={(e) => setCurrentYear(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Semester</label>
                  <select
                    value={currentSemester}
                    onChange={(e) => setCurrentSemester(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Current CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={currentCgpa}
                    onChange={(e) => setCurrentCgpa(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Previous Sem CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={prevCgpa}
                    onChange={(e) => setPrevCgpa(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={targetCgpa}
                    onChange={(e) => setTargetCgpa(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Primary Career Goal</label>
                  <select
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    <option value="AI/ML Engineer">AI/ML Engineer</option>
                    <option value="Software Engineer (Backend)">Software Engineer (Backend)</option>
                    <option value="Full Stack Engineer">Full Stack Engineer</option>
                    <option value="Data Scientist">Data Scientist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Preferred Language</label>
                  <select
                    value={primaryLang}
                    onChange={(e) => setPrimaryLang(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    <option value="Python">Python</option>
                    <option value="Java">Java</option>
                    <option value="C++">C++</option>
                    <option value="TypeScript">TypeScript</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setStep(2)}>Next: Subjects <ChevronRight className="ml-1.5 h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Current Semester Subjects & Attendance</CardTitle>
              <CardDescription>Enter the subjects you are taking in Semester {currentSemester}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {subjects.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm">
                    <div>
                      <div className="font-semibold text-slate-900">{s.name} <span className="text-xs font-normal text-slate-500">({s.code})</span></div>
                      <div className="text-xs text-slate-500">Credits: {s.credits} • Attendance: {s.initial_attended}/{s.initial_conducted} classes ({s.initial_conducted > 0 ? ((s.initial_attended/s.initial_conducted)*100).toFixed(0) : 100}%)</div>
                    </div>
                    <button onClick={() => removeSubject(idx)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-semibold text-slate-800 mb-2">Add Another Subject</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Subject Name"
                    value={newSubjName}
                    onChange={(e) => setNewSubjName(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Code (e.g. CS604)"
                    value={newSubjCode}
                    onChange={(e) => setNewSubjCode(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none"
                  />
                  <div className="flex space-x-2">
                    <select
                      value={newSubjCredits}
                      onChange={(e) => setNewSubjCredits(Number(e.target.value))}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none flex-1"
                    >
                      <option value={1}>1 Credit</option>
                      <option value={2}>2 Credits</option>
                      <option value={3}>3 Credits</option>
                      <option value={4}>4 Credits</option>
                    </select>
                    <Button onClick={addSubject} size="sm" variant="secondary"><Plus className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="mr-1 h-4 w-4" /> Back</Button>
                <Button onClick={() => setStep(3)}>Next: Preferences <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Study Habits & Priorities</CardTitle>
              <CardDescription>Tell your digital twin about your focus areas and daily commitment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Daily Study Duration: <span className="font-bold text-brand-600">{studyHours} hours/day</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={studyHours}
                  onChange={(e) => setStudyHours(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Weaker Subjects (comma-separated)</label>
                <input
                  type="text"
                  value={weakSubjects}
                  onChange={(e) => setWeakSubjects(e.target.value)}
                  placeholder="e.g. Computer Networks, Theory of Computation"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Study Planner will allocate extra revision blocks for these subjects.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Strong Subjects (comma-separated)</label>
                <input
                  type="text"
                  value={strongSubjects}
                  onChange={(e) => setStrongSubjects(e.target.value)}
                  placeholder="e.g. Machine Learning, Python"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="mr-1 h-4 w-4" /> Back</Button>
                <Button onClick={() => setStep(4)}>Next: Skills <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Technical Skills Selection</CardTitle>
              <CardDescription>Select the technical competencies currently in your learning portfolio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {availableSkillsList.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isSelected
                          ? "bg-brand-600 text-white border-brand-600"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {skill} {isSelected ? "✓" : "+"}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  placeholder="Define custom skill (e.g. PyTorch, Kubernetes)..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs flex-1 focus:outline-none"
                />
                <Button onClick={addCustomSkill} size="sm" variant="secondary">Add Skill</Button>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(3)}><ChevronLeft className="mr-1 h-4 w-4" /> Back</Button>
                <Button onClick={() => setStep(5)}>Next: Review <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Initialize Digital Twin</CardTitle>
              <CardDescription>Verify your data before starting your evolving digital twin profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs space-y-2">
                <div><span className="font-semibold text-slate-700">Student:</span> {displayName} ({degree} {branch}, Year {currentYear})</div>
                <div><span className="font-semibold text-slate-700">CGPA Baseline:</span> Current: {currentCgpa || "N/A"} • Target: {targetCgpa}</div>
                <div><span className="font-semibold text-slate-700">Career Goal:</span> {careerGoal} ({primaryLang})</div>
                <div><span className="font-semibold text-slate-700">Daily Target:</span> {studyHours} hours/day</div>
                <div><span className="font-semibold text-slate-700">Subjects ({subjects.length}):</span> {subjects.map((s) => s.name).join(", ")}</div>
                <div><span className="font-semibold text-slate-700">Skills ({selectedSkills.length}):</span> {selectedSkills.join(", ")}</div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(4)}><ChevronLeft className="mr-1 h-4 w-4" /> Edit</Button>
                <Button onClick={handleFinish} loading={loading} variant="primary">
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Complete & Launch Twin
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
