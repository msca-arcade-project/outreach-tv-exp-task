// showcase/distractor.js -- Alternative B: real notification graphics
// supplied by the TV show's own graphics team (assets/notifications/),
// commissioned specifically for this use -- a different situation from the
// no-scraped/no-licensed-media rule in todo.md, which exists to guard
// against unauthorized exposure, not against assets the broadcaster's own
// team hands over for this exact purpose.

const SHOWCASE_CARDS = [
  { src: 'assets/notifications/instagram.png', alt: 'Instagram -- 138 personnes ont aimé' },
  { src: 'assets/notifications/messages-maman.png', alt: 'Messages -- Maman' },
  { src: 'assets/notifications/mail.png', alt: 'Mail -- réservation au restaurant' },
  { src: 'assets/notifications/psg-om.png', alt: 'PSG-OM -- but à la 38e minute' },
  { src: 'assets/notifications/messages-babysitter.png', alt: 'Messages -- Babysitter' },
  { src: 'assets/notifications/podcasts.png', alt: 'Podcasts -- nouvel épisode du JT' },
  { src: 'assets/notifications/banque.png', alt: 'Banque -- dernière vérification' },
  { src: 'assets/notifications/calendrier.png', alt: 'Agenda -- rappel vétérinaire' },
];

let showcaseIndex = 0;
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
  const mountNext = () => {
    const zoneId = pickNotifZone(showcaseCycle.lastZoneId);
    showcaseCycle.lastZoneId = zoneId;
    const card = SHOWCASE_CARDS[showcaseIndex % SHOWCASE_CARDS.length];

    const imgEl = document.createElement('img');
    imgEl.className = 'notif showcase-card notif--ad';
    imgEl.src = card.src;
    imgEl.alt = card.alt;

    if (soundEngine) soundEngine.playAdDing();
    showcaseIndex += 1;
    return mountNotif(layer, zoneId, imgEl);
  };
  showcaseCycle = { lastZoneId: null, controller: null };
  showcaseCycle.controller = startNotifCycle(mountNext);
}

function stopShowcaseDistractor() {
  if (showcaseCycle) showcaseCycle.controller.stop();
  showcaseCycle = null;
}
