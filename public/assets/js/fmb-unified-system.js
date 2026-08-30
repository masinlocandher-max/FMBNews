(() => {
  'use strict';

  const body = document.body;
  const header = document.querySelector('.fmb-shell-header');
  const nav = document.querySelector('.fmb-shell-nav');
  const menu = document.querySelector('.fmb-shell-menu');

  const copyText = async (value) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    document.execCommand('copy');
    field.remove();
  };

  const loadYoniSenzAdvertisement = () => {
    if (!body?.classList.contains('fmb-unified-home') || document.querySelector('#yoni-digital-space')) return;

    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/assets/css/fmb-yoni-senz-ad.css?v=20260728-yoni-senz-ad-v1';
    stylesheet.setAttribute('data-fmb-yoni-senz-ad', 'true');
    document.head.appendChild(stylesheet);

    const advertisement = document.createElement('section');
    advertisement.id = 'yoni-digital-space';
    advertisement.className = 'fmb-yoni-senz-ad';
    advertisement.setAttribute('aria-labelledby', 'yoniDigitalSpaceTitle');
    advertisement.innerHTML = `
      <div class="fmb-yoni-senz-ad__copy">
        <p class="fmb-yoni-senz-ad__label">Advertisement · SENZ Digital Solutions</p>
        <h2 id="yoniDigitalSpaceTitle">Yoni has a space of her own. <em>Your idea can, too.</em></h2>
        <p class="fmb-yoni-senz-ad__lead">A social post can be scrolled past. A digital space can be entered, used, remembered, and returned to. Yoni is the proof: a distinct branded experience with her own identity, tools, content, and destination.</p>
        <div class="fmb-yoni-senz-ad__proof" aria-label="Ways to launch a digital space">
          <article><small>Own it</small><strong>Build a custom digital space around your brand, audience, and workflow.</strong></article>
          <article><small>Rent first</small><strong>Not ready for the full investment? Launch a SENZ-powered branded space, prove demand, then grow.</strong></article>
        </div>
        <div class="fmb-yoni-senz-ad__actions">
          <a class="fmb-yoni-senz-ad__primary" href="https://yoni.francinemariebautista.com/">Experience Yoni <span aria-hidden="true">→</span></a>
          <a class="fmb-yoni-senz-ad__secondary" href="https://www.senzpr.com/contact.html?interest=Digital%20Products&path=Own&source=FMB%20Homepage%20Yoni%20Ad">Build your space <span aria-hidden="true">→</span></a>
          <a class="fmb-yoni-senz-ad__secondary" href="https://www.senzpr.com/contact.html?interest=Digital%20Products&path=Rent&source=FMB%20Homepage%20Yoni%20Ad">Ask about rental <span aria-hidden="true">→</span></a>
          <button class="fmb-yoni-senz-ad__share" type="button" data-fmb-share-yoni-ad>Share this idea</button>
        </div>
        <p class="fmb-yoni-senz-ad__status" data-fmb-share-yoni-status role="status" aria-live="polite"></p>
      </div>
      <div class="fmb-yoni-senz-ad__visual" aria-label="Yoni digital companion presented as a SENZ digital solutions case study">
        <span class="fmb-yoni-senz-ad__halo" aria-hidden="true"></span>
        <img class="fmb-yoni-senz-ad__wordmark" src="/app/assets/yoni/yoni-wordmark.png" width="981" height="441" loading="lazy" decoding="async" alt="Yoni">
        <img class="fmb-yoni-senz-ad__mascot" src="/app/assets/yoni/yoni-hero.webp" width="1254" height="1254" loading="lazy" decoding="async" alt="Yoni, the orange digital companion">
        <a class="fmb-yoni-senz-ad__senz" href="https://www.senzpr.com/digital-products.html" aria-label="Explore SENZ Digital Products">
          <img src="/assets/images/projects/senz-logo-clean.png" width="1080" height="416" loading="lazy" decoding="async" alt="SENZ">
          <span><small>Built as a real example</small><strong>SENZ Digital Solutions turns ideas into branded spaces people can actually use.</strong></span>
        </a>
      </div>`;

    const controlCenter = document.querySelector('.fmb-approved-control-center');
    const capabilities = controlCenter?.querySelector('.fmb-approved-capabilities');
    if (capabilities) capabilities.insertAdjacentElement('afterend', advertisement);
    else if (controlCenter) controlCenter.prepend(advertisement);
    else document.querySelector('main .hero')?.insertAdjacentElement('afterend', advertisement);

    const shareButton = advertisement.querySelector('[data-fmb-share-yoni-ad]');
    const shareStatus = advertisement.querySelector('[data-fmb-share-yoni-status]');
    const shareUrl = `${window.location.origin}/#yoni-digital-space`;
    const shareData = {
      title: 'Yoni has a space of her own. Your idea can, too.',
      text: 'See how Yoni became a branded digital space, and how SENZ can help you own one or rent first.',
      url: shareUrl,
    };

    shareButton?.addEventListener('click', async () => {
      shareStatus.textContent = '';
      try {
        if (navigator.share) {
          await navigator.share(shareData);
          shareStatus.textContent = 'Shared.';
        } else {
          await copyText(`${shareData.text} ${shareUrl}`);
          shareStatus.textContent = 'Share link copied.';
        }
      } catch (error) {
        if (error?.name === 'AbortError') return;
        try {
          await copyText(`${shareData.text} ${shareUrl}`);
          shareStatus.textContent = 'Share link copied.';
        } catch {
          shareStatus.textContent = 'Open the page link from your browser to share it.';
        }
      }
    });
  };

  loadYoniSenzAdvertisement();

  if (!body || !header || !nav || !menu) return;

  const closeMenu = () => {
    nav.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open navigation');
    body.classList.remove('fmb-menu-open');
  };

  const openMenu = () => {
    nav.classList.add('is-open');
    menu.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-label', 'Close navigation');
    body.classList.add('fmb-menu-open');
  };

  menu.addEventListener('click', () => {
    if (menu.getAttribute('aria-expanded') === 'true') closeMenu();
    else openMenu();
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('is-open')) return;
    if (header.contains(event.target)) return;
    closeMenu();
  });

  const setHeaderState = () => {
    header.classList.toggle('is-condensed', window.scrollY > 24);
  };

  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  const navLinks = [...nav.querySelectorAll('a[href]')];

  const pathMatch = (href) => {
    if (!href || href.startsWith('http') || href.startsWith('mailto:')) return false;
    const url = new URL(href, window.location.origin);
    const targetPath = url.pathname.replace(/index\.html$/i, '') || '/';
    const currentPath = window.location.pathname.replace(/index\.html$/i, '') || '/';
    if (targetPath === '/') return currentPath === '/';
    return currentPath.startsWith(targetPath);
  };

  navLinks.forEach((link) => {
    if (pathMatch(link.getAttribute('href'))) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  const revealTargets = [
    ...document.querySelectorAll(
      'main > section > :is(article, div, header, figure, aside, section), main > article, .fmb-strategy-head, .fmb-capability, .fmb-company-depth article, .fmb-impact-grid article, .fmb-journey-options article',
    ),
  ].filter((node) => !node.closest('.fmb-shell-header, .fmb-shell-footer'));

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    revealTargets.forEach((target, index) => {
      target.classList.add('fmb-reveal');
      target.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
      observer.observe(target);
    });
  } else {
    revealTargets.forEach((target) => target.classList.add('fmb-reveal', 'is-visible'));
  }

  const loadReceptionDesk = () => {
    if (document.querySelector('script[src*="/assets/js/az-assistant.js"]')) return;
    const script = document.createElement('script');
    script.src = '/assets/js/az-assistant.js?v=20260724-fmbandco-unified-v1';
    script.defer = true;
    document.body.appendChild(script);
  };

  if ('requestIdleCallback' in window) window.requestIdleCallback(loadReceptionDesk, { timeout: 1600 });
  else window.setTimeout(loadReceptionDesk, 500);

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960) closeMenu();
  });

  body.dataset.fmbUnifiedReady = 'true';
})();
