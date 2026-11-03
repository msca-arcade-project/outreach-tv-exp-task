// lean/distractor.js -- Alternative A: a "text message" style notification
// bubble that appears in a different screen-edge zone each time (shared
// positioning logic in shared/notifications.js), rather than one persistent
// bar. Self-authored trivia only, same spirit as the main experiment's
// feed.js -- see todo.md's content constraint.

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
let leanLastWrapper = null;
let leanLastZoneId = null;

function startLeanDistractor(soundEngine) {
  const layer = document.getElementById('distractor-layer');
  let i = 0;
  const show = () => {
    if (leanLastWrapper) leanLastWrapper.remove();
    leanLastZoneId = pickNotifZone(leanLastZoneId);
    const bubble = document.createElement('div');
    bubble.className = 'notif notif--bubble';
    bubble.textContent = LEAN_FEED_ITEMS[i % LEAN_FEED_ITEMS.length];
    leanLastWrapper = mountNotif(layer, leanLastZoneId, bubble);
    flashNotif(bubble);
    if (soundEngine) soundEngine.playSmsPopSound();
    i += 1;
  };
  show();
  leanFeedTimer = setInterval(show, 4000);
}

function stopLeanDistractor() {
  if (leanFeedTimer) clearInterval(leanFeedTimer);
  leanFeedTimer = null;
  if (leanLastWrapper) leanLastWrapper.remove();
  leanLastWrapper = null;
  leanLastZoneId = null;
}
