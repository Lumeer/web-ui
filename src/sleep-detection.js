let lastTime = new Date().getTime();
const checkInterval = 5000;

setInterval(function () {
  const currentTime = new Date().getTime();

  if (currentTime > lastTime + checkInterval * 2) {
    // ignore small delays
    postMessage('wakeup');
  }

  lastTime = currentTime;
}, checkInterval);
