"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import {
  ShieldCheck,
  Database,
  Brain,
  AlertTriangle,
  Lock,
  Layers,
  FileText,
  CheckCircle2,
} from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Privacy, Ethics & AI Transparency Statement
          </h1>
          <Badge variant="success">Ethical AI Verified</Badge>
        </div>
        <p className="text-sm text-slate-500">
          Our commitments to student data confidentiality, machine learning transparency, and academic integrity.
        </p>
      </div>

      {/* 1. Local Data Storage & Confidentiality */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">1. Zero Cloud Leakage & Local Storage</CardTitle>
          </div>
          <CardDescription>Your personal academic metrics never leave your machine</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            StudentOS is architected with a strict <strong>local-first privacy model</strong>. All records—including assessment scores, attendance logs, daily study durations, and coding streaks—are stored in your local relational database instance (SQLite / PostgreSQL).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="font-semibold text-slate-800 block mb-1">No Third-Party Analytics</span>
              <span>No telemetry, tracking pixels, or user behavior cookies are transmitted to third-party ad networks.</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="font-semibold text-slate-800 block mb-1">Isolated Student Records</span>
              <span>All database queries enforce server-side user-ID constraints to ensure zero cross-student data leakage.</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="font-semibold text-slate-800 block mb-1">Full Export & Erasure</span>
              <span>You retain complete ownership with one-click full JSON export and permanent account deletion.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Honest AI & Synthetic Training Data Disclosure */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-brand-600" />
            <CardTitle className="text-base">2. Honest AI & Synthetic Dataset Disclosure</CardTitle>
          </div>
          <CardDescription>Full disclosure on training sources and model validation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            To honor academic and ethical AI standards, StudentOS <strong>does not misrepresent algorithmic models</strong> or invent training statistics:
          </p>
          <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-4 space-y-2">
            <h4 className="font-bold text-brand-900 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-brand-700" />
              Dataset Origin & Labeling
            </h4>
            <p className="text-brand-800">
              Machine learning models in StudentOS were trained using a reproducibly generated dataset of <strong>2,500 synthetic engineering student profiles</strong> (<code className="font-mono bg-white px-1.5 py-0.5 rounded border border-brand-200">student_academic_records.csv</code>). Synthetic data was generated strictly for development and validation because live student academic records are protected by educational privacy laws.
            </p>
            <p className="text-brand-800 font-medium">
              We explicitly label these predictions as analytical estimates derived from synthetic baselines and never claim they represent clinically validated real-world outcomes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Taxonomy of Intelligence Methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base">3. Five-Tier System Architecture Transparency</CardTitle>
          </div>
          <CardDescription>Clear separation between statistical, heuristic, and machine learning components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            Many systems loosely brand simple formulas as &quot;AI&quot;. In StudentOS, every computational layer is rigorously categorized:
          </p>
          <div className="space-y-2.5">
            <div className="rounded-lg border border-slate-200 p-3 bg-white">
              <strong className="text-slate-900 block font-semibold mb-0.5">Tier 1: Supervised ML Inference (scikit-learn)</strong>
              <span>Trained Ridge Regression and Gradient Boosting Classifier models that estimate prospective semester CGPA and multi-class academic risk from a 10-dimensional derived feature vector.</span>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 bg-white">
              <strong className="text-slate-900 block font-semibold mb-0.5">Tier 2: Counterfactual What-If Simulation Engine</strong>
              <span>Mathematical sandbox that deep-copies baseline features, applies hypothetical parameter adjustments, and executes isolated model re-inference without mutating primary student records.</span>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 bg-white">
              <strong className="text-slate-900 block font-semibold mb-0.5">Tier 3: Rule-Based Recommendation Heuristics</strong>
              <span>Deterministic expert rules triggered by observable criteria (e.g. attendance below 75%, exam within 14 days, skill gap &gt; 25%) to suggest targeted corrective actions.</span>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 bg-white">
              <strong className="text-slate-900 block font-semibold mb-0.5">Tier 4: Statistical Consistency & Trend Aggregators</strong>
              <span>Descriptive statistical algorithms computing study streak velocity, standard deviation in study hours, and weighted assessment performance.</span>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 bg-white">
              <strong className="text-slate-900 block font-semibold mb-0.5">Tier 5: Local Advisory Chat (Grounded / Ollama)</strong>
              <span>Advisory interface that retrieves live context from your local database and synthesizes natural language guidance via local heuristics or offline Ollama models.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Academic Integrity & Counseling Disclaimer */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">4. Academic Integrity & Counseling Disclaimer</CardTitle>
          </div>
          <CardDescription>Intended application scope and limitations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            StudentOS is designed exclusively as an <strong>informative self-regulation and progress monitoring aid</strong>. It is not an accredited grading authority or an official university evaluation mechanism.
          </p>
          <p>
            Predictions, simulated CGPAs, and risk levels are mathematical forecasts. Real academic performance depends on personal well-being, evaluation subjectivity, faculty interactions, and unforeseen external factors that cannot be captured by numerical feature vectors. Students should always consult academic advisors, mentors, and professors for authoritative academic guidance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
