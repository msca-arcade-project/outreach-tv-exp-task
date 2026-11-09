// shared/task-engine.js
// Pure task logic: item generation, scrolling via elapsed time, and scoring.
// No DOM and no p5 reference here -- the sketch reads this engine's state
// each frame and renders it; this file doesn't touch the page itself.

const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N',
                     'P', 'R', 'S', 'T', 'V', 'W'];

class TaskItem {
  constructor(id, isTarget, spawnY) {
    this.id = id;
    this.isTarget = isTarget;
    this.char = isTarget
      ? VOWELS[Math.floor(Math.random() * VOWELS.length)]
      : CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)];
    this.y = spawnY;
    this.enteredZoneAt = null;
    this.scored = false;
    this.outcome = null; // 'correct' | 'incorrect' | 'missed'
    this.rtMs = null;
  }
}

class TaskEngine {
  constructor({
    scrollSpeedPxPerSec = 120,
    itemSpacingPx = 140,
    totalItems = 40,
    targetProbability = 0.3,
    canvasHeight = 600,
    responseZoneCenterFrac = 0.5,
    responseZoneHeightPx = 90,
    onScored = () => {}, // (item) => void, called exactly once per item once it's scored, whichever path scores it
  } = {}) {
    this.scrollSpeedPxPerSec = scrollSpeedPxPerSec;
    this.itemSpacingPx = itemSpacingPx;
    this.totalItems = totalItems;
    this.targetProbability = targetProbability;
    this.canvasHeight = canvasHeight;
    this.responseZoneCenterFrac = responseZoneCenterFrac;
    this.responseZoneHeightPx = responseZoneHeightPx;
    this.onScored = onScored;
    this.itemIntervalMs = (this.itemSpacingPx / this.scrollSpeedPxPerSec) * 1000;

    this.items = [];
    this.spawnedCount = 0;
    this.finished = false;
    this._msSinceSpawn = 0;

    this.correctCount = 0;
    this.incorrectCount = 0;
    this.missedCount = 0;
    this.rts = [];
    // `this.items` drops an item once it scrolls past the top edge, so by
    // the time a run finishes the earliest trials are already gone from
    // that array -- this is the persistent record the progressive
    // alternative's end-screen error/time chart reads instead.
    this.scoredHistory = [];

    this._spawnNext();
  }

  get responseZone() {
    const centerY = this.canvasHeight * this.responseZoneCenterFrac;
    return [centerY - this.responseZoneHeightPx / 2, centerY + this.responseZoneHeightPx / 2];
  }

  get completedCount() {
    return this.correctCount + this.incorrectCount + this.missedCount;
  }

  get errorRate() {
    const n = this.completedCount;
    return n === 0 ? 0 : (this.incorrectCount + this.missedCount) / n;
  }

  get meanRtMs() {
    if (this.rts.length === 0) return null;
    return this.rts.reduce((a, b) => a + b, 0) / this.rts.length;
  }

  _spawnNext() {
    if (this.spawnedCount >= this.totalItems) return;
    const isTarget = Math.random() < this.targetProbability;
    const item = new TaskItem(this.spawnedCount, isTarget, this.canvasHeight + 40);
    this.items.push(item);
    this.spawnedCount += 1;
    this._msSinceSpawn = 0;
  }

  update(dtMs) {
    if (this.finished) return;
    const dy = this.scrollSpeedPxPerSec * (dtMs / 1000);
    const [zoneTop, zoneBottom] = this.responseZone;
    const now = performance.now();

    for (const item of this.items) {
      item.y -= dy;
      if (!item.scored) {
        const inZone = item.y >= zoneTop && item.y <= zoneBottom;
        if (inZone && item.enteredZoneAt === null) item.enteredZoneAt = now;
        if (item.y < zoneTop && item.enteredZoneAt !== null) {
          // left the response zone with no key press -- always an error,
          // since the task calls for a response to every item
          item.scored = true;
          item.outcome = 'missed';
          this.missedCount += 1;
          this.scoredHistory.push({ id: item.id, outcome: item.outcome });
          this.onScored(item);
        }
      }
    }

    this.items = this.items.filter((it) => it.y > -60);

    this._msSinceSpawn += dtMs;
    if (this.spawnedCount < this.totalItems && this._msSinceSpawn >= this.itemIntervalMs) {
      this._spawnNext();
    }

    if (this.spawnedCount >= this.totalItems && this.completedCount >= this.spawnedCount) {
      this.finished = true;
    }
  }

  respond(isTargetKeyPressed) {
    const [zoneTop, zoneBottom] = this.responseZone;
    const active = this.items.find(
      (it) => !it.scored && it.y >= zoneTop && it.y <= zoneBottom
    );
    if (!active) return;
    const correct = isTargetKeyPressed === active.isTarget;
    active.scored = true;
    active.outcome = correct ? 'correct' : 'incorrect';
    if (active.enteredZoneAt !== null) {
      active.rtMs = performance.now() - active.enteredZoneAt;
      this.rts.push(active.rtMs);
    }
    if (correct) this.correctCount += 1;
    else this.incorrectCount += 1;
    this.scoredHistory.push({ id: active.id, outcome: active.outcome });
    this.onScored(active);
  }
}
