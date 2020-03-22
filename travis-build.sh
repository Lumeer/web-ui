#!/bin/bash
# Abort on Error
set -e

# Set up a repeating loop to send some output to Travis.
export PING_SLEEP=300s
bash -c "while true; do echo \$(date) - building ...; sleep $PING_SLEEP; done" &
export BUILD_PING_LOOP_PID=$!

LUMEER_ENV=testing NODE_OPTIONS=--max_old_space_size=7000 mvn clean install -Dcontext.root=/

kill $BUILD_PING_LOOP_PID 2> /dev/null || :
