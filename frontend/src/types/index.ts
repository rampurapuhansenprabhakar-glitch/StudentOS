export interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  display_name?: string;
  onboarding_completed?: boolean;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  display_name: string;
  institution?: string;
  degree?: string;
  branch?: string;
  current_year?: number;
  current_semester?: number;
  expected_graduation_year?: number;
  current_cgpa?: number;
  previous_semester_cgpa?: number;
  target_cgpa?: number;
  preferred_study_hours_per_day?: number;
  primary_career_goal?: string;
  preferred_programming_language?: string;
  technical_skill_level?: string;
  weak_subjects?: string;
  strong_subjects?: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  code?: string;
  credits: number;
  semester: number;
  target_attendance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  assessment_type: string;
  date: string;
  marks_obtained: number;
  max_marks: number;
  weightage?: number;
  percentage: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SubjectPerformanceSummary {
  subject_id: string;
  subject_name: string;
  subject_code?: string;
  credits: number;
  average_percentage: number;
  assessments_count: number;
  attendance_percentage: number;
  status: "Strong" | "Moderate" | "Needs Attention";
}

export interface AcademicOverview {
  current_cgpa?: number;
  target_cgpa?: number;
  overall_marks_average: number;
  total_subjects: number;
  total_assessments: number;
  subject_summaries: SubjectPerformanceSummary[];
  strong_subjects: string[];
  weak_subjects: string[];
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  subject_id: string;
  subject_name?: string;
  classes_conducted: number;
  classes_attended: number;
  date: string;
  notes?: string;
  percentage: number;
  created_at: string;
  updated_at: string;
}

export interface SubjectAttendanceSummary {
  subject_id: string;
  subject_name: string;
  subject_code?: string;
  total_conducted: number;
  total_attended: number;
  total_missed: number;
  percentage: number;
  target_percentage: number;
  status: "Above Target" | "On Track" | "Critical Warning";
  consecutive_classes_needed: number;
  can_miss_classes: number;
}

export interface OverallAttendanceSummary {
  overall_percentage: number;
  total_conducted: number;
  total_attended: number;
  total_missed: number;
  subjects_count: number;
  subjects_below_threshold: number;
  subjects: SubjectAttendanceSummary[];
}

