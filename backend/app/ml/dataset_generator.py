import os
import json
import numpy as np
import pandas as pd
from typing import Tuple
from app.ml.features import FEATURE_NAMES

def generate_synthetic_dataset(
    n_samples: int = 2500,
    random_seed: int = 42,
    output_dir: str = "data/synthetic"
) -> Tuple[pd.DataFrame, str]:
    """
    Generates a reproducible synthetic dataset for StudentOS ML training.
    Clearly labeled as synthetic data generated with controlled stochastic distributions.
    """
    np.random.seed(random_seed)
    
    # Generate feature distributions
    # Previous CGPA: Normal distribution centered around 7.4, bounded in [4.0, 9.8]
    previous_cgpa = np.clip(np.random.normal(loc=7.4, scale=1.1, size=n_samples), 4.0, 9.9)
    
    # CGPA Trend: Normal centered around 0.05, bounded in [-2.0, 2.0]
    cgpa_trend = np.clip(np.random.normal(loc=0.05, scale=0.45, size=n_samples), -2.0, 2.0)
    
    # Attendance percentage: Beta distribution skewed towards 75-90%
    attendance_percentage = np.clip(np.random.beta(a=7, b=2, size=n_samples) * 100, 35.0, 100.0)
    
    # Daily study hours: Gamma distribution with mean ~ 2.8 hours
    daily_study_hours = np.clip(np.random.gamma(shape=3.0, scale=0.9, size=n_samples), 0.2, 10.0)
    
    # Study consistency: correlated with study hours and attendance
    study_consistency = np.clip(
        0.3 * (attendance_percentage) + 0.3 * (daily_study_hours * 10) + np.random.normal(30, 10, n_samples),
        20.0, 100.0
    )
    
    # Internal assessment average: correlated with previous_cgpa and study hours
    internal_assessment_avg = np.clip(
        (previous_cgpa * 7.5) + (daily_study_hours * 2.2) + (attendance_percentage * 0.15) + np.random.normal(0, 6, n_samples),
        25.0, 99.0
    )
    
    # Assignment completion rate: correlated with attendance and consistency
    assignment_completion_rate = np.clip(
        0.5 * attendance_percentage + 0.3 * study_consistency + np.random.normal(15, 8, n_samples),
        20.0, 100.0
    )
    
    # Backlog count: Poisson distributed, higher probability if low previous CGPA
    backlog_prob = np.clip(1.2 - (previous_cgpa / 7.0), 0.05, 0.8)
    backlog_count = np.random.binomial(n=4, p=backlog_prob, size=n_samples)
    
    # Coding practice hours per week: Gamma distribution
    coding_practice_hours_per_week = np.clip(np.random.gamma(shape=2.5, scale=2.5, size=n_samples), 0.0, 35.0)
    
    # Focus rating: 1 to 5
    average_focus_rating = np.clip(np.random.normal(loc=3.4, scale=0.7, size=n_samples), 1.0, 5.0)
    
    # TARGET 1: Next Semester CGPA (Regression target)
    # Ground truth formula with realistic non-linearities, diminishing returns, and stochastic noise
    cgpa_latent = (
        0.52 * previous_cgpa +
        0.022 * internal_assessment_avg +
        0.012 * attendance_percentage +
        0.008 * assignment_completion_rate +
        0.075 * np.log1p(daily_study_hours * 1.5) +
        0.005 * study_consistency -
        0.18 * backlog_count +
        0.12 * cgpa_trend +
        np.random.normal(0, 0.28, size=n_samples)
    )
    target_next_cgpa = np.clip(np.round(cgpa_latent, 2), 3.5, 10.0)
    
    # TARGET 2: Academic Risk (Classification target)
    # Risk is 1 (At Risk) if next_cgpa < 6.5 OR attendance < 65% OR backlogs >= 2
    risk_score = (
        (target_next_cgpa < 6.5).astype(int) * 3 +
        (attendance_percentage < 65.0).astype(int) * 2 +
        (internal_assessment_avg < 50.0).astype(int) * 2 +
        (backlog_count >= 2).astype(int) * 2 +
        (study_consistency < 40.0).astype(int) * 1
    )
    target_academic_risk = (risk_score >= 3).astype(int)
    
    # Build DataFrame
    df = pd.DataFrame({
        "previous_cgpa": np.round(previous_cgpa, 2),
        "cgpa_trend": np.round(cgpa_trend, 2),
        "internal_assessment_avg": np.round(internal_assessment_avg, 2),
        "attendance_percentage": np.round(attendance_percentage, 2),
        "assignment_completion_rate": np.round(assignment_completion_rate, 2),
        "daily_study_hours": np.round(daily_study_hours, 2),
        "study_consistency": np.round(study_consistency, 2),
        "backlog_count": backlog_count,
        "coding_practice_hours_per_week": np.round(coding_practice_hours_per_week, 2),
        "average_focus_rating": np.round(average_focus_rating, 2),
        "target_next_cgpa": target_next_cgpa,
        "target_academic_risk": target_academic_risk,
    })
    
    # Ensure directory exists
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, "student_academic_records.csv")
    df.to_csv(file_path, index=False)
    
    # Save metadata
    meta = {
        "dataset_name": "StudentOS Synthetic Academic Training Set",
        "sample_count": n_samples,
        "random_seed": random_seed,
        "features": FEATURE_NAMES,
        "regression_target": "target_next_cgpa",
        "classification_target": "target_academic_risk",
        "synthetic_label": True,
        "generated_timestamp": pd.Timestamp.now().isoformat(),
        "risk_prevalence": float(df["target_academic_risk"].mean()),
        "cgpa_mean": float(df["target_next_cgpa"].mean()),
        "cgpa_std": float(df["target_next_cgpa"].std()),
    }
    with open(os.path.join(output_dir, "metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)
        
    return df, file_path

if __name__ == "__main__":
    generate_synthetic_dataset()
    print("Synthetic dataset generated successfully.")
