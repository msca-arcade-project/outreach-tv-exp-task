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

// `diameter` defaults to PIE_DIAMETER (the two-column lean/showcase
// comparison view's size); the progressive alternative's single-run screen
// passes its own smaller value instead (see renderProgressiveResultsScreen)
// -- set inline via `style`, not just the SVG width/height attributes,
// since the .pie-chart CSS class otherwise wins that sizing fight.
function pieChartSvg(correctPct, diameter = PIE_DIAMETER) {
  const center = diameter / 2;
  const radius = center;
  const openTag = `<svg class="pie-chart" viewBox="0 0 ${diameter} ${diameter}" width="${diameter}" height="${diameter}" style="width: ${diameter}px; height: ${diameter}px;">`;

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

// Pie + legend markup on its own, so a caller can show the RT block without
// it (see renderProgressiveResultsScreen's showPieChart, which only gates
// this piece -- RT stays independent of that setting).
function pieRowHtml(stats, pieDiameter = PIE_DIAMETER) {
  const correctPct = stats.totalItems > 0
    ? (stats.correctCount / stats.totalItems) * 100
    : 0;
  const errorCount = stats.incorrectCount + stats.missedCount;

  return `
    <div class="pie-row">
      ${pieChartSvg(correctPct, pieDiameter)}
      <div class="pie-legend">
        <span><i class="swatch correct"></i><strong class="stat-num">${stats.correctCount} / ${stats.totalItems}</strong> ${STRINGS.pieCorrectLabel}</span>
        <span><i class="swatch error"></i><strong class="stat-num">${errorCount} / ${stats.totalItems}</strong> ${STRINGS.pieErrorLabel}</span>
      </div>
    </div>
  `;
}

function rtBlockHtml(stats) {
  // The track is exactly 1 second wide (RT_PX_PER_SECOND); the fill is
  // clamped to that so the "1s" box stays a true reference frame even if a
  // mean RT somehow exceeded it.
  const fillPx = stats.meanRtMs
    ? Math.min(RT_PX_PER_SECOND, Math.round((stats.meanRtMs / 1000) * RT_PX_PER_SECOND))
    : 0;
  const rtLabel = stats.meanRtMs === null || stats.meanRtMs === undefined
    ? '–'
    : `${Math.round(stats.meanRtMs)} ms`;

  return `
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
  `;
}

// The pie-row + RT-block combo, shared by the two-column comparison view
// (resultsColumnHtml, wraps this in its own <h2> condition heading) --
// there both always show together, unlike progressive's single-run view.
function pieAndRtBlockHtml(stats, pieDiameter = PIE_DIAMETER) {
  return pieRowHtml(stats, pieDiameter) + rtBlockHtml(stats);
}

function resultsColumnHtml(condition, stats) {
  const conditionLabel = STRINGS.conditionLabel[condition] ?? condition;
  return `
    <div class="results-column">
      <h2>${conditionLabel}</h2>
      ${pieAndRtBlockHtml(stats)}
    </div>
  `;
}

// 10 bins keyed to spawn-order fraction (not wall-clock seconds), so the
// chart generalizes to any ?trials=N the same way the progressive
// alternative's distraction-rate ramp does (shared/notifications.js's
// rampedDistractorRate). scoredHistory entries are { id, outcome }, as
// pushed by TaskEngine; id is the 0-based spawn index.
const ERROR_TIME_BIN_COUNT = 10;
// Sizing history on this screen: 480x160/24 (original) -> x5/3 -> x0.5 here.
// Paired with the pie's own x1/3 then x1.1 below, same screen.
const ERROR_CHART_WIDTH = 400;
const ERROR_CHART_HEIGHT = 134;
const ERROR_CHART_AXIS_H = 20; // reserved strip at the bottom for bin labels
const ERROR_CHART_POINT_RADIUS = 4;

// The progressive results screen's own pie size -- PIE_DIAMETER (the
// lean/showcase two-column comparison view's size, unaffected) x1/3, then
// x1.1, paired with the bar chart's own resizing above on that same screen.
const PROGRESSIVE_PIE_DIAMETER = Math.round(PIE_DIAMETER / 3 * 1.1);

function binErrorHistory(scoredHistory, totalItems) {
  const bins = Array.from({ length: ERROR_TIME_BIN_COUNT }, () => ({ errors: 0, items: 0 }));
  if (totalItems <= 0) return bins;
  const itemsPerBin = totalItems / ERROR_TIME_BIN_COUNT;
  for (const entry of scoredHistory) {
    const binIndex = Math.min(
      ERROR_TIME_BIN_COUNT - 1,
      Math.floor(entry.id / totalItems * ERROR_TIME_BIN_COUNT)
    );
    bins[binIndex].items += 1;
    if (entry.outcome !== 'correct') bins[binIndex].errors += 1;
  }
  // Theoretical bin size (not the observed count) is the chart's fixed
  // y-reference -- same "stable frame regardless of the actual numbers"
  // approach the RT bar above already uses (a fixed 1-second track).
  bins.forEach((b) => { b.capacity = itemsPerBin; });
  return bins;
}

function errorTimeChartSvg(scoredHistory, totalItems, plotType) {
  const bins = binErrorHistory(scoredHistory, totalItems);
  const plotH = ERROR_CHART_HEIGHT - ERROR_CHART_AXIS_H;
  const binW = ERROR_CHART_WIDTH / ERROR_TIME_BIN_COUNT;
  const maxCapacity = Math.max(1, ...bins.map((b) => b.capacity));

  const marks = bins.map((b, i) => {
    const h = Math.min(plotH, (b.errors / maxCapacity) * plotH);
    const cx = i * binW + binW / 2;
    if (plotType === 'point') {
      const cy = plotH - h;
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${ERROR_CHART_POINT_RADIUS}" fill="var(--accent-red)" />`;
    }
    const barW = binW * 0.6;
    const x = cx - barW / 2;
    const y = plotH - h;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="var(--accent-red)" />`;
  }).join('');

  const labels = bins.map((_, i) => {
    const cx = i * binW + binW / 2;
    const pct = i * (100 / ERROR_TIME_BIN_COUNT);
    return `<text x="${cx.toFixed(1)}" y="${plotH + 14}" class="error-chart-axis-label" text-anchor="middle">${pct}%</text>`;
  }).join('');

  return `
    <svg class="error-time-chart" viewBox="0 0 ${ERROR_CHART_WIDTH} ${ERROR_CHART_HEIGHT}" width="${ERROR_CHART_WIDTH}" height="${ERROR_CHART_HEIGHT}">
      <line x1="0" y1="${plotH}" x2="${ERROR_CHART_WIDTH}" y2="${plotH}" stroke="var(--panel-border)" stroke-width="1" />
      ${marks}
      ${labels}
    </svg>
  `;
}

// No sessionStorage/RESULTS_KEY involvement here -- a progressive run is a
// single condition with nothing to compare against, unlike
// renderResultsScreen below. `showPieChart` is wired to progressive/index.html's
// ?piechart=yes/no param (default no, i.e. hidden) and gates only the pie
// row -- the RT block always shows regardless of either setting.
// `showChart` (default true) is wired to ?plot=no, which hides the
// error/time chart and its heading entirely -- TAT's feedback never
// specified this chart, so keeping it shown by default and only hiding it
// on request, same spirit as the pie row staying opt-in rather than cut.
function renderProgressiveResultsScreen(containerEl, engine, plotType, showPieChart = false, showChart = true) {
  const chartBlock = showChart
    ? `<h3 class="rt-heading">${STRINGS.errorTimeChartHeading}</h3>${errorTimeChartSvg(engine.scoredHistory ?? [], engine.totalItems, plotType)}`
    : '';
  const pieRow = showPieChart ? pieRowHtml(engine, PROGRESSIVE_PIE_DIAMETER) : '';

  containerEl.innerHTML = `
    <div class="results-scale-wrap bg-panel">
      <h1>${STRINGS.resultsHeadingGeneric}</h1>
      ${chartBlock}
      <div class="results-column">
        ${pieRow}
        ${rtBlockHtml(engine)}
      </div>
      <button id="restart-btn">${STRINGS.restartButton}</button>
    </div>
  `;
  containerEl.classList.add('visible');
  document.getElementById('restart-btn').addEventListener('click', () => {
    window.location.reload();
  });
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
