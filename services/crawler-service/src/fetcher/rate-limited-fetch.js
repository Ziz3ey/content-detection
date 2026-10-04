function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function createRateLimitedFetch(
  fetchImpl,
  delayMs,
  now = Date.now,
  sleep = wait,
) {
  let previousRequestAt = null;

  return async (...args) => {
    if (previousRequestAt !== null) {
      const elapsed = now() - previousRequestAt;
      const remainingDelay = delayMs - elapsed;
      if (remainingDelay > 0) {
        await sleep(remainingDelay);
      }
    }

    previousRequestAt = now();
    return fetchImpl(...args);
  };
}

module.exports = { createRateLimitedFetch };
