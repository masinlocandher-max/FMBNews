(() => {
  'use strict';

  const markOrientation = (image) => {
    const width = image.naturalWidth || Number(image.getAttribute('width')) || 0;
    const height = image.naturalHeight || Number(image.getAttribute('height')) || 0;
    if (!width || !height) return;

    const ratio = width / height;
    const orientation = ratio > 1.12 ? 'landscape' : ratio < 0.88 ? 'portrait' : 'square';
    const figure = image.closest('figure');

    image.dataset.newsOrientation = orientation;
    if (figure) figure.dataset.newsOrientation = orientation;
  };

  const prepareImage = (image) => {
    markOrientation(image);
    if (!image.complete) image.addEventListener('load', () => markOrientation(image), { once: true });
    image.addEventListener('error', () => {
      const figure = image.closest('figure');
      if (figure) figure.dataset.newsImageState = 'unavailable';
    }, { once: true });
  };

  document.querySelectorAll('main figure img, .nc-rundown-panel figure img').forEach(prepareImage);
})();
