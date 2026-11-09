// shared/notifications.js
// Shared positioning logic for floating notifications -- both lean and
// showcase use this; their visual skin (bubble vs. ad-card) stays local to
// each, per the project's existing shared-logic/local-styling split.

const NOTIF_ZONE_IDS = [
  'top-left', 'top-right',
  'mid-left', 'mid-right',
  'bottom-left', 'bottom-right',
];

// Real notification graphics supplied by the TV show's own graphics team
// (shared/assets/notifications/) -- commissioned specifically for this use,
// a different situation from the no-scraped/no-licensed-media rule in
// todo.md, which exists to guard against unauthorized exposure, not against
// assets the broadcaster's own team hands over for this exact purpose.
// Shared here (not local to showcase/) because both showcase and the
// progressive alternative use the same set.
const NOTIFICATION_CARDS = [
  { src: '../shared/assets/notifications/instagram.png', alt: 'Instagram -- 138 personnes ont aimé' },
  { src: '../shared/assets/notifications/messages-maman.png', alt: 'Messages -- Maman' },
  { src: '../shared/assets/notifications/mail.png', alt: 'Mail -- réservation au restaurant' },
  { src: '../shared/assets/notifications/psg-om.png', alt: 'PSG-OM -- but à la 38e minute' },
  { src: '../shared/assets/notifications/messages-babysitter.png', alt: 'Messages -- Babysitter' },
  { src: '../shared/assets/notifications/podcasts.png', alt: 'Podcasts -- nouvel épisode du JT' },
  { src: '../shared/assets/notifications/banque.png', alt: 'Banque -- dernière vérification' },
  { src: '../shared/assets/notifications/calendrier.png', alt: 'Agenda -- rappel vétérinaire' },
  { src: '../shared/assets/notifications/remboursement.png', alt: 'Remboursement -- Laura vous a envoyé 16 €' },
  { src: '../shared/assets/notifications/ecran-temps.png', alt: 'Temps d\'écran -- rapport hebdomadaire disponible' },
  { src: '../shared/assets/notifications/tiktok.png', alt: 'TikTok -- 3 nouvelles vidéos pourraient vous intéresser' },
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

// Target notification rate (per second) at a given fraction of trial
// progress, for the 'progressive' alternative: zero before halfway, ramping
// linearly up to maxRatePerSec between 50% and 90% progress, then flat for
// the final 10% -- TAT's spec, phrased in percent-of-trials rather than
// wall-clock seconds so it scales to any ?trials=N without a redeploy.
function rampedDistractorRate(progressFrac, maxRatePerSec) {
  if (progressFrac < 0.5) return 0;
  if (progressFrac >= 0.9) return maxRatePerSec;
  return maxRatePerSec * (progressFrac - 0.5) / 0.4;
}

// Progressive-alternative counterpart to startNotifCycle above: instead of a
// fixed display/fade/gap cycle, this polls engine progress every `pollMs`
// while idle (no notification currently showing) and rolls a Poisson-style
// hit each tick with probability `rate * pollMs/1000` -- a non-homogeneous
// Poisson process, so "gradually increase in frequency" falls out of
// rampedDistractorRate() directly instead of a hand-tuned step schedule.
// `mountNext` has the same contract as startNotifCycle's (builds and mounts
// the next notification, returns its zone wrapper); display/fade timing
// reuses the same NOTIF_DISPLAY_MS/NOTIF_FADE_MS constants so a progressive
// notification looks and feels identical to a lean/showcase one, only the
// gap between them varies. Returns the same `{ stop() }` shape as
// startNotifCycle.
//
// maxRatePerSec default: each shown notification occupies
// NOTIF_DISPLAY_MS+NOTIF_FADE_MS (4.5s) of "busy" time where no new one can
// start, so throughput saturates well below the raw rate for any max much
// above roughly 1/4.5s -- at the original 1/8 default, a 50-trial/~60s run
// (distraction active only in the back half) averaged under 2 notifications
// total, reported as "only a couple" in practice. 1.5/s keeps the ramp's
// shape (confirmed via simulation: still zero before 50% progress, then a
// clear rise through the 50-90% window) while saturating throughput to
// ~6 notifications over that same run -- noticeably more active without
// needing a faster display/fade cycle.
function startProgressiveNotifCycle(mountNext, engine, { maxRatePerSec = 1.5, pollMs = 250 } = {}) {
  let currentWrapper = null;
  let timers = [];
  let pollTimer = null;
  const schedule = (fn, ms) => { timers.push(setTimeout(fn, ms)); };

  const showNext = () => {
    currentWrapper = mountNext();
    schedule(() => {
      currentWrapper.classList.add('notif-hiding');
      schedule(() => {
        currentWrapper.remove();
        currentWrapper = null;
      }, NOTIF_FADE_MS);
    }, NOTIF_DISPLAY_MS);
  };

  pollTimer = setInterval(() => {
    if (currentWrapper || engine.totalItems <= 0) return;
    const progressFrac = engine.spawnedCount / engine.totalItems;
    const rate = rampedDistractorRate(progressFrac, maxRatePerSec);
    if (Math.random() < rate * (pollMs / 1000)) showNext();
  }, pollMs);

  return {
    stop() {
      clearInterval(pollTimer);
      timers.forEach(clearTimeout);
      timers = [];
      if (currentWrapper) currentWrapper.remove();
      currentWrapper = null;
    },
  };
}
