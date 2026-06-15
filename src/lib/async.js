// Races a promise against a timeout, rejecting with a clearer message if it's too slow.

export function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ])
}
