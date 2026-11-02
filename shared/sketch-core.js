// shared/sketch-core.js
// The one p5 sketch both alternatives share: renders the scrolling
// vowel/consonant stream and wires arrow-key responses to a TaskEngine. Each
// alternative supplies only its own distractor-panel content
// (startDistractor/stopDistractor); this file never touches that panel.

function startStreamTask({
  canvasHolderId,
  condition, // 'distracted' | 'undistracted'
  progressReadout,
  onFinish,
  startDistractor,
  stopDistractor,
  engineOptions = {},
}) {
  let engine;
  let holder;

  const sketch = (p) => {
    p.setup = () => {
      holder = document.getElementById(canvasHolderId);
      const canvas = p.createCanvas(holder.clientWidth, holder.clientHeight);
      canvas.parent(canvasHolderId);
      engine = new TaskEngine({ ...engineOptions, canvasHeight: holder.clientHeight });
      if (condition === 'distracted' && startDistractor) startDistractor();
    };

    p.windowResized = () => {
      p.resizeCanvas(holder.clientWidth, holder.clientHeight);
      engine.canvasHeight = holder.clientHeight;
    };

    p.draw = () => {
      p.background(128);
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
        if (item.scored) continue; // scored items vanish immediately -- simple and legible
        const inZone = item.y >= zoneTop && item.y <= zoneBottom;
        const shade = inZone ? 255 : 220;
        p.fill(shade, shade, shade);
        p.text(item.char, p.width / 2, item.y);
      }

      if (engine.finished) {
        if (stopDistractor) stopDistractor();
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
