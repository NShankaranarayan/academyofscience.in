(() => {
  const root = document.querySelector('[data-xai-vision]');
  if (!root) return;

  const views = {
    original: {
      src: '../assets/xai-demo/gradcam-cat-dog.jfif',
      alt: 'Original photo of a puppy beside a kitten',
      caption: 'Original image · puppy and kitten together',
      title: 'Start with the photo',
      copy: 'This bundled example contains both animals. The overlays are precomputed outputs from a ResNet50 ImageNet example using Grad-CAM; this page does not run the model.'
    },
    dog: {
      src: '../assets/xai-demo/gradcam-dog.jpg',
      alt: 'Precomputed Grad-CAM overlay for the dog class, concentrated around the puppy’s face',
      caption: 'Grad-CAM target · dog',
      title: 'Ask about “dog”',
      copy: 'This map was computed for the dog class. In this example, stronger response is around the puppy. The warmer region is not a confidence score and does not prove the model used only those pixels.'
    },
    cat: {
      src: '../assets/xai-demo/gradcam-cat.jpg',
      alt: 'Precomputed Grad-CAM overlay for the cat class, concentrated around the kitten’s face',
      caption: 'Grad-CAM target · cat',
      title: 'Ask about “cat”',
      copy: 'The same photo, with the cat class as the target, shifts the strongest response toward the kitten. Grad-CAM is class-specific: changing the target can change the map.'
    }
  };

  const image = root.querySelector('[data-xai-gradcam-image]');
  const caption = root.querySelector('[data-xai-gradcam-caption]');
  const title = root.querySelector('[data-xai-gradcam-title]');
  const copy = root.querySelector('[data-xai-gradcam-copy]');

  const selectView = (key) => {
    const view = views[key] || views.original;
    image.src = view.src;
    image.alt = view.alt;
    caption.textContent = view.caption;
    title.textContent = view.title;
    copy.textContent = view.copy;
    root.querySelectorAll('[data-xai-gradcam-view]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.xaiGradcamView === key));
    });
  };

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-xai-gradcam-view]');
    if (button && root.contains(button)) selectView(button.dataset.xaiGradcamView);
  });
})();
