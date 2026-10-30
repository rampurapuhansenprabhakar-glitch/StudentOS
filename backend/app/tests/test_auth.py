import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_and_login_flow():
    test_email = "tester@studentos.internal"
    test_password = "SecurePassword123"

    # Register
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": test_email,
            "password": test_password,
            "display_name": "Test Student"
        }
    )
    # 201 Created or 400 if already created
    assert reg_resp.status_code in [201, 400]

    # Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_email,
            "password": test_password
        }
    )
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # Verify protected /auth/me route with token
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == test_email
    assert me_data["display_name"] == "Test Student"

def test_unauthorized_access_rejected():
    client.cookies.clear()
    resp = client.get("/api/v1/academic/overview")
    assert resp.status_code == 401
    assert "credentials" in resp.json()["detail"].lower()
