from typing import Dict, Any, List
import numpy as np

# Standard feature ordering expected by both regression and risk ML pipelines
FEATURE_NAMES: List[str] = [
    "previous_cgpa",
    "cgpa_trend",
    "internal_assessment_avg",
    "attendance_percentage",
    "assignment_completion_rate",
    "daily_study_hours",
    "study_consistency",
    "backlog_count",
    "coding_practice_hours_per_week",
    "average_focus_rating",
]

FEATURE_RANGES: Dict[str, Dict[str, float]] = {
    "previous_cgpa": {"min": 0.0, "max": 10.0, "default": 7.5},
    "cgpa_trend": {"min": -3.0, "max": 3.0, "default": 0.0},
    "internal_assessment_avg": {"min": 0.0, "max": 100.0, "default": 70.0},
    "attendance_percentage": {"min": 0.0, "max": 100.0, "default": 80.0},
    "assignment_completion_rate": {"min": 0.0, "max": 100.0, "default": 85.0},
    "daily_study_hours": {"min": 0.0, "max": 16.0, "default": 2.5},
    "study_consistency": {"min": 0.0, "max": 100.0, "default": 75.0},
    "backlog_count": {"min": 0.0, "max": 10.0, "default": 0.0},
    "coding_practice_hours_per_week": {"min": 0.0, "max": 40.0, "default": 5.0},
    "average_focus_rating": {"min": 1.0, "max": 5.0, "default": 3.5},
}

def validate_and_sanitize_features(raw_features: Dict[str, Any]) -> List[float]:
    """
    Validates, clamps, and orders feature values into a strictly typed numpy-ready float list.
    Missing features are imputed with domain-appropriate defaults.
    """
    sanitized: List[float] = []
    for feat in FEATURE_NAMES:
        val = raw_features.get(feat)
        bounds = FEATURE_RANGES[feat]
        if val is None or not isinstance(val, (int, float)) or np.isnan(val):
            val = bounds["default"]
        else:
            val = float(val)
            val = max(bounds["min"], min(bounds["max"], val))
        sanitized.append(round(val, 3))
    return sanitized
