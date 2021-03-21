#!/bin/sh
# prepare local environment file if not exists

if [ ! -f ./src/app/configuration/configuration.ts ]; then
    cp ./src/environments/configuration.local.ts ./src/app/configuration/configuration.ts || true
fi
