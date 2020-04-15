#!/usr/bin/env bash

mkdir -p ~/bin
url="https://raw.githubusercontent.com/sormuras/bach/master/install-jdk.sh"
wget "$url" -P ~/bin/ || {
  echo "${ANSI_RED}Could not acquire install-jdk.sh. Stopping build.${ANSI_RESET}" >/dev/stderr
  exit 2
}
chmod +x ~/bin/install-jdk.sh
mkdir ~/jdk
export JAVA_HOME="~/jdk"
# shellcheck disable=SC2016
export PATH="$JAVA_HOME/bin:$PATH"
# shellcheck disable=2088
~/bin/install-jdk.sh -f 13 -o linux-x64 --target "$JAVA_HOME" --workspace "$TRAVIS_HOME/.cache/install-jdk" --cacerts
