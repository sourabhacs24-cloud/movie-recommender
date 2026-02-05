#!/bin/bash
# =============================================================================
# start.sh - Startup script for Render deployment
# =============================================================================
# This script ensures C executables exist before starting the Flask server.
# If executables don't exist, it compiles them first.
# =============================================================================

set -e

echo "=========================================="
echo "Starting Movie Recommender..."
echo "=========================================="

# Navigate to c_engine directory
cd c_engine

# Check if executables exist, if not compile them
if [ ! -f "recommender" ]; then
    echo "Compiling recommender..."
    gcc -o recommender recommender.c -lm
    chmod +x recommender
    echo "recommender compiled successfully"
fi

if [ ! -f "movie_system" ]; then
    echo "Compiling movie_system..."
    gcc -o movie_system system_main.c auth.c comments.c chat.c mylist.c friends.c utils.c -lm
    chmod +x movie_system
    echo "movie_system compiled successfully"
fi

# Go back to root
cd ..

echo "Starting Flask server..."
gunicorn --chdir backend app:app --bind 0.0.0.0:$PORT
