let lastTime = new Date().getTime();
const checkInterval = 3000;
const sleepThreshold = 60000;

setInterval(function () {
  const currentTime = new Date().getTime();

  if (currentTime > lastTime + sleepThreshold) {
    // ignore small delays
    postMessage({type: 'wakeup', elapsedMs: currentTime - lastTime});
  }

  lastTime = currentTime;
}, checkInterval);
