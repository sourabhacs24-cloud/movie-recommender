#!/bin/bash
# =============================================================================
# build.sh - Auto-compile C Recommendation Engine for Linux Deployment
# =============================================================================
# This script compiles the C programs during cloud deployment.
# Runs automatically on Render/Railway before starting the Flask server.
# =============================================================================

set -e  # Exit immediately if any command fails

echo "=========================================="
echo "Building Movie Recommender Engine..."
echo "=========================================="

# Navigate to c_engine directory where source files are located
cd c_engine

echo "[1/4] Checking for source files..."
if [ ! -f "recommender.c" ]; then
    echo "ERROR: recommender.c not found!"
    exit 1
fi
if [ ! -f "system_main.c" ]; then
    echo "ERROR: system_main.c not found!"
    exit 1
fi
echo "      Found all source files"

echo "[2/4] Compiling recommender..."
gcc -o recommender recommender.c -lm

echo "[3/4] Compiling movie_system..."
gcc -o movie_system system_main.c auth.c chat.c comments.c mylist.c friends.c utils.c -lm

echo "[4/4] Verifying compilation..."
if [ ! -f "recommender" ]; then
    echo "ERROR: Compilation failed - recommender not created!"
    exit 1
fi
if [ ! -f "movie_system" ]; then
    echo "ERROR: Compilation failed - movie_system not created!"
    exit 1
fi
echo "      Executables created successfully"

# Make executables (just in case)
chmod +x recommender
chmod +x movie_system

echo "=========================================="
echo "Build completed successfully!"
echo "=========================================="

