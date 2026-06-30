#!/bin/sh
set -e

echo "Starting Smart CRM server..."
npx tsx src/index.ts &
SERVER_PID=$!

echo "Waiting for server to be ready..."
for i in $(seq 1 30); do
  if wget -qO- http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "Server is ready"
    break
  fi
  sleep 1
done

echo "Seeding database..."
npx tsx seed.js || echo "Seed completed (or already seeded)"

echo "Smart CRM running on port 3001"
wait $SERVER_PID
