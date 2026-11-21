(() => {
  const root = document.querySelector('[data-xai-timing]');
  if (!root) return;

  const modes = {
    training: {
      step: 'TRAIN',
      model: 'Data + concept labels',
      detail: 'Teach the model to predict visible concepts, then use those concepts to make its final prediction.',
      output: 'Inspectable by design',
      example: 'Example: “whiskers present” → “cat.” A person can inspect or correct the concept.',
      caveat: 'Costs: concept definitions and labels take work, and the model can still miss a concept or use it incorrectly.'
    },
    posthoc: {
      step: 'AFTER FIT',
      model: 'Trained model + one image',
      detail: 'Keep the model fixed, then probe a prediction with an explanation method such as Grad-CAM or occlusion.',
      output: 'Evidence about this output',
      example: 'Example: hide image regions and observe how the “cat” score changes. The map does not reveal the full learned rule.',
      caveat: 'Benefit: can inspect an existing model without retraining. Limit: the explanation can be unstable or misleading, so validate it.'
    }
  };

  root.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-xai-timing-tab]');
    if (!tab) return;
    const mode = modes[tab.dataset.xaiTimingTab] ? tab.dataset.xaiTimingTab : 'training';
    const copy = modes[mode];
    root.querySelectorAll('[data-xai-timing-tab]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button === tab));
    });
    root.querySelector('[data-xai-timing-step]').textContent = copy.step;
    root.querySelector('[data-xai-timing-model]').textContent = copy.model;
    root.querySelector('[data-xai-timing-detail]').textContent = copy.detail;
    root.querySelector('[data-xai-timing-output]').textContent = copy.output;
    root.querySelector('[data-xai-timing-example]').textContent = copy.example;
    root.querySelector('[data-xai-timing-caveat]').textContent = copy.caveat;
  });
})();
