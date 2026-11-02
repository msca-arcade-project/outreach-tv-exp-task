// lean/distractor.js -- Alternative A: scrolling text-feed distractor.
// Self-authored trivia only, same spirit as the main experiment's feed.js --
// see todo.md's content constraint.

const LEAN_FEED_ITEMS = [
  'A day on Venus is longer than its year.',
  'Honey sealed in a jar does not spoil.',
  'Octopuses have three hearts.',
  'The Eiffel Tower grows a little taller in summer heat.',
  'Bananas are classified as berries; strawberries are not.',
  'Wombats produce cube-shaped droppings.',
  'A bolt of lightning is hotter than the surface of the sun.',
];

let leanFeedTimer = null;

// Arrival cue matching the main experiment's DistractorPanel.flash(): the
// panel background inverts to black for an instant, then eases back --
// rather than toggling visibility, a double rAF lets the browser paint the
// instant "flashing" state before the CSS transition eases it away.
function flashDistractorPanel(panel) {
  panel.classList.add('flashing');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      panel.classList.remove('flashing');
    });
  });
}

function startLeanDistractor() {
  const panel = document.getElementById('distractor-panel');
  panel.textContent = '';
  let i = 0;
  const show = () => {
    panel.textContent = LEAN_FEED_ITEMS[i % LEAN_FEED_ITEMS.length];
    flashDistractorPanel(panel);
    i += 1;
  };
  show();
  leanFeedTimer = setInterval(show, 4000);
}

function stopLeanDistractor() {
  if (leanFeedTimer) clearInterval(leanFeedTimer);
  leanFeedTimer = null;
}
