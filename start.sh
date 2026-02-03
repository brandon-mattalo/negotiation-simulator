#!/bin/bash

echo "========================================="
echo "Starting Negotiation Simulator"
echo "========================================="
echo ""
echo "Backend will run on: http://localhost:3001"
echo "Frontend will run on: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup INT TERM

# Start backend
echo "Starting backend..."
(cd "$SCRIPT_DIR/backend" && npm run dev) &
BACKEND_PID=$!

# Wait and health-check the backend before starting frontend
echo "Waiting for backend to be ready..."
for i in {1..10}; do
    sleep 2
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✓ Backend is ready"
        break
    fi
    # Check if backend process has died
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo ""
        echo "✗ Backend failed to start. Check the output above for errors."
        echo "  Common issues:"
        echo "    - PostgreSQL is not running"
        echo "    - Missing or incorrect DATABASE_URL in backend/.env"
        echo "    - Missing CLAUDE_API_KEY in backend/.env"
        exit 1
    fi
    echo "  Waiting... (attempt $i/10)"
done

# Start frontend
echo "Starting frontend..."
(cd "$SCRIPT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "========================================="
echo "✓ Both servers started!"
echo "========================================="
echo ""
echo "Open your browser to: http://localhost:5173"
echo ""

# Wait for both processes
wait
