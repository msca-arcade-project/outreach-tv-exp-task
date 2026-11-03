// lean/distractor.js -- Alternative A: scrolling text-feed distractor.
// Self-authored trivia only, same spirit as the main experiment's feed.js --
// see todo.md's content constraint.

const LEAN_FEED_ITEMS = [
  'Un jour sur Vénus dure plus longtemps qu’une année vénusienne.',
  'Le miel scellé dans un pot ne se périme jamais.',
  'Les poulpes ont trois cœurs.',
  'La tour Eiffel grandit légèrement avec la chaleur de l’été.',
  'La banane est classée comme une baie ; la fraise non.',
  'Les wombats produisent des crottes en forme de cube.',
  'Un éclair est plus chaud que la surface du soleil.',
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
