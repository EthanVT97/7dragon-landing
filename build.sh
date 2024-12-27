#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npm run build

# Copy the example env file if .env doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
fi
