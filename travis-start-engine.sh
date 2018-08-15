#!/bin/bash
$ORIG=$(pwd)

if [ -d ~/.engine ]; then
  echo "Pulling latest engine updates..."
  cd ~/.engine
  git checkout devel
  git pull origin devel
else
  echo "Downloading engine..."
  git clone https://github.com/Lumeer/engine.git ~/.engine
  git checkout devel
  cd ~/.engine
fi

echo "Building engine..."
mvn install -DskipTests
cd war

echo "Starting engine..."
export SKIP_LIMITS=true
export SKIP_SECURITY=true
mvn -s settings.xml wildfly:run -PstartEngine &
echo $! > $ORIG/engine.pid

echo "Waiting for engine to start..."
while ! test -f "target/wildfly-run/wildfly-13.0.0.Final/standalone/tmp/startup-marker"; do
  sleep 2
done
sleep 5

echo "Engine started!"

cd $ORIG
