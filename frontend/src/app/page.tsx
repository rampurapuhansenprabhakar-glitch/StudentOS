import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Cpu,
  Sliders,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  CalendarCheck,
  Award,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navbar */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-lg shadow-sm">
              S
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">StudentOS</span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 shadow-sm transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 bg-gradient-to-b from-brand-50/40 via-white to-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center space-x-2 rounded-full bg-brand-50 border border-brand-200/80 px-3.5 py-1.5 mb-8">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <span className="text-xs font-semibold text-brand-800">
              Innovative B.Tech CSE (AIML) Final Phase Capstone
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight md:leading-[1.15] mb-6">
            An AI-Powered <span className="text-brand-600">Digital Twin</span> for Personalized Student Success
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            “Track. Predict. Simulate. Improve.” A virtual representation of your academic journey that evolves with your daily habits, forecasts performance with trained ML models, and lets you experiment with what-if scenarios.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-brand-600 text-white font-semibold text-sm shadow-md hover:bg-brand-700 transition-all group"
            >
              Enter Live Dashboard
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Explore Demo Mode
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Pillars of StudentOS */}
      <section className="py-20 border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-3">
              The Four Pillars of the Student Digital Twin
            </h2>
            <p className="text-sm md:text-base text-slate-600">
              Transforming self-reported academic, behavioral, and technical records into actionable intelligent foresight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center mb-4">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-2">1. Track</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Record daily study duration, subject breakdown, attendance records, assignments, and coding problem logs in under two minutes.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-2">2. Predict</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Trained scikit-learn regression & risk classification pipelines estimate upcoming semester CGPA and early academic risks.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Sliders className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-2">3. Simulate</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Interactive What-If Engine: adjust study hours and attendance to observe simulated future outcomes without altering actual history.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-2">4. Improve</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Receive data-grounded intervention recommendations, automated study planning, and technical skill gap analysis tailored to your target career role.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Honest AI & Integrity Section */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-2xl bg-slate-900 text-white p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center space-x-2 text-emerald-400 text-xs font-semibold mb-3">
                <ShieldCheck className="h-4 w-4" />
                <span>Honest, Transparent AI Implementation</span>
              </div>
              <h3 className="text-2xl font-bold mb-3">Engineered for Academic Integrity</h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                StudentOS uses real trained scikit-learn models on verified multivariate synthetic baselines. We transparently distinguish between machine-learning predictions, mathematical formulas, and hypothetical scenario simulations.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mr-2" /> 100% Free & Open Source local execution</li>
                <li className="flex items-center"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mr-2" /> No hardware or biometric surveillance required</li>
                <li className="flex items-center"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mr-2" /> Student data privacy and complete data isolation</li>
              </ul>
            </div>
            <div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-colors shrink-0 shadow"
              >
                Launch Demo Student
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <p>StudentOS • Third-Year B.Tech Computer Science & Engineering (Artificial Intelligence and Machine Learning) Innovative Project</p>
        <p className="mt-1">“Track. Predict. Simulate. Improve.”</p>
      </footer>
    </div>
  );
}
