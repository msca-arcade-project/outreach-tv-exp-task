// showcase/distractor.js -- Alternative B: a flashier distractor built from
// procedurally generated colour/motion and Unicode emoji rather than sourced
// photo or video clips, so it carries no copyright/licensing exposure out of
// the box (see todo.md's content constraint). If the TV editors want real
// photo/video content after seeing the demo, that needs separate, explicit
// licensing sign-off before being swapped in here.

const SHOWCASE_CARDS = [
  { emoji: '\u{1F514}', headline: 'New notification', colour: '#ff5e5e' },
  { emoji: '❤️', headline: '128 people liked this', colour: '#5b7fe0' },
  { emoji: '\u{1F525}', headline: 'Trending now', colour: '#ffa500' },
  { emoji: '\u{1F4AC}', headline: '3 new messages', colour: '#2ecc71' },
  { emoji: '✨', headline: 'Just for you', colour: '#9b59b6' },
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

function startShowcaseDistractor() {
  const panel = document.getElementById('distractor-panel');
  panel.classList.add('showcase');
  const render = () => {
    const card = SHOWCASE_CARDS[showcaseIndex % SHOWCASE_CARDS.length];
    panel.innerHTML = `
      <div class="showcase-track">
        <div class="showcase-card" style="background:${card.colour}">
          <div class="showcase-emoji">${card.emoji}</div>
          <div class="showcase-headline">${card.headline}</div>
        </div>
      </div>
    `;
    // Each movable item gets its own independently random axis -- the emoji
    // and the headline flicker on different diagonals, not in lockstep.
    applyFlicker(panel.querySelector('.showcase-emoji'));
    applyFlicker(panel.querySelector('.showcase-headline'));
    showcaseIndex += 1;
  };
  render();
  showcaseTimer = setInterval(render, 2500);
}

function stopShowcaseDistractor() {
  if (showcaseTimer) clearInterval(showcaseTimer);
  showcaseTimer = null;
  const panel = document.getElementById('distractor-panel');
  panel.classList.remove('showcase');
}
