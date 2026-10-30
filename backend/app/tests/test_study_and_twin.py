import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from scripts.seed_demo_data import DEMO_EMAIL, DEMO_PASSWORD

client = TestClient(app)

@pytest.fixture(scope="module")
def auth_headers():
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}
    )
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_daily_study_log_validation(auth_headers):
    # Invalid: solved > attempted
    invalid_payload = {
        "date": date.today().isoformat(),
        "total_study_hours": 3.0,
        "dsa_problems_attempted": 2,
        "dsa_problems_solved": 5, # Invalid!
        "focus_rating": 4,
        "difficulty_rating": 3
    }
    resp = client.post("/api/v1/study/logs", json=invalid_payload, headers=auth_headers)
    assert resp.status_code == 422

    # Invalid: future dated
    future_payload = {
        "date": (date.today() + timedelta(days=5)).isoformat(),
        "total_study_hours": 2.0,
        "dsa_problems_attempted": 1,
        "dsa_problems_solved": 1,
        "focus_rating": 3,
        "difficulty_rating": 3
    }
    resp2 = client.post("/api/v1/study/logs", json=future_payload, headers=auth_headers)
    assert resp2.status_code == 422

def test_digital_twin_current_state(auth_headers):
    resp = client.get("/api/v1/digital-twin/current", headers=auth_headers)
    assert resp.status_code == 200
    twin = resp.json()
    assert "academic_state" in twin
    assert "behavioral_state" in twin
    assert "derived_features" in twin
    assert "predicted_cgpa" in twin
    assert twin["predicted_cgpa"] is not None
    assert 0.0 <= twin["predicted_cgpa"] <= 10.0
    assert twin["academic_risk_level"] in ["Low", "Moderate", "High"]
