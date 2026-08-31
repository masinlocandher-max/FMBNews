(() => {
  'use strict';

  const FALLBACK = '/assets/images/news/fmb-news-editorial-fallback.svg';
  const STYLE_ID = 'fmb-news-image-hardfix-style';
  const AUTO_CLASS = 'fmb-auto-visual';
  const AUTO_FIGURE_CLASS = 'fmb-auto-figure';

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .fmb-ref img[data-fmb-image-fallback="true"]{background:#f4edf6}
      .fmb-ref .${AUTO_CLASS}{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#f4edf6}
      .fmb-ref .${AUTO_FIGURE_CLASS}{margin:20px 0;padding:8px;background:linear-gradient(145deg,#fff,#f2e8f4);border:1px solid #e1d1e4;box-shadow:0 12px 30px rgba(45,10,52,.08)}
      .fmb-ref .${AUTO_FIGURE_CLASS} img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}
      .fmb-ref .country-card>.${AUTO_CLASS}{width:calc(100% + 48px);max-width:none;margin:-24px -24px 18px}
      .fmb-ref .country-entry>.${AUTO_FIGURE_CLASS},.fmb-ref .cms-edition-entry>.${AUTO_FIGURE_CLASS}{margin:16px 0 20px}
      .fmb-ref .story-card>.${AUTO_CLASS},.fmb-ref .support-item>.${AUTO_CLASS},.fmb-ref .more-item>.${AUTO_CLASS},.fmb-ref .related-item>.${AUTO_CLASS}{flex:none}
      .fmb-ref .brief-issue>.${AUTO_CLASS}{align-self:stretch;height:100%;min-height:150px}
      @media(max-width:680px){.fmb-ref .country-card>.${AUTO_CLASS}{width:calc(100% + 40px);margin:-20px -20px 16px}}
    `;
    document.head.appendChild(style);
  }

  function headlineFor(container) {
    return container?.querySelector('h1,h2,h3')?.textContent?.trim() || 'FMB News';
  }

  function fallbackAlt(container) {
    return `FMB News editorial visual for ${headlineFor(container)}`;
  }

  function applyFallback(img, container = img.closest('article,a,section,div')) {
    if (!img || img.dataset.fmbFallbackApplied === 'true') return;
    img.dataset.fmbFallbackApplied = 'true';
    img.dataset.fmbImageFallback = 'true';
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src = FALLBACK;
    if (!img.alt || /^image$/i.test(img.alt.trim())) img.alt = fallbackAlt(container);
  }

  function guardImage(img) {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.dataset.fmbImageGuard === 'true') return;
    img.dataset.fmbImageGuard = 'true';

    const src = (img.getAttribute('src') || '').trim();
    if (!src || src === 'undefined' || src === 'null' || src === '#') {
      applyFallback(img);
      return;
    }

    img.addEventListener('error', () => applyFallback(img), { once: true });
    if (img.complete && img.naturalWidth === 0) applyFallback(img);
  }

  function makeImage(container) {
    const img = document.createElement('img');
    img.className = AUTO_CLASS;
    img.src = FALLBACK;
    img.alt = fallbackAlt(container);
    img.loading = 'lazy';
    img.decoding = 'async';
    img.dataset.fmbImageFallback = 'true';
    img.dataset.fmbFallbackApplied = 'true';
    img.dataset.fmbImageGuard = 'true';
    return img;
  }

  function ensureCardVisual(container) {
    if (!container || container.querySelector('img,picture,video')) return;
    const img = makeImage(container);
    if (container.matches('.brief-issue')) container.appendChild(img);
    else container.prepend(img);
  }

  function ensureArticleVisual(container) {
    if (!container || container.querySelector('figure img,img')) return;
    const figure = document.createElement('figure');
    figure.className = AUTO_FIGURE_CLASS;
    figure.appendChild(makeImage(container));

    const header = container.querySelector('header,h1,h2');
    if (header?.tagName === 'HEADER') header.insertAdjacentElement('afterend', figure);
    else if (header) header.insertAdjacentElement('afterend', figure);
    else container.prepend(figure);
  }

  function hardFix(root = document) {
    installStyles();

    root.querySelectorAll?.('img').forEach(guardImage);

    root.querySelectorAll?.('.story-card,.lead-story,.support-item,.more-item,.related-item,.brief-issue,.country-card')
      .forEach(ensureCardVisual);

    root.querySelectorAll?.('.article,.cms-article,.country-entry,.cms-edition-entry')
      .forEach(ensureArticleVisual);
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches('img')) guardImage(node);
        hardFix(node);
      }
    }
  });

  function boot() {
    hardFix(document);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
