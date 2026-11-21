(() => {
  const initTextRetrieval = (root) => {
    const scenarios = {
      silver: {
        text: '“A silver sedan turns left beside a bus.”',
        cues: { appearance: ['silver', 'sedan'], context: ['bus'], motion: ['left'] }
      },
      blue: {
        text: '“A blue hatchback goes straight near a taxi.”',
        cues: { appearance: ['blue', 'hatchback'], context: ['taxi'], motion: ['straight'] }
      },
      white: {
        text: '“A white van follows a bus, then turns right.”',
        cues: { appearance: ['white', 'van'], context: ['bus'], motion: ['right'] }
      }
    };
    const candidates = [
      { name: 'Track A · camera 04', details: 'silver sedan · bus nearby · turns left', cues: { appearance: ['silver', 'sedan'], context: ['bus'], motion: ['left'] } },
      { name: 'Track B · camera 04', details: 'silver sedan · taxi nearby · goes straight', cues: { appearance: ['silver', 'sedan'], context: ['taxi'], motion: ['straight'] } },
      { name: 'Track C · camera 09', details: 'blue hatchback · bus nearby · goes straight', cues: { appearance: ['blue', 'hatchback'], context: ['bus'], motion: ['straight'] } },
      { name: 'Track D · camera 02', details: 'white van · bus nearby · turns right', cues: { appearance: ['white', 'van'], context: ['bus'], motion: ['right'] } }
    ];
    let scenario = 'silver';
    const enabled = { appearance: true, context: true, motion: true };
    const cueWeights = { appearance: 0.5, context: 0.25, motion: 0.25 };
    const results = root.querySelector('[data-text-results]');

    const render = () => {
      const current = scenarios[scenario];
      const activeCues = Object.keys(enabled).filter((cue) => enabled[cue]);
      root.querySelector('[data-text-query-label]').textContent = current.text;
      root.querySelectorAll('[data-text-query]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.textQuery === scenario));
      });
      root.querySelectorAll('[data-text-cue]').forEach((button) => {
        button.setAttribute('aria-pressed', String(enabled[button.dataset.textCue]));
      });
      root.querySelectorAll('[data-svg-cue]').forEach((node) => {
        const on = enabled[node.dataset.svgCue];
        node.classList.toggle('is-lit', on);
        node.classList.toggle('is-muted', !on);
      });
      const cueText = activeCues.length
        ? `${activeCues.map((cue) => ({ appearance: 'appearance', context: 'surroundings', motion: 'direction' })[cue]).join(' + ')} contribute to this illustrative match.`
        : 'No clue branches are active, so the toy rule cannot distinguish the candidates.';
      root.querySelector('[data-text-cue-note]').textContent = cueText;

      const ranked = candidates.map((candidate) => {
        let weighted = 0;
        let totalWeight = 0;
        activeCues.forEach((cue) => {
          const queryTerms = current.cues[cue];
          const found = queryTerms.filter((term) => candidate.cues[cue].includes(term)).length;
          weighted += (found / queryTerms.length) * cueWeights[cue];
          totalWeight += cueWeights[cue];
        });
        const points = totalWeight ? Math.round((weighted / totalWeight) * 100) : 0;
        return { ...candidate, points };
      }).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

      results.replaceChildren();
      ranked.forEach((candidate, index) => {
        const item = document.createElement('li');
        item.className = `text-result${index === 0 && candidate.points > 0 ? ' is-best' : ''}`;
        const main = document.createElement('span');
        main.className = 'text-result-main';
        const name = document.createElement('b');
        name.textContent = `${index + 1}. ${candidate.name}`;
        const details = document.createElement('small');
        details.textContent = candidate.details;
        main.append(name, details);
        const track = document.createElement('span');
        track.className = 'text-result-track';
        const fill = document.createElement('progress');
        fill.max = 100;
        fill.value = candidate.points;
        fill.setAttribute('aria-label', `Illustrative match points for ${candidate.name}`);
        track.append(fill);
        const score = document.createElement('span');
        score.className = 'text-result-score';
        score.textContent = activeCues.length ? `${candidate.points} toy points` : 'no clues';
        item.append(main, track, score);
        results.append(item);
      });
    };

    root.addEventListener('click', (event) => {
      const queryButton = event.target.closest('[data-text-query]');
      if (queryButton && root.contains(queryButton)) {
        scenario = queryButton.dataset.textQuery;
        render();
        return;
      }
      const cueButton = event.target.closest('[data-text-cue]');
      if (cueButton && root.contains(cueButton)) {
        const cue = cueButton.dataset.textCue;
        enabled[cue] = !enabled[cue];
        render();
      }
    });
    render();
  };

  const initFeedback = (root) => {
    const results = {
      baseline: { 0: { map: 26.5, rank1: 61.6 } },
      explicit: {
        1: { map: 26.5, rank1: 61.7 },
        3: { map: 28.2, rank1: 65.0 },
        5: { map: 29.4, rank1: 70.4 },
        10: { map: 31.7, rank1: 79.4 },
        20: { map: 34.2, rank1: 83.9 }
      },
      blind: {
        1: { map: 7.4, rank1: 13.0 },
        3: { map: 2.0, rank1: 1.0 },
        5: { map: 1.4, rank1: 1.0 }
      }
    };
    let mode = 'explicit';
    let depth = 20;

    const render = () => {
      root.dataset.feedbackFlow = mode;
      root.querySelectorAll('[data-feedback-mode]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.feedbackMode === mode));
      });
      root.querySelectorAll('[data-feedback-depth]').forEach((button) => {
        const n = Number(button.dataset.feedbackDepth);
        button.disabled = mode === 'baseline' || (mode === 'blind' && n > 5);
        button.setAttribute('aria-pressed', String(mode !== 'baseline' && n === depth));
      });

      const modeCopy = {
        baseline: { label: 'No feedback', copy: 'Keep the original order', note: 'This is the ResNet ranking before feedback is applied.' },
        explicit: { label: 'Person checks', copy: 'Relevant or not?', note: `A person verifies the top ${depth} candidates before their features refine the query.` },
        blind: { label: 'System assumes', copy: 'Top results are relevant', note: `The system treats its top ${depth} result${depth === 1 ? '' : 's'} as correct without a person checking them.` }
      }[mode];
      root.querySelector('[data-feedback-step-label]').textContent = modeCopy.label;
      root.querySelector('[data-feedback-step-copy]').textContent = modeCopy.copy;
      root.querySelector('[data-feedback-explanation]').textContent = modeCopy.note;
      root.querySelectorAll('[data-feedback-step]').forEach((step) => {
        step.classList.toggle('is-active', mode !== 'baseline' || step.dataset.feedbackStep === 'rank');
      });

      const selected = results[mode][mode === 'baseline' ? 0 : depth];
      [['map', selected.map], ['rank1', selected.rank1]].forEach(([metric, value]) => {
        const card = root.querySelector(`[data-feedback-metric="${metric}"]`);
        card.classList.remove('is-changing');
        requestAnimationFrame(() => card.classList.add('is-changing'));
        card.querySelector('[data-feedback-value]').textContent = `${Number(value).toFixed(1)}%`;
        card.querySelector('[data-feedback-bar]').value = value;
      });
    };

    root.addEventListener('click', (event) => {
      const modeButton = event.target.closest('[data-feedback-mode]');
      if (modeButton && root.contains(modeButton)) {
        mode = modeButton.dataset.feedbackMode;
        if (mode === 'blind' && depth > 5) depth = 5;
        render();
        return;
      }
      const depthButton = event.target.closest('[data-feedback-depth]');
      if (depthButton && root.contains(depthButton) && !depthButton.disabled) {
        depth = Number(depthButton.dataset.feedbackDepth);
        render();
      }
    });
    render();
  };

  const initMethods = (root) => {
    const stages = {
      1: {
        label: 'CLASS 1 · FEATURE LEARNING', title: 'Learn visual cues',
        description: 'A CNN or related vision model turns a vehicle image into features. Some methods focus on the whole vehicle; others look at local parts such as lights, windows, or body shape.',
        tradeoff: 'Features can be hard to compare across different viewpoints. Focusing on only a few parts can miss useful evidence elsewhere in the image.'
      },
      2: {
        label: 'CLASS 2 · + METRIC LEARNING', title: 'Teach the feature space what “same” means',
        description: 'A metric-learning objective shapes feature distances: examples of the same vehicle should move closer, while different identities should move farther apart.',
        tradeoff: 'Training now depends on useful identity labels and carefully chosen positive and negative examples. A tidy benchmark can still differ from real camera data.'
      },
      3: {
        label: 'CLASS 3 · + POST-PROCESSING', title: 'Refine the first ranked list',
        description: 'After initial feature matching, re-ranking or tracklet and camera context can reorder candidates using relationships among the results.',
        tradeoff: 'This adds a second step after inference. It may improve ranking, but increases computation and can rely on context that is unavailable for a new or isolated query.'
      },
      4: {
        label: 'CLASS 4 · + PRE-PROCESSING', title: 'Prepare difficult or missing data',
        description: 'Image cleanup, synthetic viewpoints, generated examples, or domain adaptation can address difficult inputs and gaps between training data and target cameras.',
        tradeoff: 'More preprocessing can improve coverage, but synthetic images may differ from real footage and adaptation adds data and evaluation work.'
      }
    };
    const datasets = {
      veri: { images: '~50k', vehicles: '776', cameras: '20' },
      wild: { images: '~416k', vehicles: '40,671', cameras: '174' },
      cityflow: { images: '~85k', vehicles: '880', cameras: '40' }
    };
    let stage = 4;
    let dataset = 'veri';

    const render = () => {
      const current = stages[stage];
      root.querySelectorAll('[data-method-stage]').forEach((button) => {
        button.setAttribute('aria-pressed', String(Number(button.dataset.methodStage) === stage));
      });
      root.querySelectorAll('[data-method-layer]').forEach((layer) => {
        layer.classList.toggle('is-included', Number(layer.dataset.methodLayer) <= stage);
      });
      root.querySelector('[data-method-class]').textContent = current.label;
      root.querySelector('[data-method-title]').textContent = current.title;
      root.querySelector('[data-method-description]').textContent = current.description;
      root.querySelector('[data-method-tradeoff]').textContent = current.tradeoff;
      root.querySelectorAll('[data-method-dataset]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.methodDataset === dataset));
      });
      const counts = datasets[dataset];
      root.querySelector('[data-dataset-images]').textContent = counts.images;
      root.querySelector('[data-dataset-vehicles]').textContent = counts.vehicles;
      root.querySelector('[data-dataset-cameras]').textContent = counts.cameras;
    };

    root.addEventListener('click', (event) => {
      const stageButton = event.target.closest('[data-method-stage]');
      if (stageButton && root.contains(stageButton)) {
        stage = Number(stageButton.dataset.methodStage);
        render();
        return;
      }
      const datasetButton = event.target.closest('[data-method-dataset]');
      if (datasetButton && root.contains(datasetButton)) {
        dataset = datasetButton.dataset.methodDataset;
        render();
      }
    });
    render();
  };

  document.querySelectorAll('[data-text-retrieval-lab]').forEach(initTextRetrieval);
  document.querySelectorAll('[data-feedback-lab]').forEach(initFeedback);
  document.querySelectorAll('[data-methods-lab]').forEach(initMethods);
})();
