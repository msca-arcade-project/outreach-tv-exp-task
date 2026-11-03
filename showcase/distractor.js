// showcase/distractor.js -- Alternative B: a flashier distractor built from
// procedurally generated colour/motion and Unicode emoji rather than sourced
// photo or video clips, so it carries no copyright/licensing exposure out of
// the box (see todo.md's content constraint). If the TV editors want real
// photo/video content after seeing the demo, that needs separate, explicit
// licensing sign-off before being swapped in here.

// Colours are each blended 20% toward white (newChannel = old*0.8 + 255*0.2)
// from the original saturated set -- a "20% more pastel" request, concretely.
const SHOWCASE_CARDS = [
  { emoji: '\u{1F514}', headline: 'Nouvelle notification', colour: '#ff7e7e' },
  { emoji: '❤️', headline: '128 personnes ont aimé', colour: '#7c99e6' },
  { emoji: '\u{1F525}', headline: 'Tendance du moment', colour: '#ffb733' },
  { emoji: '\u{1F4AC}', headline: '3 nouveaux messages', colour: '#58d68d' },
  { emoji: '✨', headline: 'Rien que pour vous', colour: '#af7ac5' },
];

const FLICKER_MAGNITUDE_PX = 6;   // displacement along the random axis, each direction
const FLICKER_PERIOD_S = 0.15;    // time per snap between the two positions

// Flicker, concretely: pick one random angle in [0, 180) degrees as a
// direction vector, then render the item at +displacement and at
// -displacement about its natural position along that axis -- two frames,
// no interpolation between them. The CSS side (.flicker / flicker-item in
// style.css) alternates between exactly those two positions each frame, at
// the rate set here via --flicker-period.
function applyFlicker(el) {
  const angleRad = (Math.random() * 180 * Math.PI) / 180;
  const dx = FLICKER_MAGNITUDE_PX * Math.cos(angleRad);
  const dy = FLICKER_MAGNITUDE_PX * Math.sin(angleRad);
  el.style.setProperty('--flicker-x', `${dx.toFixed(2)}px`);
  el.style.setProperty('--flicker-y', `${dy.toFixed(2)}px`);
  el.style.setProperty('--flicker-period', `${FLICKER_PERIOD_S}s`);
  el.classList.add('flicker');
}

let showcaseTimer = null;
let showcaseIndex = 0;
let showcaseLastWrapper = null;
let showcaseLastZoneId = null;

// Shape follows position, per the TV feedback: oblong at the bottom, square
// at any of the four non-bottom zones (treated as "beside the stream").
function startShowcaseDistractor(soundEngine) {
  const layer = document.getElementById('distractor-layer');
  const render = () => {
    if (showcaseLastWrapper) showcaseLastWrapper.remove();
    showcaseLastZoneId = pickNotifZone(showcaseLastZoneId);
    const shapeClass = isBottomZone(showcaseLastZoneId) ? 'notif--ad-oblong' : 'notif--ad-square';
    const card = SHOWCASE_CARDS[showcaseIndex % SHOWCASE_CARDS.length];

    const cardEl = document.createElement('div');
    cardEl.className = `notif showcase-card ${shapeClass}`;
    cardEl.style.background = card.colour;
    cardEl.innerHTML = `
      <div class="showcase-emoji">${card.emoji}</div>
      <div class="showcase-headline">${card.headline}</div>
    `;
    showcaseLastWrapper = mountNotif(layer, showcaseLastZoneId, cardEl);

    // Each movable item gets its own independently random axis -- the emoji
    // and the headline flicker on different diagonals, not in lockstep.
    applyFlicker(cardEl.querySelector('.showcase-emoji'));
    applyFlicker(cardEl.querySelector('.showcase-headline'));
    if (soundEngine) soundEngine.playAdDing();
    showcaseIndex += 1;
  };
  render();
  showcaseTimer = setInterval(render, 2500);
}

function stopShowcaseDistractor() {
  if (showcaseTimer) clearInterval(showcaseTimer);
  showcaseTimer = null;
  if (showcaseLastWrapper) showcaseLastWrapper.remove();
  showcaseLastWrapper = null;
  showcaseLastZoneId = null;
}
