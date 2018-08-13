#!/bin/bash
PID=$(cat engine.pid)
if [ ! -z $PID ]; then
  echo "Stopping engine..."
  if ps -p $PID >/dev/null; then
    kill $PID
    sleep 5
    if ps -p $PID >/dev/null; then
      kill -9 $PID
    fi
  fi

  rm engine.pid

  echo "Engine stopped!"
fi
