// shared/sketch-core.js
// The one p5 sketch both alternatives share: renders the scrolling
// vowel/consonant stream and wires arrow-key responses to a TaskEngine. Each
// alternative supplies only its own distractor-layer content
// (startDistractor/stopDistractor); this file never touches that layer.

function startStreamTask({
  canvasHolderId,
  condition, // 'distracted' | 'undistracted'
  progressReadout,
  onFinish,
  startDistractor,
  stopDistractor,
  engineOptions = {},
  onEngineReady, // optional: (engine) => void, called once the engine exists -- used by autoplay to attach its auto-responder
  soundEngine, // optional: shared/audio.js's SoundEngine -- correct/incorrect chimes and gameplay ambience
}) {
  let engine;
  let holder;
  let bgColor, accentBlue, accentRed;

  const sketch = (p) => {
    p.setup = () => {
      holder = document.getElementById(canvasHolderId);
      const canvas = p.createCanvas(holder.clientWidth, holder.clientHeight);
      canvas.parent(canvasHolderId);
      engine = new TaskEngine({
        ...engineOptions,
        canvasHeight: holder.clientHeight,
        onScored: (item) => {
          if (!soundEngine) return;
          if (item.outcome === 'correct') soundEngine.playCorrectChime();
          else soundEngine.playIncorrectChime();
        },
      });
      if (condition === 'distracted' && startDistractor) startDistractor();
      if (onEngineReady) onEngineReady(engine);
      if (soundEngine) soundEngine.startAmbient();

      // Read the canvas fill and the scored-item feedback colors from the
      // CSS vars, once, rather than hardcoding a second copy here -- this is
      // the single source of truth both the page chrome and the canvas draw
      // off of (the previous hardcoded p.background(128) was a separate grey
      // from the CSS --bg and the two had drifted apart).
      const rootStyle = getComputedStyle(document.documentElement);
      bgColor = rootStyle.getPropertyValue('--bg').trim();
      accentBlue = rootStyle.getPropertyValue('--accent-blue').trim();
      accentRed = rootStyle.getPropertyValue('--accent-red').trim();
    };

    p.windowResized = () => {
      p.resizeCanvas(holder.clientWidth, holder.clientHeight);
      engine.canvasHeight = holder.clientHeight;
    };

    p.draw = () => {
      p.background(bgColor);
      engine.update(p.deltaTime);
      progressReadout.update(engine);

      const [zoneTop, zoneBottom] = engine.responseZone;
      p.stroke(255, 255, 255, 120);
      p.strokeWeight(1);
      p.line(0, zoneTop, p.width, zoneTop);
      p.line(0, zoneBottom, p.width, zoneBottom);

      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(48);
      p.noStroke();
      for (const item of engine.items) {
        if (item.scored) {
          // Recolor instead of vanishing, so the participant sees the
          // judgement, not just the item disappearing -- it keeps scrolling
          // off in this color rather than being removed from the list
          // (task-engine.js already keeps scored items until they scroll
          // past the top; this just stops skipping their draw call).
          // 'incorrect' and 'missed' both read as an error, matching the
          // results screen's correct/error grouping.
          p.fill(item.outcome === 'correct' ? accentBlue : accentRed);
          p.text(item.char, p.width / 2, item.y);
          continue;
        }
        const inZone = item.y >= zoneTop && item.y <= zoneBottom;
        const shade = inZone ? 255 : 220;
        p.fill(shade, shade, shade);
        p.text(item.char, p.width / 2, item.y);
      }

      if (engine.finished) {
        if (stopDistractor) stopDistractor();
        if (soundEngine) soundEngine.stopAmbient();
        p.noLoop();
        onFinish(engine);
      }
    };
  };

  new p5(sketch);

  document.addEventListener('keydown', (e) => {
    if (!engine || engine.finished) return;
    if (e.key === 'ArrowRight') engine.respond(true); // target = vowel
    else if (e.key === 'ArrowLeft') engine.respond(false); // non-target = consonant
  });
}
