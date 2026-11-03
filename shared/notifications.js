// shared/notifications.js
// Shared positioning logic for floating notifications -- both lean and
// showcase use this; their visual skin (bubble vs. ad-card) stays local to
// each, per the project's existing shared-logic/local-styling split.

const NOTIF_ZONE_IDS = [
  'top-left', 'top-right',
  'mid-left', 'mid-right',
  'bottom-left', 'bottom-right',
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

function isBottomZone(zoneId) {
  return zoneId === 'bottom-left' || zoneId === 'bottom-right';
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
