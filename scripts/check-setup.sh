#!/bin/bash

# Setup verification script
echo "🔍 Checking ProTime Dashboard setup..."
echo ""

# Check Node.js version
echo "✓ Node.js version:"
node --version
echo ""

# Check if .env exists
if [ -f backend/.env ]; then
  echo "✅ backend/.env found"
else
  echo "❌ backend/.env NOT found"
  echo "   Run: cp backend/.env.example backend/.env"
  echo "   Then edit it with your Jira credentials"
fi
echo ""

# Check if dependencies are installed
if [ -d backend/node_modules ]; then
  echo "✅ Backend dependencies installed"
else
  echo "❌ Backend dependencies NOT installed"
  echo "   Run: cd backend && npm install"
fi

if [ -d frontend/node_modules ]; then
  echo "✅ Frontend dependencies installed"
else
  echo "❌ Frontend dependencies NOT installed"
  echo "   Run: cd frontend && npm install"
fi
echo ""

# Check if database exists
if [ -f database/protime.db ]; then
  echo "✅ Database exists"
  DB_SIZE=$(du -h database/protime.db | cut -f1)
  echo "   Size: $DB_SIZE"
else
  echo "⚠️  Database NOT found"
  echo "   Run: npm run sync (after setting up .env)"
fi
echo ""

# Check if ports are available
echo "📡 Checking ports..."
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "⚠️  Port 3001 already in use"
else
  echo "✅ Port 3001 available (backend)"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "⚠️  Port 3000 already in use"
else
  echo "✅ Port 3000 available (frontend)"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f backend/.env ] && [ -d backend/node_modules ] && [ -d frontend/node_modules ]; then
  echo "✨ Setup looks good!"
  if [ ! -f database/protime.db ]; then
    echo "📝 Next step: Run 'npm run sync' to load data"
  else
    echo "🚀 Ready to start: Run './scripts/dev.sh'"
  fi
else
  echo "⚠️  Setup incomplete. Follow the steps above."
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
