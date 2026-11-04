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
];

let showcaseIndex = 0;
let showcaseCycle = null;

// Shape follows position, per the TV feedback: oblong at the bottom, square
// at any of the four non-bottom zones (treated as "beside the stream"). The
// source images are wide banners (roughly 3:1), so the oblong slot shows
// the whole image (object-fit: contain, see showcase/style.css) and the
// square slot crops to its central portion (object-fit: cover) rather than
// squashing the banner to fit -- a reasonable default, not guaranteed to
// frame every image equally well.
function startShowcaseDistractor(soundEngine) {
  const layer = document.getElementById('distractor-layer');
  const mountNext = () => {
    const zoneId = pickNotifZone(showcaseCycle.lastZoneId);
    showcaseCycle.lastZoneId = zoneId;
    const shapeClass = isBottomZone(zoneId) ? 'notif--ad-oblong' : 'notif--ad-square';
    const card = SHOWCASE_CARDS[showcaseIndex % SHOWCASE_CARDS.length];

    const imgEl = document.createElement('img');
    imgEl.className = `notif showcase-card ${shapeClass}`;
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
