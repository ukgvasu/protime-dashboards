#!/bin/bash

# Development startup script
# Runs backend and frontend concurrently in separate terminal tabs

echo "🚀 Starting ProTime Dashboard development environment..."

# Check if .env exists
if [ ! -f backend/.env ]; then
  echo "❌ Error: backend/.env file not found"
  echo "📝 Copy backend/.env.example to backend/.env and add your Jira credentials"
  exit 1
fi

# Check if database exists
if [ ! -f database/protime.db ]; then
  echo "⚠️  Warning: Database not found. Run 'npm run sync' first to populate data."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "✅ Starting backend on port 3001..."
cd backend && npm run dev &
BACKEND_PID=$!

echo "✅ Starting frontend on port 3000..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   🎉 ProTime Dashboard is running!                        ║"
echo "║                                                           ║"
echo "║   Frontend: http://localhost:3000                         ║"
echo "║   Backend:  http://localhost:3001                         ║"
echo "║                                                           ║"
echo "║   Press Ctrl+C to stop all services                       ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Handle Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Wait for both processes
wait
