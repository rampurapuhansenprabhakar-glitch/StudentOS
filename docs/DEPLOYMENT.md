# Deployment & Operational Guide — StudentOS

This document details local execution, containerization, and production deployment considerations for StudentOS.

---

## 1. Local Development Architecture

The default development setup requires no external services or network access:
- **Backend:** FastAPI running under Uvicorn (`http://localhost:8000`).
- **Database:** Local SQLite database file (`backend/studentos.db`).
- **Frontend:** Next.js development server (`http://localhost:3000`).

```bash
# Terminal 1 - Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 2. Docker & Docker Compose Setup

A complete multi-container setup with PostgreSQL is provided via `docker-compose.yml`.

### Architecture:
- `db`: PostgreSQL 16 image storing persistent relational tables.
- `backend`: FastAPI container with Python 3.11+, scikit-learn, and Uvicorn.
- `frontend`: Next.js production build served on port 3000.

### Launching with Docker:
```bash
docker-compose up --build -d
```
Stop services:
```bash
docker-compose down
```

---

## 3. Environment Variables Configuration

### Backend (`backend/.env`):
```ini
PROJECT_NAME="StudentOS"
API_V1_STR="/api/v1"
SECRET_KEY="replace-with-at-least-32-characters-secure-random-string"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL="sqlite:///./studentos.db"
ML_ARTIFACTS_DIR="./artifacts"
CORS_ORIGINS=["http://localhost:3000"]
ENABLE_OLLAMA=false
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2"
```

### Frontend (`frontend/.env.local`):
```ini
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
```

---

## 4. Production Hardening Checklist

1. **Database:** Migrate from SQLite to a managed PostgreSQL instance with connection pooling (`pool_size=10`, `max_overflow=20`).
2. **Reverse Proxy:** Terminate TLS using Nginx or Caddy with automated Let's Encrypt certificates.
3. **CORS:** Restrict `CORS_ORIGINS` strictly to the verified production domain.
4. **Secret Management:** Inject `SECRET_KEY` via encrypted environment secret managers rather than `.env` text files.
5. **Static Assets:** Serve Next.js production chunks via CDN caching headers (`max-age=31536000, immutable`).
