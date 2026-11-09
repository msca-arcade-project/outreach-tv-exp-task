// progressive/distractor.js -- Alternative C: a single run where
// distractions start at zero and ramp in over the second half, using the
// same real notification PNGs as showcase (NOTIFICATION_CARDS, shared in
// shared/notifications.js). The pacing itself (startProgressiveNotifCycle,
// also shared/notifications.js) is what's different from showcase -- this
// file only supplies the per-notification element, same shape as
// showcase/distractor.js and lean/distractor.js.

let progressiveCycle = null;

function startProgressiveDistractor(soundEngine, engine) {
  const layer = document.getElementById('distractor-layer');
  const nextCard = createShuffledPicker(NOTIFICATION_CARDS);
  const mountNext = () => {
    const zoneId = pickNotifZone(progressiveCycle.lastZoneId);
    progressiveCycle.lastZoneId = zoneId;
    const card = nextCard();

    const imgEl = document.createElement('img');
    imgEl.className = 'notif showcase-card notif--ad';
    imgEl.src = card.src;
    imgEl.alt = card.alt;

    if (soundEngine) soundEngine.playAdDing();
    return mountNotif(layer, zoneId, imgEl);
  };
  progressiveCycle = { lastZoneId: null, controller: null };
  progressiveCycle.controller = startProgressiveNotifCycle(mountNext, engine);
}

function stopProgressiveDistractor() {
  if (progressiveCycle) progressiveCycle.controller.stop();
  progressiveCycle = null;
}
