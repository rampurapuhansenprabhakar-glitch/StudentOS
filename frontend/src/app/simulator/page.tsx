"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import {
  DigitalTwinResponse,
  SimulationParameters,
  SimulationResult,
  SimulationScenarioResponse,
} from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Sliders,
  Play,
  RotateCcw,
  Save,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Info,
  CheckCircle,
  Clock,
  BookOpen,
} from "lucide-react";

export default function SimulatorPage() {
  const [baselineTwin, setBaselineTwin] = useState<DigitalTwinResponse | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<SimulationScenarioResponse[]>([]);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scenario input
  const [scenarioName, setScenarioName] = useState("Target Study & Attendance Improvement");

  // Slider parameters
  const [studyHours, setStudyHours] = useState(3.5);
  const [attendance, setAttendance] = useState(85);
  const [assignmentRate, setAssignmentRate] = useState(90);
  const [internalAvg, setInternalAvg] = useState(78);
  const [codingHours, setCodingHours] = useState(1.5);
  const [consistency, setConsistency] = useState(80);

  const fetchData = async () => {
    try {
      setError(null);
      const [twinData, scenariosData] = await Promise.all([
        apiClient<DigitalTwinResponse>("/digital-twin/current"),
        apiClient<SimulationScenarioResponse[]>("/simulations"),
      ]);
      setBaselineTwin(twinData);
      setSavedScenarios(scenariosData);

      // Initialize sliders with baseline values if available
      if (twinData) {
        setStudyHours(twinData.behavioral_state.daily_study_hours || 3.0);
        setAttendance(Math.round(twinData.academic_state.attendance_percentage || 80));
        setAssignmentRate(Math.round(twinData.behavioral_state.assignment_completion_rate || 85));
        setInternalAvg(Math.round(twinData.academic_state.internal_assessment_avg || 75));
        setCodingHours(
          Number((((twinData.coding_state.coding_hours_per_week || 7) / 7)).toFixed(1))
        );
        setConsistency(Math.round(twinData.behavioral_state.study_consistency_score || 70));
      }
    } catch (err: any) {
      setError(err?.message || "Failed to initialize simulation workspace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetToBaseline = () => {
    if (!baselineTwin) return;
    setStudyHours(baselineTwin.behavioral_state.daily_study_hours || 3.0);
    setAttendance(Math.round(baselineTwin.academic_state.attendance_percentage || 80));
    setAssignmentRate(Math.round(baselineTwin.behavioral_state.assignment_completion_rate || 85));
    setInternalAvg(Math.round(baselineTwin.academic_state.internal_assessment_avg || 75));
    setCodingHours(
      Number((((baselineTwin.coding_state.coding_hours_per_week || 7) / 7)).toFixed(1))
    );
    setConsistency(Math.round(baselineTwin.behavioral_state.study_consistency_score || 70));
    setSimulationResult(null);
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setError(null);

    const params: SimulationParameters = {
      daily_study_hours: Number(studyHours),
      attendance_percentage: Number(attendance),
      assignment_completion_rate: Number(assignmentRate),
      internal_assessment_average: Number(internalAvg),
      coding_hours_per_day: Number(codingHours),
      study_consistency: Number(consistency),
    };

    try {
      const result = await apiClient<SimulationResult>("/simulations/run", {
        method: "POST",
        body: JSON.stringify({
          scenario_name: scenarioName.trim() || "Hypothetical Scenario",
          parameters: params,
        }),
      });
      setSimulationResult(result);
    } catch (err: any) {
      setError(err?.message || "Simulation execution failed");
    } finally {
      setSimulating(false);
    }
  };

  const handleSaveScenario = async () => {
    if (!simulationResult) return;
    setSaving(true);
    try {
      const params: SimulationParameters = {
        daily_study_hours: Number(studyHours),
        attendance_percentage: Number(attendance),
        assignment_completion_rate: Number(assignmentRate),
        internal_assessment_average: Number(internalAvg),
        coding_hours_per_day: Number(codingHours),
        study_consistency: Number(consistency),
      };

      await apiClient("/simulations/save", {
        method: "POST",
        body: JSON.stringify({
          name: scenarioName.trim() || "Saved Scenario",
          description: `Simulated CGPA: ${simulationResult.simulated_prediction.predicted_cgpa.toFixed(2)} (${simulationResult.impact.cgpa_difference >= 0 ? "+" : ""}${simulationResult.impact.cgpa_difference.toFixed(2)})`,
          parameters: params,
          simulation_result: simulationResult,
        }),
      });

      const updatedScenarios = await apiClient<SimulationScenarioResponse[]>("/simulations");
      setSavedScenarios(updatedScenarios);
      alert("Simulation scenario successfully saved!");
    } catch (err: any) {
      alert(err?.message || "Failed to save scenario");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScenario = async (id: string) => {
    if (!confirm("Are you sure you want to delete this saved scenario?")) return;
    try {
      await apiClient(`/simulations/${id}`, { method: "DELETE" });
      setSavedScenarios(savedScenarios.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err?.message || "Failed to delete scenario");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Initializing Digital Twin What-If Simulator...</p>
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
            What-If Digital Twin Simulator
          </h1>
          <p className="text-sm text-slate-500">
            Simulate counterfactual study and attendance behaviors to forecast academic trajectory without altering real records.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleResetToBaseline}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Reset to Baseline
          </Button>
        </div>
      </div>

      {/* AI Transparency & Synthetic Data Disclaimer */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-800">
        <div className="flex items-start gap-2.5">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <strong className="font-semibold text-amber-900">Academic Integrity & Disclaimer:</strong>{" "}
            Simulations evaluate hypothetical scenarios by performing isolated inference using models trained on synthetic educational records. These projections are analytical estimates for self-reflection and do not guarantee official university examination marks or graduation outcomes.
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Simulator Control Matrix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sliders Form */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="h-4 w-4 text-brand-600" />
                Simulated Habit Parameters
              </CardTitle>
              <CardDescription>
                Adjust prospective parameters to observe the Digital Twin response
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRunSimulation} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Scenario Title
                  </label>
                  <input
                    type="text"
                    required
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
                    placeholder="e.g. +2 Hours Daily Study + 95% Attendance"
                  />
                </div>

                {/* Slider 1: Daily Study Hours */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">Daily Study Hours</span>
                    <span className="font-bold text-brand-600">{studyHours} hrs / day</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="0.5"
                    value={studyHours}
                    onChange={(e) => setStudyHours(Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0h (No self study)</span>
                    <span>Baseline: {baselineTwin?.behavioral_state.daily_study_hours?.toFixed(1) || 3.0}h</span>
                    <span>12h (Intense)</span>
                  </div>
                </div>

                {/* Slider 2: Attendance Percentage */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">Attendance Percentage</span>
                    <span className="font-bold text-brand-600">{attendance}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    step="1"
                    value={attendance}
                    onChange={(e) => setAttendance(Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>40% (Debarred threshold)</span>
                    <span>Baseline: {baselineTwin?.academic_state.attendance_percentage?.toFixed(0) || 80}%</span>
                    <span>100% (Perfect)</span>
                  </div>
                </div>

                {/* Slider 3: Assignment Completion Rate */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">Assignment Completion Rate</span>
                    <span className="font-bold text-brand-600">{assignmentRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="1"
                    value={assignmentRate}
                    onChange={(e) => setAssignmentRate(Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>20% (Poor submission)</span>
                    <span>Baseline: {baselineTwin?.behavioral_state.assignment_completion_rate?.toFixed(0) || 85}%</span>
                    <span>100% (All on time)</span>
                  </div>
                </div>

                {/* Slider 4: Internal Assessment Average */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">Internal Assessment Score</span>
                    <span className="font-bold text-brand-600">{internalAvg}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    step="1"
                    value={internalAvg}
                    onChange={(e) => setInternalAvg(Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>30% (Failing internals)</span>
                    <span>Baseline: {baselineTwin?.academic_state.internal_assessment_avg?.toFixed(0) || 75}%</span>
                    <span>100% (Top scorer)</span>
                  </div>
                </div>

                {/* Slider 5: Coding Hours / Day */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">Coding Practice (Hours/Day)</span>
                    <span className="font-bold text-brand-600">{codingHours} hrs / day</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="0.5"
                    value={codingHours}
                    onChange={(e) => setCodingHours(Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0h</span>
                    <span>1.5h (Balanced)</span>
                    <span>6h (Intensive DSA)</span>
                  </div>
                </div>

                {/* Slider 6: Consistency */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">Study Consistency Score</span>
                    <span className="font-bold text-brand-600">{consistency} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={consistency}
                    onChange={(e) => setConsistency(Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>10 (Sporadic)</span>
                    <span>Baseline: {baselineTwin?.behavioral_state.study_consistency_score?.toFixed(0) || 70}</span>
                    <span>100 (Unbroken routine)</span>
                  </div>
                </div>

                <Button type="submit" loading={simulating} className="w-full" size="lg">
                  <Play className="mr-2 h-4 w-4" />
                  Run Counterfactual Simulation
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results Comparison View */}
        <div className="lg:col-span-5 space-y-4">
          {simulationResult ? (
            <Card className="border-brand-200 bg-brand-50/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base text-slate-900">Simulation Projections</CardTitle>
                  <CardDescription className="text-xs">
                    Comparing Baseline vs Counterfactual State
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={handleSaveScenario} loading={saving}>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Save Scenario
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* CGPA Impact Delta Highlight */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Projected CGPA Delta
                  </span>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    {simulationResult.impact.cgpa_difference >= 0 ? (
                      <div className="flex items-center text-emerald-600">
                        <TrendingUp className="h-6 w-6 mr-1" />
                        <span className="text-3xl font-extrabold">
                          +{simulationResult.impact.cgpa_difference.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <TrendingDown className="h-6 w-6 mr-1" />
                        <span className="text-3xl font-extrabold">
                          {simulationResult.impact.cgpa_difference.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {simulationResult.impact.risk_difference}
                  </p>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">
                      Baseline State
                    </span>
                    <div className="text-2xl font-bold text-slate-800">
                      {simulationResult.baseline_prediction.predicted_cgpa.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={
                          simulationResult.baseline_prediction.risk_level === "Low"
                            ? "success"
                            : simulationResult.baseline_prediction.risk_level === "Moderate"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {simulationResult.baseline_prediction.risk_level} Risk
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Risk prob: {(simulationResult.baseline_prediction.risk_probability * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="rounded-lg border border-brand-300 bg-brand-50/60 p-3 space-y-1">
                    <span className="text-[11px] font-semibold text-brand-600 uppercase">
                      Simulated State
                    </span>
                    <div className="text-2xl font-bold text-brand-900">
                      {simulationResult.simulated_prediction.predicted_cgpa.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={
                          simulationResult.simulated_prediction.risk_level === "Low"
                            ? "success"
                            : simulationResult.simulated_prediction.risk_level === "Moderate"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {simulationResult.simulated_prediction.risk_level} Risk
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Risk prob: {(simulationResult.simulated_prediction.risk_probability * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Key Drivers */}
                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Key Influencing Drivers
                  </span>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {simulationResult.impact.key_drivers.map((driver, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-brand-600 mt-0.5 shrink-0" />
                        <span>{driver}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-3">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Simulation Awaiting Input</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Adjust the sliders on the left and click &quot;Run Counterfactual Simulation&quot; to see real-time delta projections.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Saved Scenarios List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Saved Scenarios ({savedScenarios.length})</CardTitle>
              <CardDescription className="text-xs">
                Previously bookmarked simulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedScenarios.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No saved scenarios yet. Run a simulation and save it to compare strategies.
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {savedScenarios.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 flex items-start justify-between text-xs"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-900">{s.name}</h4>
                        {s.description && (
                          <p className="text-slate-500 text-[11px] mt-0.5">{s.description}</p>
                        )}
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Saved {new Date(s.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteScenario(s.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
