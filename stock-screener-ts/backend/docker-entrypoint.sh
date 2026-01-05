#!/bin/sh
set -e

echo "Running prisma generate (safe)..."
npx prisma generate >/dev/null 2>&1 || true

echo "Running prisma migrate deploy..."
npx prisma migrate deploy

echo "Starting API..."
node dist/index.js
