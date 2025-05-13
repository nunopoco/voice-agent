#!/bin/bash

# Kill any existing node processes
pkill -f "node server/index.js" || true

# Start the server
node server/index.js > server.log 2>&1 &

echo "Server started on port 12000"
echo "Access the application at https://work-1-hrxkpfmsgclolbgr.prod-runtime.all-hands.dev"