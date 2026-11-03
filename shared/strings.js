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
  resultsHeading: (label) => `Partie terminée – ${label}`,
  pieCorrectLabel: 'correctes',
  pieErrorLabel: 'erreurs',
  rtHeading: 'TEMPS DE RÉPONSE',
  resultsHintBoth: 'Les deux conditions ont été jouées sur cet appareil – comparaison ci-dessus.',
  resultsHintSingle: (otherLabel) =>
    `Lancez la condition « ${otherLabel} » sur cet appareil pour voir une comparaison côte à côte.`,
  restartButton: 'Recommencer',
};
