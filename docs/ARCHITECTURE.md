# System Architecture & Technical Specifications — StudentOS

## 1. Architectural Overview

StudentOS employs a decoupled client-server architecture with clear segregation between presentation, application logic, data persistence, and machine learning inference.

```
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 15 Client (App Router)            │
│  - TypeScript strict mode    - Tailwind CSS styling         │
│  - Recharts visualizations   - React Context Auth & Shell   │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON over HTTP REST
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Application Server                │
│  - 15 Modular Route Handlers - JWT Authentication & Argon2  │
│  - Pydantic V2 Schemas       - SQLAlchemy 2.0 ORM Engine    │
└───────────────┬──────────────────────────────┬──────────────┘
                │                              │
                ▼                              ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│   Database Layer (SQLite)    │ │   ML Inference Pipeline     │
│  - 12 Relational Tables      │ │  - Ridge Regression Engine  │
│  - Alembic Version Migrations│ │  - Gradient Boosting Clf    │
│  - User-isolated queries     │ │  - Counterfactual Simulator │
└──────────────────────────────┘ └─────────────────────────────┘
```

---

## 2. Technology Stack & Rationale

| Layer | Technology | Selection Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 15 (App Router) | High performance React 19 architecture, optimized bundle splitting, type-safe route trees. |
| **Language (UI)** | TypeScript 5.7+ | Strict typing across 25+ interfaces eliminates runtime schema discrepancies. |
| **Styling** | Tailwind CSS 3.4 | Consistent slate/brand color tokens, rapid utility styling, responsive viewport scaling. |
| **Data Visualization** | Recharts 2.15 | Declarative SVG charting for bar distributions, progress lines, and comparative projections. |
| **Backend Framework** | FastAPI | High throughput async Python, automatic OpenAPI generation, clean dependency injection. |
| **Data Validation** | Pydantic V2 | High speed schema validation, strict type coercion, field level boundaries. |
| **ORM & Migrations** | SQLAlchemy 2.0 + Alembic | Enterprise grade relational mapping, seamless migration version tracking. |
| **Database** | SQLite (Default) / Postgres | Zero-configuration local development portability with instant production swap. |
| **Machine Learning** | scikit-learn 1.6+ | Battle-tested, mathematically rigorous implementations of Ridge and Gradient Boosting. |
| **Model Serialization** | Joblib | Fast, memory-mapped persistence of trained pipeline estimators and scaler weights. |

---

## 3. Data Flow Pipelines

### A. Digital Twin State Computation
1. Student updates an attendance record or logs daily study hours.
2. `DigitalTwinService.compute_student_state(user, db)` aggregates records across:
   - Attendance summary (conducted vs attended classes)
   - Academic assessment averages
   - 14-day study frequency and focus ratings
   - Coding problem logs and weekly velocity
3. The derived 10-dimensional feature vector is generated and clamped to valid domains.
4. Feature vector is dispatched to `model_loader.predict_performance()` and `model_loader.predict_risk()`.
5. Snapshot is saved to `digital_twin_snapshots` table for historical audit.

### B. Counterfactual What-If Simulation
1. Client submits prospective modifications (e.g. `{ daily_study_hours: 4.5, attendance_percentage: 92 }`).
2. `SimulationService` retrieves current baseline features and performs an in-memory `copy.deepcopy()`.
3. Overrides only specified parameters; real database tables are **never mutated**.
4. Dispatches the synthetic vector into the ML inference pipelines.
5. Computes delta impact ($\Delta\text{CGPA}$, risk level shift, probability delta) and identifies top contributing drivers.
6. Returns side-by-side comparative payload to the UI.
