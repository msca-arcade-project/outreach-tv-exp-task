// showcase/distractor.js -- Alternative B: real notification graphics
// supplied by the TV show's own graphics team. The card list itself
// (NOTIFICATION_CARDS) lives in shared/notifications.js now, since the
// progressive alternative uses the same set.

let showcaseCycle = null;

// Originally shape-followed-position (oblong at the bottom, square at the
// sides), per the TV feedback's own spec -- dropped for showcase once real
// fixed-aspect-ratio (~3:1) PNGs replaced the procedural emoji/color cards:
// a true square box can only grow until the wide banner's height hits the
// box edge, rendering it at ~59% the linear size of the oblong rendering.
// That read as "random, size inconsistent between notifications" since zone
// placement is independent of which image is showing. One consistent box
// size in every zone fixes it outright.
function startShowcaseDistractor(soundEngine) {
  const layer = document.getElementById('distractor-layer');
  const nextCard = createShuffledPicker(NOTIFICATION_CARDS);
  const mountNext = () => {
    const zoneId = pickNotifZone(showcaseCycle.lastZoneId);
    showcaseCycle.lastZoneId = zoneId;
    const card = nextCard();

    const imgEl = document.createElement('img');
    imgEl.className = 'notif showcase-card notif--ad';
    imgEl.src = card.src;
    imgEl.alt = card.alt;

    if (soundEngine) soundEngine.playAdDing();
    return mountNotif(layer, zoneId, imgEl);
  };
  showcaseCycle = { lastZoneId: null, controller: null };
  showcaseCycle.controller = startNotifCycle(mountNext);
}

function stopShowcaseDistractor() {
  if (showcaseCycle) showcaseCycle.controller.stop();
  showcaseCycle = null;
}
