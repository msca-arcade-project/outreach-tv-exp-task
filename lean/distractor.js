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

let leanIndex = 0;
let leanCycle = null;

function startLeanDistractor(soundEngine) {
  const layer = document.getElementById('distractor-layer');
  const mountNext = () => {
    const zoneId = pickNotifZone(leanCycle.lastZoneId);
    leanCycle.lastZoneId = zoneId;
    const bubble = document.createElement('div');
    bubble.className = 'notif notif--bubble';
    bubble.textContent = LEAN_FEED_ITEMS[leanIndex % LEAN_FEED_ITEMS.length];
    const wrapper = mountNotif(layer, zoneId, bubble);
    flashNotif(bubble);
    if (soundEngine) soundEngine.playSmsPopSound();
    leanIndex += 1;
    return wrapper;
  };
  leanCycle = { lastZoneId: null, controller: null };
  leanCycle.controller = startNotifCycle(mountNext);
}

function stopLeanDistractor() {
  if (leanCycle) leanCycle.controller.stop();
  leanCycle = null;
}
