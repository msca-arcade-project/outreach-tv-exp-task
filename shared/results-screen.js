// shared/results-screen.js
// Stores each finished run's stats in sessionStorage under its condition
// ('distracted' / 'undistracted') so a second run on the same device, in
// either alternative, can be compared side by side with no backend. Renders
// each condition as a correct/error pie (SVG, green/red) plus a
// mean-response-time bar whose length is directly proportional to time.

const RESULTS_KEY = 'outreach-tv-task-results';
// The pie is an SVG filled wedge (M center -> L arc-start -> A -> arc-end ->
// Z), not a CSS conic-gradient -- a conic-gradient with a hard color stop,
// clipped by border-radius:50%, is a known source of thin rasterization-seam
// artifacts at the circular clip boundary in some browsers.
//
// An earlier version of this used two overlapping stroke-dasharray circles
// with stroke-width = 2x radius (a common "fake a solid pie from a donut"
// trick) instead -- that produced a skewed, off-center boundary rather than
// a clean wedge: a dash segment's cut ends are flat cuts perpendicular to
// the path's tangent at the (small) centerline radius, not lines radiating
// from the true center, and that only reads correctly for a genuinely thin
// ring. An explicit filled path has no such hidden assumption -- its two
// straight edges are drawn from the center by construction.
const PIE_DIAMETER = 120;

// Point on the pie's circumference at `pct` percent clockwise from 12
// o'clock (matching the conic-gradient convention this replaced).
function pieEdgePoint(center, radius, pct) {
  const angleRad = (pct / 100) * 2 * Math.PI;
  return {
    x: center + radius * Math.sin(angleRad),
    y: center - radius * Math.cos(angleRad),
  };
}

function pieChartSvg(correctPct) {
  const center = PIE_DIAMETER / 2;
  const radius = center;
  const openTag = `<svg class="pie-chart" viewBox="0 0 ${PIE_DIAMETER} ${PIE_DIAMETER}" width="${PIE_DIAMETER}" height="${PIE_DIAMETER}">`;

  // A single-arc path can't represent a full 360deg sweep (its start and end
  // point coincide, which most renderers treat as empty) -- the 0%/100%
  // cases are genuinely solid single-color circles, not degenerate wedges.
  if (correctPct <= 0) {
    return `${openTag}<circle cx="${center}" cy="${center}" r="${radius}" fill="var(--accent-red)" /></svg>`;
  }
  if (correctPct >= 100) {
    return `${openTag}<circle cx="${center}" cy="${center}" r="${radius}" fill="var(--accent-green)" /></svg>`;
  }

  // Green is the full base circle; the red wedge (correctPct -> 100%) is
  // drawn on top, so only the error slice needs the arc math.
  const start = pieEdgePoint(center, radius, correctPct);
  const end = pieEdgePoint(center, radius, 100);
  const largeArcFlag = (100 - correctPct) > 50 ? 1 : 0;
  const redPath = `M ${center},${center} L ${start.x.toFixed(3)},${start.y.toFixed(3)} `
    + `A ${radius},${radius} 0 ${largeArcFlag} 1 ${end.x.toFixed(3)},${end.y.toFixed(3)} Z`;

  return `${openTag}`
    + `<circle cx="${center}" cy="${center}" r="${radius}" fill="var(--accent-green)" />`
    + `<path d="${redPath}" fill="var(--accent-red)" />`
    + `</svg>`;
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

// sessionStorage survives a page reload by design (it's only cleared when
// the tab/window closes) -- so a stale run from before a reload would
// otherwise keep pairing up with a fresh one as a "comparison" with no way
// to clear it. Wired to a button on the start screen in both index.html
// files.
function clearStoredResults() {
  sessionStorage.removeItem(RESULTS_KEY);
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
    <div class="results-scale-wrap bg-panel">
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
