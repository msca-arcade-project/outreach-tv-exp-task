// shared/autoplay.js
// Headless auto-responder for recording a clean demo run: watches the
// engine's items and calls engine.respond() with the correct answer a
// short, randomised delay after each item enters the response zone --
// so a run can be screen-recorded hands-free instead of relying on live
// keypresses, which risk visible mistakes and split-second timing on camera.
// Delay is capped well under the zone transit time (zone height / scroll
// speed) so the response always lands before the engine would otherwise
// auto-score the item as missed.

function startAutoResponder(engine, { minDelayMs = 180, maxDelayMs = 380, pollMs = 40 } = {}) {
  const timer = setInterval(() => {
    if (engine.finished) {
      clearInterval(timer);
      return;
    }
    const pending = engine.items.find(
      (it) => !it.scored && it.enteredZoneAt !== null && !it._autoQueued
    );
    if (!pending) return;
    pending._autoQueued = true;
    const delay = minDelayMs + Math.random() * (maxDelayMs - minDelayMs);
    setTimeout(() => {
      if (!pending.scored) engine.respond(pending.isTarget);
    }, delay);
  }, pollMs);
  return timer;
}
