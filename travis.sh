#!/bin/bash
# Abort on Error
set -e

# Set up a repeating loop to send some output to Travis.
export PING_SLEEP=300s
bash -c "while true; do echo \$(date) - building ...; sleep $PING_SLEEP; done" &
export PING_LOOP_PID=$!

echo "Starting frontend..."
npm run http-server &
while ! curl --output /dev/null --silent -r 0-0 --fail "http://localhost:7000"; do
  sleep 3
done

echo "Starting backend..."
./travis-start-engine.sh

PASSED=false
echo "Running E2E tests..."
set +e
export CYPRESS_baseUrl="http://localhost:7000"
npm run cypress:run --  --record --key b43d988f-5145-4a2b-9df3-ce3b1607f203
if [[ $? -ne 0 ]]; then
  set -e
  npm run cypress:run

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

if [ "x$PASSED" = "xtrue" ]; then
  echo Tests passed, triggering docker image creation...
  ./docker-trigger.sh
fi

kill $PING_LOOP_PID
