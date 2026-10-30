import copy
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.user import User
from app.services.digital_twin_service import DigitalTwinService
from app.ml.artifact_loader import model_loader
from app.schemas.simulation import (
    SimulationParameters, SimulationResult, PredictionOutcome, SimulationImpact
)

class SimulationService:

    @staticmethod
    def run_what_if_simulation(
        user: User,
        params: SimulationParameters,
        db: Session,
        scenario_name: str = "What-If Scenario"
    ) -> SimulationResult:
        """
        Executes interactive what-if simulation:
        Creates a temporary copy of the baseline digital twin features,
        applies requested modifications, runs through the exact same inference pipeline,
        and computes the comparative delta.
        """
        # 1. Retrieve current digital twin state
        current_state = DigitalTwinService.compute_student_state(user, db)
        baseline_features = current_state["derived_features"]
        
        # 2. Baseline predictions
        base_cgpa, base_p_meta = model_loader.predict_performance(baseline_features)
        base_risk, base_prob, base_r_meta = model_loader.predict_risk(baseline_features)
        
        baseline_outcome = PredictionOutcome(
            predicted_cgpa=base_cgpa,
            risk_level=base_risk,
            risk_probability=base_prob,
            model_version=base_p_meta.get("version", "v1.0")
        )
        
        # 3. Create hypothetical copy and apply validated modifications
        simulated_features = copy.deepcopy(baseline_features)
        modified_dict = {}
        key_drivers = []
        
        if params.daily_study_hours is not None:
            simulated_features["daily_study_hours"] = params.daily_study_hours
            modified_dict["daily_study_hours"] = params.daily_study_hours
            diff = params.daily_study_hours - baseline_features["daily_study_hours"]
            key_drivers.append(f"Daily study hours changed from {baseline_features['daily_study_hours']}h to {params.daily_study_hours}h ({'+' if diff > 0 else ''}{diff:.1f}h)")

        if params.attendance_percentage is not None:
            simulated_features["attendance_percentage"] = params.attendance_percentage
            modified_dict["attendance_percentage"] = params.attendance_percentage
            diff = params.attendance_percentage - baseline_features["attendance_percentage"]
            key_drivers.append(f"Attendance target changed from {baseline_features['attendance_percentage']}% to {params.attendance_percentage}% ({'+' if diff > 0 else ''}{diff:.1f}%)")

        if params.assignment_completion_rate is not None:
            simulated_features["assignment_completion_rate"] = params.assignment_completion_rate
            modified_dict["assignment_completion_rate"] = params.assignment_completion_rate
            diff = params.assignment_completion_rate - baseline_features["assignment_completion_rate"]
            key_drivers.append(f"Assignment completion changed from {baseline_features['assignment_completion_rate']}% to {params.assignment_completion_rate}%")

        if params.internal_assessment_average is not None:
            simulated_features["internal_assessment_avg"] = params.internal_assessment_average
            modified_dict["internal_assessment_avg"] = params.internal_assessment_average
            diff = params.internal_assessment_average - baseline_features["internal_assessment_avg"]
            key_drivers.append(f"Internal assessment target changed from {baseline_features['internal_assessment_avg']}% to {params.internal_assessment_average}%")

        if params.coding_hours_per_day is not None:
            weekly_coding = params.coding_hours_per_day * 7.0
            simulated_features["coding_practice_hours_per_week"] = weekly_coding
            modified_dict["coding_practice_hours_per_week"] = weekly_coding
            key_drivers.append(f"Coding practice adjusted to {params.coding_hours_per_day}h/day ({weekly_coding}h/week)")

        if params.study_consistency is not None:
            simulated_features["study_consistency"] = params.study_consistency
            modified_dict["study_consistency"] = params.study_consistency
            key_drivers.append(f"Study consistency adjusted to {params.study_consistency}%")

        # 4. Run simulated features through the same prediction pipeline
        sim_cgpa, sim_p_meta = model_loader.predict_performance(simulated_features)
        sim_risk, sim_prob, sim_r_meta = model_loader.predict_risk(simulated_features)
        
        simulated_outcome = PredictionOutcome(
            predicted_cgpa=sim_cgpa,
            risk_level=sim_risk,
            risk_probability=sim_prob,
            model_version=sim_p_meta.get("version", "v1.0")
        )

        # 5. Calculate genuine delta and impacts
        cgpa_diff = round(sim_cgpa - base_cgpa, 2)
        if base_risk == sim_risk:
            risk_diff = f"Remains at {sim_risk} risk ({sim_prob*100:.1f}%)"
        else:
            risk_diff = f"Shifts from {base_risk} to {sim_risk} risk ({base_prob*100:.1f}% -> {sim_prob*100:.1f}%)"

        disclaimer = (
            "This is a hypothetical model-based projection calculated using the trained inference pipeline. "
            "It does not guarantee academic outcomes, nor does it establish absolute causality."
        )

        impact = SimulationImpact(
            cgpa_difference=cgpa_diff,
            risk_difference=risk_diff,
            key_drivers=key_drivers if key_drivers else ["No parameters modified from baseline."],
            disclaimer=disclaimer
        )

        return SimulationResult(
            scenario_name=scenario_name,
            modified_parameters=modified_dict,
            baseline_prediction=baseline_outcome,
            simulated_prediction=simulated_outcome,
            impact=impact,
            baseline_features=baseline_features,
            simulated_features=simulated_features
        )
