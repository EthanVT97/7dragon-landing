#!/usr/bin/env bash
# exit on error
set -eo pipefail

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies
echo "Installing dependencies..."
npm ci

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  echo "VUE_APP_SUPABASE_URL=https://xnujjoarvinvztccwrye.supabase.co" > .env
  echo "VUE_APP_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudWpqb2Fydmludnp0Y2N3cnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNzc1OTAsImV4cCI6MjA1MDg1MzU5MH0.pyxlMZkDM53RWaPHc4GhsoKdaGDqbkn2p7b1cXF3Wgs" >> .env
fi

# Clean dist directory
echo "Cleaning dist directory..."
rm -rf dist

# Build the Vue application
echo "Building application..."
npm run build

# Verify build
if [ ! -d "dist" ]; then
  echo "Build failed: dist directory not created"
  exit 1
fi

if [ ! -f "dist/index.html" ]; then
  echo "Build failed: index.html not found in dist"
  exit 1
fi

echo "Build completed successfully!"
