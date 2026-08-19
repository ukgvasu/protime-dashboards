#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="/opt/homebrew/bin:$SCRIPT_DIR/node_modules/.bin:$PATH"
cd "$SCRIPT_DIR"
# Load .env file for backend
export $(grep -v '^#' backend/.env | xargs)
npm run dev
