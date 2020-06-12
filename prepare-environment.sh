#!/bin/sh
# prepare local environment file if not exists

if [ ! -f ./src/environments/environment.ts ]; then
    cp ./src/environments/showTopPanelisPublic.ts ./src/environments/environment.ts || true
fi
