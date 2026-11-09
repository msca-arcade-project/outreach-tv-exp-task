// shared/strings.js
// Single source of truth for user-facing copy shared JS renders. French
// only -- no language-switching logic, since this demo never needs a second
// language. Static markup (start-screen instructions, buttons, key hints)
// stays hand-translated directly in each index.html instead of routing
// through here; see lean/index.html and showcase/index.html.

const STRINGS = {
  progressLabel: 'CORRECT',
  conditionLabel: {
    distracted: 'avec distraction',
    undistracted: 'sans distraction',
  },
  // Generic page title -- the condition name itself (e.g. "avec distraction")
  // is shown once, prominently, as each column's own <h2>, per the TV
  // contact's sketch; repeating it here too was redundant.
  resultsHeadingGeneric: 'Partie terminée',
  pieCorrectLabel: 'correctes',
  pieErrorLabel: 'erreurs',
  rtHeading: 'TEMPS DE RÉPONSE',
  errorTimeChartHeading: 'ERREURS AU FIL DU TEMPS',
  restartButton: 'Recommencer',
};
