import pytest
from fastapi.testclient import TestClient
from app.main import app
from scripts.seed_demo_data import DEMO_EMAIL, DEMO_PASSWORD
from app.ml.artifact_loader import model_loader
from app.ml.features import validate_and_sanitize_features

client = TestClient(app)

@pytest.fixture(scope="module")
def auth_headers():
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}
    )
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_ml_artifact_loading_and_prediction():
    meta = model_loader.get_metadata()
    assert meta["models_loaded"]["performance_model"] is True
    assert meta["models_loaded"]["risk_model"] is True

    # Test prediction with known features
    sample_features = {
        "previous_cgpa": 8.0,
        "cgpa_trend": 0.2,
        "internal_assessment_avg": 85.0,
        "attendance_percentage": 90.0,
        "assignment_completion_rate": 95.0,
        "daily_study_hours": 3.5,
        "study_consistency": 80.0,
        "backlog_count": 0,
        "coding_practice_hours_per_week": 8.0,
        "average_focus_rating": 4.0
    }
    cgpa_pred, p_meta = model_loader.predict_performance(sample_features)
    assert 7.0 <= cgpa_pred <= 10.0
    assert p_meta["source"] == "ml_trained_model"

    risk_level, risk_prob, r_meta = model_loader.predict_risk(sample_features)
    assert risk_level in ["Low", "Moderate", "High"]
    assert 0.0 <= risk_prob <= 1.0

def test_what_if_simulation_does_not_mutate_actual_records(auth_headers):
    # 1. Fetch current digital twin state
    twin_before = client.get("/api/v1/digital-twin/current", headers=auth_headers).json()
    base_cgpa = twin_before["predicted_cgpa"]
    base_study_h = twin_before["derived_features"]["daily_study_hours"]

    # 2. Run simulation with significantly boosted study hours (from base to 6.0 hours)
    sim_resp = client.post(
        "/api/v1/simulations/run",
        json={
            "scenario_name": "High Effort Test Scenario",
            "parameters": {
                "daily_study_hours": 6.0,
                "attendance_percentage": 95.0,
                "internal_assessment_average": 90.0
            }
        },
        headers=auth_headers
    )
    assert sim_resp.status_code == 200
    sim_result = sim_resp.json()
    assert "baseline_prediction" in sim_result
    assert "simulated_prediction" in sim_result
    assert "impact" in sim_result

    # 3. Save Scenario
    save_resp = client.post(
        "/api/v1/simulations/save",
        json={
            "name": "High Effort Test Scenario",
            "description": "Simulation test save",
            "parameters": {
                "daily_study_hours": 6.0,
                "attendance_percentage": 95.0,
                "internal_assessment_average": 90.0
            },
            "simulation_result": sim_result
        },
        headers=auth_headers
    )
    assert save_resp.status_code == 201

    # 4. Verify actual digital twin records remain completely UNCHANGED
    twin_after = client.get("/api/v1/digital-twin/current", headers=auth_headers).json()
    assert twin_after["derived_features"]["daily_study_hours"] == base_study_h
    assert twin_after["predicted_cgpa"] == base_cgpa

    # 5. Verify saved scenario is in list of saved scenarios
    saved_list = client.get("/api/v1/simulations", headers=auth_headers).json()
    assert any(s["name"] == "High Effort Test Scenario" for s in saved_list)
