import pytest
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

def test_attendance_summary_and_math(auth_headers):
    resp = client.get("/api/v1/attendance", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "overall_percentage" in data
    assert "subjects" in data
    assert data["total_conducted"] > 0
    assert data["total_attended"] <= data["total_conducted"]

def test_attendance_target_calculator():
    # Scenario 1: Attended 18 of 24 (75%). Target = 80%.
    # Needed: ceil((0.8*24 - 18)/(1 - 0.8)) = ceil((19.2 - 18)/0.2) = ceil(1.2/0.2) = 6 classes
    resp = client.post(
        "/api/v1/attendance/calculate",
        json={
            "classes_attended": 18,
            "classes_conducted": 24,
            "target_percentage": 80.0
        }
    )
    assert resp.status_code == 200
    calc = resp.json()
    assert calc["current_percentage"] == 75.0
    assert calc["is_target_met"] is False
    assert calc["consecutive_classes_needed"] == 6
    assert calc["is_target_achievable"] is True

    # Scenario 2: Attended 25 of 26 (96.15%). Target = 75%.
    # Can miss: floor((25 - 0.75*26)/0.75) = floor((25 - 19.5)/0.75) = floor(5.5/0.75) = 7 classes
    resp2 = client.post(
        "/api/v1/attendance/calculate",
        json={
            "classes_attended": 25,
            "classes_conducted": 26,
            "target_percentage": 75.0
        }
    )
    assert resp2.status_code == 200
    calc2 = resp2.json()
    assert calc2["is_target_met"] is True
    assert calc2["can_miss_classes"] == 7

def test_academic_overview(auth_headers):
    resp = client.get("/api/v1/academic/overview", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_subjects" in data
    assert data["total_subjects"] >= 5
    assert "subject_summaries" in data
