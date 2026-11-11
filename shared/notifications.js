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
//
// Each src carries the project's usual ?v=N cache-busting suffix -- unlike
// every <script>/<link> tag in the index.html files, these paths never had
// one (they're built in JS, not static markup, so the bump-every-round sed
// pass never touched them). A browser that ever cached a failed/stale fetch
// for one of these URLs (a network blip, a deploy-propagation gap) had
// nothing forcing a refetch, since the URL never changed -- consistent with
// a report of one specific card showing a broken-image icon while the
// others, loaded successfully once, kept rendering fine from cache.
const NOTIFICATION_CARDS = [
  { src: '../shared/assets/notifications/instagram.png?v=47', alt: 'Instagram -- 138 personnes ont aimé' },
  { src: '../shared/assets/notifications/messages-maman.png?v=47', alt: 'Messages -- Maman' },
  { src: '../shared/assets/notifications/mail.png?v=47', alt: 'Mail -- réservation au restaurant' },
  { src: '../shared/assets/notifications/psg-om.png?v=47', alt: 'PSG-OM -- but à la 38e minute' },
  { src: '../shared/assets/notifications/messages-babysitter.png?v=47', alt: 'Messages -- Babysitter' },
  { src: '../shared/assets/notifications/podcasts.png?v=47', alt: 'Podcasts -- nouvel épisode du JT' },
  { src: '../shared/assets/notifications/banque.png?v=47', alt: 'Banque -- dernière vérification' },
  { src: '../shared/assets/notifications/calendrier.png?v=47', alt: 'Agenda -- rappel vétérinaire' },
  { src: '../shared/assets/notifications/remboursement.png?v=47', alt: 'Remboursement -- Laura vous a envoyé 16 €' },
  { src: '../shared/assets/notifications/ecran-temps.png?v=47', alt: 'Temps d\'écran -- rapport hebdomadaire disponible' },
  { src: '../shared/assets/notifications/tiktok.png?v=47', alt: 'TikTok -- 3 nouvelles vidéos pourraient vous intéresser' },
];

