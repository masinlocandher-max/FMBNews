(() => {
  'use strict';

  const categories = ['money', 'tech', 'lifestyle', 'politics', 'culture', 'environment', 'health'];
  const rules = [
    ['health', /\b(health|hospital|medical|medicine|disease|mental health|wellness|nutrition|doctor|nurse|patient|public health)\b/i],
    ['environment', /\b(environment|weather|climate|wildfire|storm|habagat|monsoon|water|rain|tropical|landfill|flood|earthquake|disaster|evacuat|luis)\b/i],
    ['tech', /\b(technology|tech|digital|website|artificial intelligence|\bai\b|pax silica|semiconductor|software|application|app|data center|cyber|internet)\b/i],
    ['politics', /\b(politics|political|government|governance|president|vice president|congress|senate|sona|impeachment|west philippine sea|ayungin|diplomacy|policy|officials?|marcos|duterte|teodoro|tax records|election)\b/i],
    ['money', /\b(money|economy|economic|business|tax|electricity|energy|oil|growth|shipping|industry|finance|financial|costs?|market|workers?|small business|tanker|trade|investment|income)\b/i],
    ['lifestyle', /\b(lifestyle|sports?|tennis|tourism|travel|faith|pageant|pageantry|fashion|food|home|well-being|good news|leisure|entertainment)\b/i],
    ['culture', /\b(culture|cultural|identity|heritage|language|racism|filipino|zambales|memorial|history|education|community|tradition|arts?)\b/i],
  ];

  const classify = (element) => {
    const explicit = element.dataset.newsCategory;
    if (categories.includes(explicit)) return explicit;
    const text = `${element.textContent || ''} ${element.querySelector('a')?.getAttribute('href') || ''}`;
    return rules.find(([, pattern]) => pattern.test(text))?.[0] || 'culture';
  };

  const params = new URLSearchParams(window.location.search);
  const requested = (params.get('category') || '').toLowerCase();
  const active = categories.includes(requested) ? requested : '';
  const links = [...document.querySelectorAll('[data-news-category-link]')];

  links.forEach((link) => {
    const category = link.dataset.newsCategoryLink;
    if (category === active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  if (!active) return;

  document.body.classList.add('news-category-filtered');
  document.body.dataset.activeNewsCategory = active;

  const stories = [...document.querySelectorAll('.nc-rundown-story')];
  let visibleCount = 0;

  stories.forEach((story) => {
    const category = classify(story);
    story.dataset.newsCategory = category;
    const visible = category === active;
    story.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  const panel = document.querySelector('.nc-rundown-panel');
  const heading = panel?.querySelector('.nc-rundown-head h2');
  const update = panel?.querySelector('.nc-rundown-head time');
  const label = active.charAt(0).toUpperCase() + active.slice(1);

  if (heading) heading.textContent = `${label} reports`;
  if (update) update.textContent = visibleCount ? `${visibleCount} published ${visibleCount === 1 ? 'report' : 'reports'}` : 'No published reports yet';

  let empty = panel?.querySelector('[data-news-category-empty]');
  if (!visibleCount && panel) {
    if (!empty) {
      empty = document.createElement('div');
      empty.className = 'nc-category-empty';
      empty.dataset.newsCategoryEmpty = 'true';
      panel.appendChild(empty);
    }
    empty.innerHTML = `<strong>${label} is now an official FMB News category.</strong><p>No report has been published under it yet. New stories will appear here automatically.</p>`;
  } else {
    empty?.remove();
  }
})();
