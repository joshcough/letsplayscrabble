#!/bin/bash

# Start TypeScript backend
echo "Starting TypeScript backend on port 3001..."
cd backend && npm run dev &
TS_PID=$!

# Give TS server time to start
sleep 3

# Start PureScript backend
echo "Starting PureScript backend on port 3002..."
cd backend-purs && npm run dev &
PS_PID=$!

echo "Both servers started!"
echo "TypeScript backend PID: $TS_PID"
echo "PureScript backend PID: $PS_PID"

# Function to kill both processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $TS_PID $PS_PID 2>/dev/null
    exit
}

# Set up trap to call cleanup on SIGINT
trap cleanup SIGINT

# Wait for both processes
wait