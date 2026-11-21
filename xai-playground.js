(() => {
  const root = document.querySelector('[data-xai-playground]');
  if (!root) return;

  const baseline = 0.34;
  const cutoff = 0.5;
  const features = [
    { id: 'whiskers', label: 'Whiskers', weight: 0.18 },
    { id: 'ears', label: 'Pointed ears', weight: 0.16 },
    { id: 'snout', label: 'Long snout', weight: -0.22 },
    { id: 'grass', label: 'Grass background', weight: 0.26 }
  ];
  const presets = {
    'grass-cat': { whiskers: 0.9, ears: 0.85, snout: 0.1, grass: 1 },
    'rug-dog': { whiskers: 0.1, ears: 0.15, snout: 0.9, grass: 0 },
    ambiguous: { whiskers: 0.55, ears: 0.5, snout: 0.5, grass: 0.2 }
  };
  const inputs = Object.fromEntries(features.map((feature) => [
    feature.id, root.querySelector(`[data-xai-input="${feature.id}"]`)
  ]));
  const viewButtons = [...root.querySelectorAll('[data-xai-view]')];
  let view = 'case';

  const values = () => Object.fromEntries(features.map((feature) => [
    feature.id, Number(inputs[feature.id].value) / 100
  ]));
  const scoreFor = (current) => baseline + features.reduce(
    (score, feature) => score + feature.weight * current[feature.id], 0
  );

  const render = () => {
    const current = values();
    const score = scoreFor(current);
    const isCat = score >= cutoff;
    root.querySelector('[data-xai-score]').textContent = `${Math.round(score * 100)}%`;
    root.querySelector('[data-xai-label]').textContent = isCat ? 'CAT' : 'DOG';
    root.querySelector('[data-xai-label]').dataset.prediction = isCat ? 'cat' : 'dog';
    root.querySelector('[data-xai-score-note]').textContent = `Toy score ${Math.round(score * 100)}%; label changes at ${Math.round(cutoff * 100)}%. This score is not calibrated confidence.`;

    features.forEach((feature) => {
      const row = root.querySelector(`[data-xai-feature="${feature.id}"]`);
      const contribution = view === 'case' ? feature.weight * current[feature.id] : feature.weight;
      const points = Math.round(contribution * 100);
      const sign = points > 0 ? '+' : '';
      row.querySelector('[data-xai-impact]').textContent = `${sign}${points} points`;
      row.querySelector('[data-xai-impact-bar]').value = Math.abs(points);
      row.dataset.direction = points < 0 ? 'negative' : 'positive';
      if (view === 'case') {
        root.querySelector(`[data-xai-value="${feature.id}"]`).textContent = `${inputs[feature.id].value}%`;
      }
    });

    viewButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.xaiView === view)));
    root.querySelector('[data-xai-view-note]').textContent = view === 'case'
      ? `Each bar shows how one cue moves this example’s score from the ${Math.round(baseline * 100)}% baseline.`
      : 'These are the fixed weights in this toy rule—not averages measured across a dataset.';

    if (view === 'rule') {
      const strongest = [...features].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))[0];
      root.querySelector('[data-xai-summary]').textContent = `${strongest.label} has the largest built-in weight (${Math.round(Math.abs(strongest.weight) * 100)} points for a full cue). That is a property of the toy rule, not evidence that the cue is meaningful.`;
    } else {
      const strongest = [...features].map((feature) => ({
        ...feature, impact: feature.weight * current[feature.id]
      })).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))[0];
      const points = Math.round(Math.abs(strongest.impact) * 100);
      const direction = strongest.impact >= 0 ? 'pushes toward' : 'pushes away from';
      root.querySelector('[data-xai-summary]').textContent = points
        ? `${strongest.label} ${direction} “cat” by about ${points} points in this example.`
        : 'None of these cues moved the score away from its baseline.';
    }
  };

  const clearCounterfactualNote = () => {
    root.querySelector('[data-xai-counterfactual-result]').textContent = 'The what-if changes model inputs only; it does not edit an image.';
  };

  root.addEventListener('input', (event) => {
    if (!event.target.matches('[data-xai-input]')) return;
    root.querySelectorAll('[data-xai-preset]').forEach((button) => button.setAttribute('aria-pressed', 'false'));
    clearCounterfactualNote();
    render();
  });

  root.addEventListener('click', (event) => {
    const presetButton = event.target.closest('[data-xai-preset]');
    if (presetButton && root.contains(presetButton)) {
      const preset = presets[presetButton.dataset.xaiPreset];
      if (!preset) return;
      Object.entries(preset).forEach(([id, value]) => { inputs[id].value = String(Math.round(value * 100)); });
      root.querySelectorAll('[data-xai-preset]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button === presetButton));
      });
      clearCounterfactualNote();
      render();
      return;
    }

    const viewButton = event.target.closest('[data-xai-view]');
    if (viewButton && root.contains(viewButton)) {
      view = viewButton.dataset.xaiView === 'rule' ? 'rule' : 'case';
      render();
      return;
    }

    if (event.target.closest('[data-xai-counterfactual]')) findCounterfactual();
  });

  const findCounterfactual = () => {
    const initial = values();
    const initialScore = scoreFor(initial);
    const wasCat = initialScore >= cutoff;
    let remaining = wasCat ? initialScore - cutoff + 0.02 : cutoff - initialScore + 0.02;
    const changes = [];

    [...features].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).forEach((feature) => {
      if (remaining <= 0) return;
      const value = initial[feature.id];
      const shouldIncreaseScore = !wasCat;
      const helpsScore = (feature.weight > 0) === shouldIncreaseScore;
      const target = helpsScore ? 1 : 0;
      const available = Math.abs(target - value);
      const change = Math.min(available, remaining / Math.abs(feature.weight));
      if (change <= 0) return;
      const nextValue = value + (target > value ? change : -change);
      changes.push({ feature, nextValue });
      remaining -= change * Math.abs(feature.weight);
    });

    if (remaining > 0.001 || changes.length === 0) {
      root.querySelector('[data-xai-counterfactual-result]').textContent = 'No available combination of these toy cues flips the label. Try changing the inputs yourself.';
      return;
    }

    changes.forEach(({ feature, nextValue }) => {
      const scaled = nextValue * 100;
      const rounded = nextValue > initial[feature.id] ? Math.ceil(scaled) : Math.floor(scaled);
      inputs[feature.id].value = String(Math.max(0, Math.min(100, rounded)));
    });
    root.querySelectorAll('[data-xai-preset]').forEach((button) => button.setAttribute('aria-pressed', 'false'));
    render();
    const finalScore = scoreFor(values());
    const finalLabel = finalScore >= cutoff ? 'cat' : 'dog';
    const changeText = changes.map(({ feature }) => feature.label.toLowerCase()).join(' and ');
    root.querySelector('[data-xai-counterfactual-result]').textContent = `In this toy rule, changing ${changeText} flips the label from ${wasCat ? 'cat' : 'dog'} (${Math.round(initialScore * 100)}%) to ${finalLabel} (${Math.round(finalScore * 100)}%). This nearest feature-space change may not be realistic for a real image.`;
  };

  render();
})();