export interface TargetAttendanceCalculationResponse {
  current_percentage: number;
  target_percentage: number;
  is_target_met: boolean;
  consecutive_classes_needed: number;
  can_miss_classes: number;
  is_target_achievable: boolean;
  explanation: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  subject_id?: string;
  subject_name?: string;
  title: string;
  description?: string;
  due_date: string;
  estimated_duration_hours?: number;
  actual_duration_hours?: number;
  priority: "low" | "medium" | "high" | "urgent";
  status: "not_started" | "in_progress" | "completed" | "overdue";
  notes?: string;
  is_overdue: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkloadDay {
  date: string;
  day_name: string;
  assignments_count: number;
  estimated_hours: number;
  assignment_titles: string[];
}

export interface AssignmentWorkload {
  total_active: number;
  completed_count: number;
  overdue_count: number;
  completion_rate: number;
  upcoming_7_days: WorkloadDay[];
  total_estimated_hours_next_7_days: number;
}

export interface SubjectStudyDuration {
  subject_name: string;
  duration_hours: number;
}

export interface DailyStudyLog {
  id: string;
  user_id: string;
  date: string;
  total_study_hours: number;
  sessions_count: number;
  revision_completed: boolean;
  assignment_work_completed: boolean;
  dsa_problems_attempted: number;
  dsa_problems_solved: number;
  coding_practice_hours: number;
  focus_rating: number;
  difficulty_rating: number;
  notes?: string;
  subject_durations: SubjectStudyDuration[];
  created_at: string;
  updated_at: string;
}

export interface StudyDayTrend {
  date: string;
  day_name: string;
  study_hours: number;
  coding_hours: number;
  focus_rating: number;
  has_record: boolean;
}

export interface SubjectTimeDistribution {
  subject_name: string;
  total_hours: number;
  percentage: number;
}

export interface StudyAnalytics {
  total_days_logged: number;
  average_daily_hours: number;
  average_weekly_hours: number;
  study_consistency_score: number;
  average_focus_rating: number;
  total_dsa_attempted: number;
  total_dsa_solved: number;
  total_coding_hours: number;
  subject_distribution: SubjectTimeDistribution[];
  daily_trends: StudyDayTrend[];
  week_over_week_change: number;
}

export interface StudentSkill {
  id: string;
  user_id: string;
  name: string;
  category: string;
  current_proficiency: number;
  target_proficiency: number;
  skill_gap: number;
  notes?: string;
  last_assessed_at: string;
  created_at: string;
  updated_at: string;
}

export interface SkillGapItem {
  skill_name: string;
  category: string;
  current_proficiency: number;
  target_proficiency: number;
  gap: number;
  priority: "High" | "Medium" | "Low";
}

export interface CareerRoleRequirement {
  role_name: string;
  description: string;
  required_skills: { name: string; min_proficiency: number }[];
  readiness_percentage: number;
  matching_skills_count: number;
  missing_skills: string[];
}

export interface SkillGapAnalysis {
  average_proficiency: number;
  total_skills_tracked: number;
  top_skill_gaps: SkillGapItem[];
  career_role_readiness: CareerRoleRequirement[];
}

export interface CodingLog {
  id: string;
  user_id: string;
  date: string;
  problem_title: string;
  platform: string;
  language: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "Solved" | "Attempted" | "Review Needed";
  time_spent_minutes: number;
  confidence_rating: number;
  problem_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentGoal {
  id: string;
  user_id: string;
  title: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline?: string;
  is_completed: boolean;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface CodingAnalytics {
  total_problems_solved: number;
  total_problems_attempted: number;
  solve_rate_percentage: number;
  current_streak_days: number;
  difficulty_breakdown: Record<string, number>;
  topic_breakdown: Record<string, number>;
  platform_breakdown: Record<string, number>;
  total_time_spent_hours: number;
  weekly_velocity: number;
}

export interface DigitalTwinResponse {
  user_id: string;
  last_updated: string;
  academic_state: {
    current_cgpa: number;
    previous_cgpa: number;
    target_cgpa: number;
    subjects_count: number;
    internal_assessment_avg: number;
    attendance_percentage: number;
    backlogs: number;
  };
  behavioral_state: {
    daily_study_hours: number;
    study_consistency_score: number;
    average_focus_rating: number;
    days_logged_last_14_days: number;
    assignment_completion_rate: number;
  };
  skill_state: {
    skills_count: number;
    average_proficiency: number;
    career_goal: string;
  };
  coding_state: {
    problems_solved: number;
    coding_hours_per_week: number;
  };
  derived_features: Record<string, number>;
  predicted_cgpa: number | null;
  academic_risk_level: "Low" | "Moderate" | "High";
  academic_risk_probability: number | null;
  model_version: string;
  data_completeness_percentage: number;
}

export interface SnapshotHistoryItem {
  id: string;
  timestamp: string;
  predicted_cgpa: number | null;
  academic_risk_level: string;
  model_version: string;
  derived_features: Record<string, number>;
}

export interface SimulationParameters {
  daily_study_hours?: number;
  attendance_percentage?: number;
  assignment_completion_rate?: number;
  internal_assessment_average?: number;
  coding_hours_per_day?: number;
  study_consistency?: number;
}

export interface PredictionOutcome {
  predicted_cgpa: number;
  risk_level: "Low" | "Moderate" | "High";
  risk_probability: number;
  model_version: string;
}

export interface SimulationImpact {
  cgpa_difference: number;
  risk_difference: string;
  key_drivers: string[];
  disclaimer: string;
}

export interface SimulationResult {
  scenario_name: string;
  modified_parameters: Record<string, number>;
  baseline_prediction: PredictionOutcome;
  simulated_prediction: PredictionOutcome;
  impact: SimulationImpact;
  baseline_features: Record<string, number>;
  simulated_features: Record<string, number>;
}

export interface SimulationScenarioResponse {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  baseline_snapshot_id?: string;
  modified_parameters: Record<string, any>;
  baseline_prediction: Record<string, any>;
  simulated_prediction: Record<string, any>;
  impact_summary: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  user_id: string;
  title: string;
  reason: string;
  evidence: string;
  priority: "high" | "medium" | "low";
  suggested_action: string;
  expected_effort_hours?: number;
  related_weakness?: string;
  category: "academic" | "attendance" | "study" | "skills" | "coding";
  status: "active" | "accepted" | "dismissed" | "completed";
  created_at: string;
  updated_at: string;
}

export interface StudyPlanSession {
  id: string;
  plan_id: string;
  subject_id?: string;
  subject_name: string;
  date: string;
  start_time?: string;
  duration_hours: number;
  topic?: string;
  is_completed: boolean;
  notes?: string;
  created_at: string;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  end_date: string;
  total_planned_hours: number;
  status: string;
  sessions: StudyPlanSession[];
  created_at: string;
  updated_at: string;
}

export interface OverviewAnalytics {
  current_cgpa?: number;
  target_cgpa?: number;
  predicted_cgpa?: number;
  overall_attendance: number;
  assignment_completion_rate: number;
  average_daily_study_hours: number;
  study_consistency_score: number;
  total_dsa_solved: number;
  active_recommendations_count: number;
  academic_risk_level: string;
  academic_performance_trend: { label: string; value: number }[];
  attendance_trend: { label: string; value: number }[];
  study_hours_trend: { label: string; value: number }[];
  subject_marks_comparison: { subject: string; score: number; target: number }[];
  key_insights: string[];
}

export interface AssistantChatResponse {
  reply: string;
  suggested_actions: string[];
  source: string;
  context_used: Record<string, any>;
}
