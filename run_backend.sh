#!/usr/bin/env bash
# StudentOS Backend Launcher
cd "$(dirname "$0")/backend" || exit 1
source .venv/bin/activate
echo "=================================================="
echo " Starting StudentOS FastAPI Backend on Port 8000"
echo " Interactive Docs: http://localhost:8000/docs"
echo "=================================================="
uvicorn app.main:app --reload --port 8000
