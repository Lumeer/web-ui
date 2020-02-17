#!/bin/bash

VERSION=$(git log --pretty=format:'%h' -n 1)

if [ "x$TRAVIS_PULL_REQUEST" = "xfalse" -o -z "$TRAVIS_PULL_REQUEST" ]; then
  if [ "x$TRAVIS_BRANCH" = "xdevel" ]; then
    echo Trigger devel rebuild
    curl -X POST -is -u "${BB_AUTH_STRING}" -H "${CONTENT_TYPE}" https://api.bitbucket.org/2.0/repositories/lumeer/app-devel-v2/pipelines/ -d "$(sed 's/\$VERSION/'"$VERSION"'/' < docker-pipeline-request.txt)"
  fi
  if [ "x$TRAVIS_BRANCH" = "xmaster" ]; then
    echo Trigger master rebuild
    curl -X POST -is -u "${BB_AUTH_STRING}" -H "${CONTENT_TYPE}" https://api.bitbucket.org/2.0/repositories/lumeer/app-prod-v2/pipelines/ -d "$(sed 's/\$VERSION/'"$VERSION"'/' < docker-pipeline-request.txt)"
  fi
else
  echo "Skipping trigger for PR"
fi