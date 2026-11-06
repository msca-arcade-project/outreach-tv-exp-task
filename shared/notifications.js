// shared/notifications.js
// Shared positioning logic for floating notifications -- both lean and
// showcase use this; their visual skin (bubble vs. ad-card) stays local to
// each, per the project's existing shared-logic/local-styling split.

const NOTIF_ZONE_IDS = [
  'top-left', 'top-right',
  'mid-left', 'mid-right',
  'bottom-left', 'bottom-right',
];

// Excludes the previous zone so consecutive notifications never land in the
// same spot -- enforces "varied locations" as a guarantee, not something
// left to chance.
function pickNotifZone(lastZoneId) {
  const choices = lastZoneId
    ? NOTIF_ZONE_IDS.filter((z) => z !== lastZoneId)
    : NOTIF_ZONE_IDS;
  return choices[Math.floor(Math.random() * choices.length)];
}

function notifZoneClass(zoneId) {
  return `notif-zone-${zoneId}`;
}

// Wraps contentEl in a small fixed-position zone wrapper and appends it to
// layerEl. The zone class (positioning, including the mid-zones' own
// transform) lives on this wrapper rather than on contentEl itself -- see
// the comment on the zone classes in shared/style.css for why that split
// matters whenever contentEl has its own transform-based animation.
function mountNotif(layerEl, zoneId, contentEl) {
  const wrapper = document.createElement('div');
  wrapper.className = notifZoneClass(zoneId);
  wrapper.appendChild(contentEl);
  layerEl.appendChild(wrapper);
  return wrapper;
}

// Arrival cue matching the main experiment's DistractorPanel.flash() and
// this project's original flashDistractorPanel(): background inverts to
// black for an instant, then eases back via a CSS transition. A double rAF
// lets the browser paint the instant "flashing" state before the
// transition starts easing it away. Generalized here so it works on any
// freshly-created element, not just one persistent panel.
function flashNotif(el) {
  el.classList.add('flashing');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.remove('flashing');
    });
  });
}

// Steps through `items` in a random order, reshuffling once exhausted, and
// never repeats the same item back-to-back across that reshuffle boundary --
// the content-sequence analogue of pickNotifZone's "no immediate repeat"
// guarantee for screen position. Replaces a plain `index % items.length`
// round-robin, which always showed the same fixed sequence run after run.
function createShuffledPicker(items) {
  let order = [];
  let pos = 0;
  function reshuffle(avoidFirst) {
    order = items.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (avoidFirst !== undefined && order.length > 1 && order[0] === avoidFirst) {
      [order[0], order[1]] = [order[1], order[0]];
    }
    pos = 0;
  }
  reshuffle();
  return function next() {
    if (pos >= order.length) reshuffle(order[order.length - 1]);
    const item = order[pos];
    pos += 1;
    return item;
  };
}

// Pacing for a longer (~60s) run: TAT's note asked for a held display
// (~4s) then a fade (500ms), and a sparser rate overall than the previous
// fixed 2.5-4s swap -- NOTIF_GAP_MS is this project's own proposed value
// (not specified), giving an ~8s full cycle.
const NOTIF_DISPLAY_MS = 4000;
const NOTIF_FADE_MS = 500;
const NOTIF_GAP_MS = 3500;

// Drives the display -> fade -> gap -> next cycle shared by both
// alternatives. `mountNext` creates and mounts the next notification (zone
// picking, element building, any arrival sound) and returns its zone
// wrapper -- the only per-alternative-specific piece; this function owns
// all the timing/state-machine logic so neither distractor.js has to
// reimplement it. Returns a controller whose stop() cancels every pending
// timer and removes whatever's currently shown, safe to call from any
// point in the cycle.
function startNotifCycle(mountNext) {
  let currentWrapper = null;
  let timers = [];
  const schedule = (fn, ms) => { timers.push(setTimeout(fn, ms)); };

  const cycle = () => {
    currentWrapper = mountNext();
    schedule(() => {
      currentWrapper.classList.add('notif-hiding');
      schedule(() => {
        currentWrapper.remove();
        currentWrapper = null;
        schedule(cycle, NOTIF_GAP_MS);
      }, NOTIF_FADE_MS);
    }, NOTIF_DISPLAY_MS);
  };
  cycle();

  return {
    stop() {
      timers.forEach(clearTimeout);
      timers = [];
      if (currentWrapper) currentWrapper.remove();
      currentWrapper = null;
    },
  };
}
