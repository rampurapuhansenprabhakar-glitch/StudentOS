# StudentOS: AI-Powered Digital Twin for Personalized Student Success

> **“Track. Predict. Simulate. Improve.”**
> A 3rd-Year B.Tech Computer Science and Engineering (Artificial Intelligence and Machine Learning) Innovative Capstone Project.

---

## 🎓 Executive Summary

**StudentOS** is a full-stack, local-first platform that establishes an evolving **Digital Twin** for college students. Moving beyond static grade trackers, StudentOS dynamically aggregates academic evaluation scores, lecture attendance, daily study habits, and competitive coding logs. It utilizes trained scikit-learn models to forecast next-semester CGPA and early academic risks, features a **counterfactual What-If Simulation Sandbox** allowing students to test hypothetical habit changes without altering real data, and generates grounded, rule-based interventions to improve graduation outcomes.

---

## ⚡ Quick Start Guide (macOS & Local Environments)

### 1. Prerequisites
- **Python 3.10+** (Python 3.11 / 3.12 / 3.14 compatible)
- **Node.js 18+** & **npm**
- SQLite (built into Python) or PostgreSQL

### 2. Backend Setup
```bash
cd backend

# Create virtual environment and activate
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (creates studentos.db)
alembic upgrade head

# Train ML models & generate synthetic artifacts
python scripts/train_models.py

# Seed demo student profile (Alex Rivera)
python scripts/seed_demo_data.py

# Launch FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend API will be active at: `http://localhost:8000`  
Swagger API Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Run type check and verify build
npm run build

# Start Next.js development server
npm run dev
```
Frontend will be live at: `http://localhost:3000`

### 4. 1-Click Demo Login
On the login screen (`http://localhost:3000/login`), click **"Fill Demo Credentials"** to populate:
- **Email:** `demo@studentos.internal`
- **Password:** `StudentOS@Demo2026`

---

## 🏛️ Architecture & Five-Tier Intelligence Taxonomy

To ensure ethical AI compliance and avoid misleading buzzwords, StudentOS partitions computational logic into 5 distinct tiers:

1. **Supervised ML Inference**: `RidgeRegression` ($R^2=0.903$, $\text{RMSE}=0.275$) and `GradientBoostingClassifier` ($\text{Macro }F1=0.856$, $\text{ROC-AUC}=0.979$) trained locally on 2,500 synthetic engineering records.
2. **Counterfactual Simulation Engine**: Deep-copies baseline features to evaluate *What-If* scenarios (e.g. $+2$ study hours/day, $95\%$ attendance) in an isolated ephemeral state.
3. **Deterministic Heuristic Engine**: Rule-based intervention generator flagging low attendance ($<75\%$), impending deadlines, backlogs, and technical skill gaps.
4. **Descriptive Statistical Aggregators**: Daily streak trackers, variance calculators, and weekly velocity engines.
5. **Grounded Advisory Assistant**: In-app conversational advisor grounded directly on live relational records with optional local Ollama fallback.

---

## 📁 Repository Structure

```
├── backend/
│   ├── alembic/                # Database migration scripts
│   ├── app/
│   │   ├── api/routes/         # 15 FastAPI modular route handlers
│   │   ├── core/               # Configuration, JWT security, database engine
│   │   ├── ml/                 # Feature engineering, training, inference loaders
│   │   ├── models/             # 12 SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic V2 validation schemas
│   │   ├── services/           # Digital Twin, Simulation, Planner services
│   │   └── tests/              # Pytest test suite (9 passing tests)
│   ├── artifacts/              # Serialized scikit-learn models (joblib)
│   ├── data/synthetic/         # student_academic_records.csv (2,500 rows)
│   └── scripts/                # Training & demo seeding scripts
├── frontend/
│   ├── src/
│   │   ├── app/                # 20 Next.js App Router routes & pages
│   │   ├── components/         # Shared UI, layout navigation, modals, cards
│   │   ├── lib/                # API client, AuthProvider, utilities
│   │   └── types/              # Comprehensive TypeScript interfaces
└── docs/                       # Technical reports & Viva preparation guide
```

---

## 🧪 Testing & Validation

Run backend tests:
```bash
cd backend
.venv/bin/pytest
```
Run frontend type check & build verification:
```bash
cd frontend
npx tsc --noEmit
npm run build
```

---

## 📜 Academic Integrity & Synthetic Data Notice
Machine learning models were trained on 2,500 algorithmically generated synthetic engineering student records (`student_academic_records.csv`). These records represent plausible statistical distributions for research and development purposes and are explicitly labeled as synthetic throughout the application. StudentOS is a self-regulation and progress monitoring tool, not a substitute for accredited academic counseling.
