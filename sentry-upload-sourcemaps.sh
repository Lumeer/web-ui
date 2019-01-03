#!/bin/sh

export SENTRY_ORG=answer-institute-sro
export SENTRY_PROJECT=lumeerio

if [ "$SKIP_SENTRY_UPLOAD" = true ]
then
  exit 0
fi

if [ "$LUMEER_ENV" != "production" -a "$LUMEER_ENV" != "staging" ]
then
  exit 0
fi

if [ -z "$BUILD_NUMBER" ]
then
  echo -e "BUILD_NUMBER is not defined."
  exit 1
fi

if [ -z "$PUBLIC_PATH" ]
then
  echo -e "PUBLIC_PATH is not defined."
  exit 1
fi

if [ -z "$SENTRY_AUTH_TOKEN" ]
then
  echo -e "SENTRY_AUTH_TOKEN is not defined."
  exit 1
fi

./node_modules/.bin/sentry-cli releases new $BUILD_NUMBER \
  && ./node_modules/.bin/sentry-cli releases files $BUILD_NUMBER upload-sourcemaps --no-rewrite --url-prefix https://get.lumeer.io$PUBLIC_PATH ./dist/lumeer
