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

echo ls
chmod +w ./lumeer-core/src/main/resources/defaults-dev.properties
echo $'\n' >> ./lumeer-core/src/main/resources/defaults-dev.properties
echo $"admin_user_emails=$USER_EMAIL" >> ./lumeer-core/src/main/resources/defaults-dev.properties
cat ./lumeer-core/src/main/resources/defaults-dev.properties 
echo "Building engine..."
mvn install -DskipTests -DskipITs -B --quiet
cd war

echo "Starting engine..."
export SKIP_LIMITS=true
mvn -s settings.xml wildfly:run -PstartEngine -B --quiet &
echo $! > $ORIG/engine.pid

echo "Waiting for engine to start..."
while test $(curl -s -o /dev/null -I -w "%{http_code}" http://localhost:8080/lumeer-engine/rest/users) != 401; do
  sleep 10
done
sleep 5

echo "Engine started!"

cd $ORIG
