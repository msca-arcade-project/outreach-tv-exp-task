// progressive/distractor.js -- Alternative C: a single run where
// distractions start at zero and ramp in over the second half, using the
// same real notification PNGs as showcase (NOTIFICATION_CARDS, shared in
// shared/notifications.js). The pacing itself (startProgressiveNotifCycle,
// also shared/notifications.js) is what's different from showcase -- this
// file only supplies the per-notification element, same shape as
// showcase/distractor.js and lean/distractor.js.

let progressiveCycle = null;

// `maxRatePerSec`, `displayMs` and `overlap`, when provided
// (progressive/index.html's own ?maxrate=/?displayms=/?overlap= overrides),
// pass straight through to startProgressiveNotifCycle; when undefined, that
// function's own defaults (shared/notifications.js) apply.
function startProgressiveDistractor(soundEngine, engine, { maxRatePerSec, displayMs, overlap } = {}) {
  const layer = document.getElementById('distractor-layer');
  const nextCard = createShuffledPicker(NOTIFICATION_CARDS);
  // `occupiedZoneIds` (the set of zones currently in use) is owned and
  // passed in by startProgressiveNotifCycle -- that's also what tracks the
  // zone-repeat guarantee across calls now, so this function has no zone
  // bookkeeping of its own.
  const mountNext = (occupiedZoneIds) => {
    const zoneId = pickNotifZone(occupiedZoneIds);
    if (!zoneId) return null;
    const card = nextCard();

    const imgEl = document.createElement('img');
    imgEl.className = 'notif showcase-card notif--ad';
    imgEl.src = card.src;
    imgEl.alt = card.alt;

    if (soundEngine) soundEngine.playAdDing();
    return mountNotif(layer, zoneId, imgEl);
  };
  progressiveCycle = startProgressiveNotifCycle(mountNext, engine, { maxRatePerSec, displayMs, overlap });
}

function stopProgressiveDistractor() {
  if (progressiveCycle) progressiveCycle.stop();
  progressiveCycle = null;
}