// Excludes the given zone(s) so consecutive (or, under progressive's
// ?overlap=yes, concurrent) notifications never land in the same spot --
// enforces "varied locations" as a guarantee, not something left to chance.
// `exclude` is a single zone id (lean's/showcase's usage -- a string or
// null/undefined, unchanged), or an array/Set of zone ids (progressive's
// usage under startProgressiveNotifCycle, which can have more than one
// notification live at once).
function pickNotifZone(exclude) {
  const excludeSet = !exclude ? null
    : exclude instanceof Set ? exclude
    : new Set(Array.isArray(exclude) ? exclude : [exclude]);
  const choices = excludeSet && excludeSet.size > 0
    ? NOTIF_ZONE_IDS.filter((z) => !excludeSet.has(z))
    : NOTIF_ZONE_IDS;
  return choices.length ? choices[Math.floor(Math.random() * choices.length)] : null;
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
  // Lets a caller read back which zone a wrapper occupies without changing
  // mountNext's return type -- startProgressiveNotifCycle's overlap support
  // needs this to build its "currently occupied zones" exclusion set.
  wrapper.dataset.zoneId = zoneId;
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

// Target notification rate (per second) at a given point in a run, for the
// 'progressive' alternative: zero until DISTRACTOR_START_TRIALS trials have
// spawned, ramping linearly from there up to maxRatePerSec at
// DISTRACTOR_PLATEAU_FRAC of totalItems, then flat for the remainder.
//
// The start is an absolute trial count (TAT playtested at the old 50%-of-
// trials start -- 25 trials at the default totalItems=50 -- and asked for
// 15 instead, not scaled by run length), while the plateau stays
// percentage-based (unchanged this round, still phrased as percent-of-
// trials so it scales to any ?trials=N).
const DISTRACTOR_START_TRIALS = 15;
const DISTRACTOR_PLATEAU_FRAC = 0.9;

function rampedDistractorRate(spawnedCount, totalItems, maxRatePerSec) {
  const plateauAt = totalItems * DISTRACTOR_PLATEAU_FRAC;
  // Clamp so a short ?trials=N run (e.g. trials=10, where the 15-trial start
  // would otherwise land past the plateau point) still gets some ramp
  // window instead of staying silent for the whole run.
  const startAt = Math.min(DISTRACTOR_START_TRIALS, Math.max(0, plateauAt - 1));
  if (spawnedCount < startAt) return 0;
  if (spawnedCount >= plateauAt) return maxRatePerSec;
  return maxRatePerSec * (spawnedCount - startAt) / (plateauAt - startAt);
}

// Progressive-alternative counterpart to startNotifCycle above: instead of a
// fixed display/fade/gap cycle, this polls engine progress every `pollMs`
// and rolls a Poisson-style hit each tick with probability `rate *
// pollMs/1000` -- a non-homogeneous Poisson process, so "gradually increase
// in frequency" falls out of rampedDistractorRate() directly instead of a
// hand-tuned step schedule. `mountNext` takes the set of currently-occupied
// zone ids (possibly empty) and returns its new wrapper, or null if every
// zone is taken; display timing defaults to the same NOTIF_DISPLAY_MS
// lean/showcase use (overridable via `displayMs`, see progressive/index.html's
// ?displayms=), fade always uses NOTIF_FADE_MS. Returns the same
// `{ stop() }` shape as startNotifCycle.
//
// `overlap` (default false, see progressive/index.html's ?overlap=):
// when false (or omitted), only one notification shows at a time, same as
// before -- each one occupies NOTIF_DISPLAY_MS+NOTIF_FADE_MS (4.5s) of
// "busy" time where no new one can start, which is the ceiling TAT's
// feedback flagged ("I don't see how rate can increase with a 4s display
// time"). `true` allows more than one to be visible from trial 1 onward; a
// 0..1 number (see overlapAllowedNow above) delays that until the given
// fraction of trials has spawned, staging it in only near the end of a run
// per the 2026-11-10 feedback. Either way, concurrency is capped at
// MAX_CONCURRENT_NOTIFS, not the full zone count.
//
// `lastZoneId` persists across calls (not just while a wrapper is still
// active) so even in non-overlap mode, the moment after a wrapper finishes
// fading out, the next one still avoids repeating that same zone --
// tracking only "currently occupied" zones would otherwise lose that
// guarantee the instant a wrapper is removed.
//
// TAT (2026-11-10): 6 concurrent notifications (the full zone count) read as
// too much in the overlap=yes playtest -- cap concurrency on its own terms,
// independent of how many zones happen to exist.
const MAX_CONCURRENT_NOTIFS = 3;

// `overlap` (see progressive/index.html's ?overlap=): `true` allows overlap
// from trial 1 (unchanged); a number in 0..1 allows it only once that
// fraction of totalItems has spawned (TAT, 2026-11-10: tried 0.66, ~40s into
// a 50-trial run, after an overlap=yes playtest felt like too much overlap
// too soon); anything else (false, absent, out-of-range) never allows it,
// same as the original yes/no-only behavior.
function overlapAllowedNow(overlap, spawnedCount, totalItems) {
  if (overlap === true) return true;
  if (typeof overlap === 'number' && overlap > 0 && overlap <= 1) {
    return totalItems > 0 && spawnedCount >= totalItems * overlap;
  }
  return false;
}

function startProgressiveNotifCycle(mountNext, engine, { maxRatePerSec = 1.5, pollMs = 250, displayMs = NOTIF_DISPLAY_MS, overlap = false } = {}) {
  let activeWrappers = new Set();
  let lastZoneId = null;
  let timers = [];
  let pollTimer = null;
  const schedule = (fn, ms) => { timers.push(setTimeout(fn, ms)); };

  const showNext = () => {
    const exclude = new Set(Array.from(activeWrappers, (w) => w.dataset.zoneId));
    if (lastZoneId) exclude.add(lastZoneId);
    const wrapper = mountNext(exclude);
    if (!wrapper) return; // no free zone (only possible once all 6 are occupied)
    lastZoneId = wrapper.dataset.zoneId;
    activeWrappers.add(wrapper);
    schedule(() => {
      wrapper.classList.add('notif-hiding');
      schedule(() => {
        wrapper.remove();
        activeWrappers.delete(wrapper);
      }, NOTIF_FADE_MS);
    }, displayMs);
  };

  pollTimer = setInterval(() => {
    if (!overlapAllowedNow(overlap, engine.spawnedCount, engine.totalItems) && activeWrappers.size > 0) return;
    if (activeWrappers.size >= MAX_CONCURRENT_NOTIFS || engine.totalItems <= 0) return;
    const rate = rampedDistractorRate(engine.spawnedCount, engine.totalItems, maxRatePerSec);
    if (Math.random() < rate * (pollMs / 1000)) showNext();
  }, pollMs);

  return {
    stop() {
      clearInterval(pollTimer);
      timers.forEach(clearTimeout);
      timers = [];
      activeWrappers.forEach((w) => w.remove());
      activeWrappers.clear();
    },
  };
}
