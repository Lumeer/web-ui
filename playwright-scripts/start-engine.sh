#!/bin/bash
ORIG=$(pwd)

if [ -d ~/.engine -a -d ~/.engine/.git ]; then
  echo "Pulling latest engine updates..."
  cd ~/.engine
  git checkout devel
  git pull origin devel
else
  echo "Downloading engine..."
  git clone https://github.com/Lumeer/engine.git ~/.engine
  cd ~/.engine
  git checkout devel
fi

chmod +w ./lumeer-core/src/main/resources/defaults-dev.properties
echo $'\n' >> ./lumeer-core/src/main/resources/defaults-dev.properties
echo $"admin_user_emails=$TEST_USER_EMAIL" >> ./lumeer-core/src/main/resources/defaults-dev.properties
echo "Building engine..."
mvn install -DskipTests -DskipITs -B --quiet
cd war

echo "Starting engine..."
rm -rf target/embedmongo
mkdir target/embedmongo
export SKIP_LIMITS=true
mvn -s settings.xml wildfly:run -PstartEngine -B --quiet &
echo $! > $ORIG/engine.pid

echo "Waiting for MongoDB to start..."
RETRY_COUNT=0
while [ $(curl -s -o /dev/null -I -w "%{exitcode}" "http://localhost:27017/") == 7 ]; do
  sleep 10
  RETRY_COUNT=$((RETRY_COUNT+1))

  if [ $RETRY_COUNT -ge 20 ]; then
    echo "Failed to start MongoDB within the retry limit."
    exit 1
  fi
done
sleep 5
echo "MongoDB started!"

echo "Waiting for engine to start..."
RETRY_COUNT=0
while [ $(curl -s -o /dev/null -I -w "%{http_code}" http://localhost:8080/lumeer-engine/rest/users) != 401 ]; do
  sleep 10
  RETRY_COUNT=$((RETRY_COUNT+1))

  if [ $RETRY_COUNT -ge 20 ]; then
    echo "Failed to start engine within the retry limit."
    exit 2
  fi
done
sleep 5
echo "Engine started!"

cd $ORIG
