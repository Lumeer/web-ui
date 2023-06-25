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

echo "Starting backend..."
./travis-start-engine.sh
RESPONSE=$(curl http://localhost:8080/lumeer-engine/)

PASSED=false
echo "Running E2E tests..."
set +e
npm run playwright:run
if [[ $? -ne 0 ]]; then
  set -e
  npm run playwright:run

  if [[ $? -eq 0 ]]; then
    PASSED=true
  fi
else
  set -e
  PASSED=true
fi

echo "Stopping frontend..."
pkill npm

echo "Stopping backend..."
./travis-stop-engine.sh

echo "Printing bundle sizes..."
npm run bundlesize

kill $PING_LOOP_PID
