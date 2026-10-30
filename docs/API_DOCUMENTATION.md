# REST API Specification — StudentOS

The FastAPI backend exposes 21 endpoints organized into modular routers under `/api/v1`. All protected endpoints require a Bearer JWT Token passed in the `Authorization` header or HTTP-only cookies.

---

## 1. Authentication Router (`/api/v1/auth`)

### `POST /auth/register`
Creates a new student account and returns JWT credentials.
- **Request Body:** `{ email: string, password: string, display_name: string }`
- **Response (201):** `{ access_token: string, token_type: "bearer" }`

### `POST /auth/login`
Authenticates credentials.
- **Request Body:** `{ email: string, password: string }`
- **Response (200):** `{ access_token: string, token_type: "bearer" }`

### `GET /auth/me`
Retrieves currently authenticated user record.
- **Response (200):** `{ id: string, email: string, is_active: boolean, created_at: string }`

### `DELETE /auth/account`
Permanently erases user account and all cascaded data.
- **Response (200):** `{ message: "Account successfully deleted" }`

---

## 2. Profile Router (`/api/v1/profile`)

### `GET /profile`
Retrieves student profile, CGPA targets, and onboarding status.

### `PATCH /profile`
Updates profile parameters (current CGPA, career goal, study hours preference).

### `POST /profile/onboarding`
Processes multi-step onboarding wizard submission.

---

## 3. Academic Curriculum Router (`/api/v1/academic`)

### `GET /academic/overview`
Returns academic summary including subject count, average score, and strong/weak categorization.

### `GET /academic/subjects`
Lists enrolled semester courses.

### `POST /academic/subjects`
Registers a new subject (`{ name, code, credits, semester, target_attendance }`).

### `GET /academic/assessments`
Retrieves assessment records and marks.

### `POST /academic/assessments`
Records exam scores (`{ subject_id, name, assessment_type, marks_obtained, max_marks }`).

---

## 4. Attendance Router (`/api/v1/attendance`)

### `GET /attendance`
Returns overall attendance percentage, subjects below threshold, and attendance status summaries.

### `POST /attendance`
Logs conducted vs attended lectures (`{ subject_id, classes_conducted, classes_attended }`).

### `POST /attendance/calculate`
Calculates consecutive classes needed to reach 75% or classes safe to miss.

---

## 5. Digital Twin & Simulator Routers

### `GET /digital-twin/current`
Computes real-time 4-dimensional virtual state (Academic, Behavioral, Skill, Coding) and generates ML predictions.

### `GET /digital-twin/history`
Returns the 20 most recent state snapshots.

### `POST /simulations/run`
Executes an in-memory counterfactual What-If simulation.
- **Request Body:**
  ```json
  {
    "scenario_name": "Intense Study Plan",
    "parameters": {
      "daily_study_hours": 4.5,
      "attendance_percentage": 92.0,
      "internal_assessment_average": 82.0
    }
  }
  ```
- **Response (200):**
  ```json
  {
    "scenario_name": "Intense Study Plan",
    "baseline_prediction": { "predicted_cgpa": 8.12, "risk_level": "Moderate" },
    "simulated_prediction": { "predicted_cgpa": 8.58, "risk_level": "Low" },
    "impact": {
      "cgpa_difference": 0.46,
      "risk_difference": "Risk shifts from Moderate to Low",
      "key_drivers": ["Increased daily study hours (+1.5h)", "Attendance improved (+12%)"]
    }
  }
  ```

### `POST /simulations/save` & `GET /simulations`
Saves and retrieves bookmarked simulation scenarios.

---

## 6. Recommendations & Planner Routers

### `GET /recommendations`
Generates deterministic, prioritized recommendations based on live student metrics.

### `POST /recommendations/{id}/actions`
Updates recommendation status (`accepted`, `dismissed`, `completed`).

### `POST /study-plans`
Generates an algorithmic study schedule distributing sessions across subjects based on credits and performance gaps.

### `PATCH /study-plans/sessions/{id}/complete`
Toggles study session completion checkbox.

---

## 7. AI Advisory Assistant Router (`/api/v1/assistant`)

### `POST /assistant/chat`
Advisory chat endpoint grounded on student database records.
- **Request Body:** `{ "message": "Why is my academic risk high?" }`
- **Response (200):**
  ```json
  {
    "reply": "Your current attendance in Operating Systems is 68.4%, which is below the mandatory 75% threshold...",
    "suggested_actions": ["Calculate attendance needed", "Create study plan for OS"],
    "source": "grounded-rules",
    "context_used": { "attendance_percentage": 71.2, "backlogs": 0 }
  }
  ```
