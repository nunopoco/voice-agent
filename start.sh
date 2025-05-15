#!/bin/bash

# Kill any existing node processes
pkill -f "node server/index.js" || true
pkill -f "vite" || true

# Start the server in the background
echo "Starting server..."
node server/index.js > server.log 2>&1 &
SERVER_PID=$!

# Wait a moment for the server to start
sleep 2

# Start Vite in development mode
echo "Starting Vite development server..."
npx vite --config vite.config.js --port 12001 > vite.log 2>&1 &
VITE_PID=$!

echo "Server running with PID: $SERVER_PID"
echo "Vite running with PID: $VITE_PID"
echo "Application available at: https://work-2-hrxkpfmsgclolbgr.prod-runtime.all-hands.dev"
echo "Logs: server.log and vite.log"