(() => {
  const body = document.body;
  if (!body?.classList.contains('news-route')) return;

  body.classList.add('fmb-headquarters');

  const style = document.createElement('style');
  style.textContent = `
    .fmb-filipino-promise{border-top:1px solid rgba(17,17,20,.14);border-bottom:1px solid rgba(17,17,20,.14);background:#fff}
    .fmb-filipino-promise__inner{width:min(calc(100% - 48px),1600px);margin:auto;padding:72px 0;display:grid;grid-template-columns:minmax(220px,.55fr) minmax(0,1.45fr);gap:64px;align-items:start}
    .fmb-filipino-promise__label{color:#3e176d;font:700 11px/1.3 Inter,ui-sans-serif,sans-serif;letter-spacing:.18em;text-transform:uppercase}
    .fmb-filipino-promise h2{max-width:1050px;margin:0;font-family:"Cormorant Garamond",Georgia,serif;font-size:clamp(44px,5vw,82px);font-weight:500;letter-spacing:-.045em;line-height:.94}
    .fmb-filipino-promise p{max-width:850px;margin:28px 0 0;color:#5f5c65;font:400 18px/1.65 Inter,ui-sans-serif,sans-serif}
    .fmb-why-it-matters{margin:0 0 26px;padding:18px 0 0;border-top:1px solid rgba(17,17,20,.14)}
    .fmb-why-it-matters span{display:block;margin-bottom:8px;color:#3e176d;font:700 10px/1.2 Inter,ui-sans-serif,sans-serif;letter-spacing:.17em;text-transform:uppercase}
    .fmb-why-it-matters p{margin:0;color:#4d4a52;font:500 15px/1.55 Inter,ui-sans-serif,sans-serif}
    @media(max-width:760px){.fmb-filipino-promise__inner{width:min(calc(100% - 28px),1600px);padding:52px 0;grid-template-columns:1fr;gap:24px}.fmb-filipino-promise p{font-size:16px}}
  `;
  document.head.appendChild(style);

  document.querySelectorAll('[data-news-clock]').forEach((el) => {
    el.removeAttribute('data-news-clock');
    el.textContent = 'Philippine Standard Time';
  });

  const updated = document.querySelector('[data-news-updated]');
  if (updated) updated.textContent = updated.textContent.replace(/^Updated\s*/i, 'Published ');

  if (!body.classList.contains('news-story-route')) {
    const identity = document.querySelector('.nc-broadcast-identity');
    if (identity && !document.querySelector('.fmb-filipino-promise')) {
      const promise = document.createElement('section');
      promise.className = 'fmb-filipino-promise';
      promise.setAttribute('aria-labelledby', 'fmbFilipinoPromise');
      promise.innerHTML = `
        <div class="fmb-filipino-promise__inner">
          <div class="fmb-filipino-promise__label">Built for Filipinos</div>
          <div>
            <h2 id="fmbFilipinoPromise">Every headline affects a life, a community, or the country we are building.</h2>
            <p>FMB News explains not only what happened, but why Filipinos should know, what the wider context means, and how decisions made today may affect our rights, safety, livelihood, culture, and future.</p>
          </div>
        </div>`;
      identity.insertAdjacentElement('afterend', promise);
    }
  }

  if (body.classList.contains('news-story-route')) {
    const deck = document.querySelector('.nc-article-deck');
    if (deck && !document.querySelector('.fmb-why-it-matters')) {
      const why = document.createElement('div');
      why.className = 'fmb-why-it-matters';
      why.innerHTML = '<span>Why this matters to Filipinos</span><p>This report is presented with context so readers can understand its possible effect on Filipino communities, public decisions, daily life, and the country’s future.</p>';
      deck.insertAdjacentElement('afterend', why);
    }
  }

  const revealItems = document.querySelectorAll('.nc-reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const menuButton = document.querySelector('[data-news-menu]');
  const menu = document.getElementById('newsNav');
  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close news menu' : 'Open news menu');
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      menu?.classList.remove('is-open');
      menuButton?.setAttribute('aria-expanded', 'false');
    });
  });
})();
