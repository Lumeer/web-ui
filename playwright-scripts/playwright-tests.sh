#!/bin/bash
# Abort on Error
set -e

# Set up a repeating loop to send some output to Github Actions environment.
export PING_SLEEP=300s
bash -c "while true; do echo \$(date) - building ...; sleep $PING_SLEEP; done" &
export PING_LOOP_PID=$!

echo "Starting frontend..."
npm run http-server &
while ! curl --output /dev/null --silent -r 0-0 --fail "http://127.0.0.1:7000"; do
  sleep 3
done
cd playwright-scripts
echo "Starting backend..."
./start-engine.sh
RESPONSE=$(curl http://localhost:8080/lumeer-engine/)

PASSED=false
cd ../
echo "Running E2E tests..."
npm run playwright:run

echo "Stopping frontend..."
pkill npm

cd playwright-scripts
echo "Stopping backend..."
./stop-engine.sh

echo "Printing bundle sizes..."
npm run bundlesize

kill $PING_LOOP_PID
