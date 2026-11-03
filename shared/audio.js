// shared/audio.js
// Synthesized sound only -- no sampled/licensed audio, per todo.md's content
// constraint. One lazily-created AudioContext, created inside a user-gesture
// handler (the start-button click calls unlock()) to satisfy browser
// autoplay policy.

class SoundEngine {
  constructor() {
    this._ctx = null;
  }

  _ensureContext() {
    if (!this._ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this._ctx = new AudioContextClass();
    }
    if (this._ctx.state === 'suspended') this._ctx.resume().catch(() => {});
    return this._ctx;
  }

  // Call from inside a user-gesture handler before any other method.
  unlock() {
    this._ensureContext();
  }

  _tone(freq, startOffset, duration, type, peakGain) {
    const ctx = this._ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t0 = ctx.currentTime + startOffset;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  // Rising two-note blip -- "classical game sound" correct cue.
  playCorrectChime() {
    this._tone(660, 0, 0.09, 'square', 0.12);
    this._tone(880, 0.09, 0.12, 'square', 0.12);
  }

  // Short, lower, slightly buzzy tone -- incorrect cue.
  playIncorrectChime() {
    this._tone(180, 0, 0.18, 'sawtooth', 0.12);
  }

  // Two quick high blips -- the generic "new text message" pop, played each
  // time lean's bubble notification appears.
  playSmsPopSound() {
    this._tone(1100, 0, 0.05, 'sine', 0.1);
    this._tone(1500, 0.05, 0.07, 'sine', 0.1);
  }

  // Single bell-like tone -- the "ding" played each time showcase's ad-card
  // notification appears.
  playAdDing() {
    this._tone(1046.5, 0, 0.35, 'triangle', 0.1);
  }
}
