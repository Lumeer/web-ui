#!/bin/bash

VERSION=$(git log --pretty=format:'%h' -n 1)
FAILED=0

# trigger <repository> <token file>
# Starts a Bitbucket pipeline; prints the HTTP status and Bitbucket's error response on failure.
trigger() {
  local repo=$1 token_file=$2
  if [ ! -s "$token_file" ]; then
    echo "ERROR: $repo not triggered, token file $token_file is missing or empty" >&2
    FAILED=1
    return
  fi
  local body status
  body=$(mktemp)
  status=$(curl -X POST -s -o "$body" -w '%{http_code}' -H "Authorization: Bearer $(cat "$token_file")" -H "Content-Type: application/json" "https://api.bitbucket.org/2.0/repositories/lumeer/$repo/pipelines/" -d "$(sed 's/\$VERSION/'"$VERSION"'/' < docker-pipeline-request.txt)")
  if [ "${status:0:1}" = "2" ]; then
    echo "OK: $repo pipeline triggered (HTTP $status)"
  else
    echo "ERROR: $repo trigger failed (HTTP ${status:-no response})" >&2
    cat "$body" >&2
    echo >&2
    FAILED=1
  fi
  rm -f "$body"
}

if [ "x$TRAVIS_PULL_REQUEST" = "xfalse" -o -z "$TRAVIS_PULL_REQUEST" ]; then
  if [ "x$TRAVIS_BRANCH" = "xdevel" ]; then
    echo Trigger devel rebuild
    trigger app-devel-v2 .bb.devel.token
  fi
  if [ "x$TRAVIS_BRANCH" = "xmaster" ]; then
    echo Trigger master rebuild
    trigger app-prod-v2 .bb.token
    trigger app-pub-v2 .bb.pub.token
  fi
else
  echo "Skipping trigger for PR"
fi

exit $FAILED
