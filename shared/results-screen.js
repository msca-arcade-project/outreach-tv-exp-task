// shared/results-screen.js
// Stores each finished run's stats in sessionStorage under its condition
// ('distracted' / 'undistracted') so a second run on the same device, in
// either alternative, can be compared side by side with no backend. Renders
// each condition as a correct/error pie (SVG, green/red) plus a
// mean-response-time bar whose length is directly proportional to time.

const RESULTS_KEY = 'outreach-tv-task-results';
// The pie is two overlapping solid-stroke SVG circles (stroke-width equal to
// the radius, so each stroke fills all the way to the center), not a CSS
// conic-gradient -- a conic-gradient with a hard color stop, clipped by
// border-radius:50%, is a known source of thin rasterization-seam artifacts
// at the circular clip boundary in some browsers. Two plain circle strokes
// have no gradient to rasterize and no seam to get wrong.
const PIE_DIAMETER = 120;
const PIE_RADIUS = PIE_DIAMETER / 4; // stroke-width below is 2x this, reaching the center
const PIE_CIRCUMFERENCE = 2 * Math.PI * PIE_RADIUS;

function pieChartSvg(correctPct) {
  const greenLen = PIE_CIRCUMFERENCE * (correctPct / 100);
  const redLen = PIE_CIRCUMFERENCE - greenLen;
  const center = PIE_DIAMETER / 2;
  // The colored fill (stroke-width 2x radius) reaches exactly to the edge of
  // this viewBox and no further. The neutral ring is a plain CSS border on
  // this <svg> element (see .pie-chart in shared/style.css), which -- under
  // the default content-box sizing -- sits entirely OUTSIDE this box, not
  // overlapping the fill. An SVG circle drawn at the edge for the border
  // instead would overlap the colored strokes and reintroduce the same
  // translucent-border-blends-with-the-fill bleed this replaced.
  return `
    <svg class="pie-chart" viewBox="0 0 ${PIE_DIAMETER} ${PIE_DIAMETER}" width="${PIE_DIAMETER}" height="${PIE_DIAMETER}">
      <circle cx="${center}" cy="${center}" r="${PIE_RADIUS}" fill="none"
        stroke="var(--accent-green)" stroke-width="${PIE_RADIUS * 2}" />
      <circle cx="${center}" cy="${center}" r="${PIE_RADIUS}" fill="none"
        stroke="var(--accent-red)" stroke-width="${PIE_RADIUS * 2}"
        stroke-dasharray="${redLen.toFixed(3)} ${greenLen.toFixed(3)}"
        stroke-dashoffset="${(-greenLen).toFixed(3)}"
        transform="rotate(-90 ${center} ${center})" />
    </svg>
  `;
}
const RT_PX_PER_SECOND = 200; // bar-length scale: 1000ms of mean RT = 200px
// Reserved width for each side label (ms value, "1s"), equal on both sides so
// the track still lands in the middle of the wrap. Part of the wrap's own
// flex layout (not absolutely positioned) so the wrap's width is its true
// rendered footprint -- that's what made the previous version overlap the
// next column: the labels poked out past the box the column-gap was sized
// against. Sized for the 20px bold ms-value label (TV-legibility pass) --
// 54px was fine for the old 13px label but would clip "900 ms" at this size.
const RT_LABEL_SLOT_PX = 70;

function saveRunResult(condition, engine) {
  const stored = JSON.parse(sessionStorage.getItem(RESULTS_KEY) || '{}');
  stored[condition] = {
    correctCount: engine.correctCount,
    incorrectCount: engine.incorrectCount,
    missedCount: engine.missedCount,
    totalItems: engine.totalItems,
    errorRate: engine.errorRate,
    meanRtMs: engine.meanRtMs,
    recordedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(RESULTS_KEY, JSON.stringify(stored));
  return stored;
}

function otherCondition(condition) {
  return condition === 'distracted' ? 'undistracted' : 'distracted';
}

function resultsColumnHtml(condition, stats) {
  const correctPct = stats.totalItems > 0
    ? (stats.correctCount / stats.totalItems) * 100
    : 0;
  const errorCount = stats.incorrectCount + stats.missedCount;
  // The track is exactly 1 second wide (RT_PX_PER_SECOND); the fill is
  // clamped to that so the "1s" box stays a true reference frame even if a
  // mean RT somehow exceeded it.
  const fillPx = stats.meanRtMs
    ? Math.min(RT_PX_PER_SECOND, Math.round((stats.meanRtMs / 1000) * RT_PX_PER_SECOND))
    : 0;
  const rtLabel = stats.meanRtMs === null || stats.meanRtMs === undefined
    ? '–'
    : `${Math.round(stats.meanRtMs)} ms`;

  const conditionLabel = STRINGS.conditionLabel[condition] ?? condition;

  return `
    <div class="results-column">
      <h2>${conditionLabel}</h2>
      <div class="pie-row">
        ${pieChartSvg(correctPct)}
        <div class="pie-legend">
          <span><i class="swatch correct"></i><strong class="stat-num">${stats.correctCount} / ${stats.totalItems}</strong> ${STRINGS.pieCorrectLabel}</span>
          <span><i class="swatch error"></i><strong class="stat-num">${errorCount} / ${stats.totalItems}</strong> ${STRINGS.pieErrorLabel}</span>
        </div>
      </div>
      <div class="rt-block">
        <h3 class="rt-heading">${STRINGS.rtHeading}</h3>
        <div class="rt-bar-wrap" style="width: ${RT_LABEL_SLOT_PX * 2 + RT_PX_PER_SECOND}px;">
          <span class="rt-label" style="width: ${RT_LABEL_SLOT_PX}px;">${rtLabel}</span>
          <div class="rt-bar-track" style="width: ${RT_PX_PER_SECOND}px;">
            <div class="rt-bar-fill" style="width: ${fillPx}px;"></div>
          </div>
          <span class="rt-scale-label" style="width: ${RT_LABEL_SLOT_PX}px;">1s</span>
        </div>
      </div>
    </div>
  `;
}

function renderResultsScreen(containerEl, condition, engine) {
  const results = saveRunResult(condition, engine);
  const mine = results[condition];
  const other = results[otherCondition(condition)];

  const columns = [resultsColumnHtml(condition, mine)];
  if (other) columns.push(resultsColumnHtml(otherCondition(condition), other));

  containerEl.innerHTML = `
    <div class="results-scale-wrap">
      <h1>${STRINGS.resultsHeadingGeneric}</h1>
      <div class="results-columns">${columns.join('')}</div>
      <button id="restart-btn">${STRINGS.restartButton}</button>
    </div>
  `;
  containerEl.classList.add('visible');
  document.getElementById('restart-btn').addEventListener('click', () => {
    window.location.reload();
  });
}
