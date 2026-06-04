#!/bin/bash

# VIMICX Cap Table Visualization Tool - Local Dev Start Script
echo "========================================================"
echo "  VIMICX - Starting Cap Table & Dilution Web App"
echo "========================================================"

# Terminate all background processes spawned by this script on exit
trap 'kill $(jobs -p) 2>/dev/null' EXIT

# Start Backend Server
echo "🚀 Starting Node/Express Backend on http://localhost:5001..."
cd backend
npm start &
cd ..

# Start Frontend Server
echo "🚀 Starting React/Vite Frontend on http://localhost:3000..."
cd frontend

# Automatically open the web app after a brief delay
(sleep 1.5 && open "http://localhost:3000") &

npm run dev
