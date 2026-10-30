#!/usr/bin/env bash
# StudentOS Frontend Launcher
cd "$(dirname "$0")/frontend" || exit 1
echo "=================================================="
echo " Starting StudentOS Next.js Frontend"
echo " Dashboard will be available at: http://localhost:3000"
echo " (If port 3000 is occupied, run: npm run dev:3001)"
echo "=================================================="
npm run dev
