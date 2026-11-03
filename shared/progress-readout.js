// shared/progress-readout.js
// Text + bar progress readout, fed by a TaskEngine each frame. Mirrors the
// main experiment's progress-panel convention: a number to look at, not a
// bar read peripherally.

class ProgressReadout {
  constructor({ labelEl, valueEl, barFillEl }) {
    this.labelEl = labelEl;
    this.valueEl = valueEl;
    this.barFillEl = barFillEl;
    this.labelEl.textContent = STRINGS.progressLabel;
  }

  update(engine) {
    this.valueEl.textContent = `${engine.correctCount} / ${engine.totalItems}`;
    const frac = engine.totalItems > 0
      ? Math.min(1, engine.correctCount / engine.totalItems)
      : 0;
    this.barFillEl.style.width = `${(frac * 100).toFixed(1)}%`;
  }
}
