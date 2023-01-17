let lastTime = new Date().getTime();
const checkInterval = 3000;
const sleepThreshold = 60_000;

setInterval(function () {
  const currentTime = new Date().getTime();

  if (currentTime > lastTime + sleepThreshold) {
    // ignore small delays
    postMessage('wakeup');
  }

  lastTime = currentTime;
}, checkInterval);
