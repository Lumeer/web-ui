#!/bin/sh
# prepare local environment file if not exists

if [ ! -f ./src/environments/configuration.ts ]; then
    cp ./src/environments/configuration.local.ts ./src/environments/configuration.ts || true
fi
