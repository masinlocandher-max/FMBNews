(() => {
  'use strict';

  const SUPABASE_URL = 'https://wjnavdpppnhxbuydkrkd.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_bpdFntTHbHmxsG4L0PtcCw_5dJ8gpr8';
  const API = `${SUPABASE_URL}/rest/v1`;

  const headers = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Accept: 'application/json'
  };

  const text = (value) => value == null ? '' : String(value);
  const formatDate = (value, options = {}) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      ...options
    }).format(date);
  };

  async function get(table, query) {
    const response = await fetch(`${API}/${table}?${query}`, { headers });
    if (!response.ok) throw new Error(`FMB CMS request failed (${response.status})`);
    return response.json();
  }

  function storyHref(article) {
    return article.canonical_path || `/news/read/${encodeURIComponent(article.slug)}/`;
  }

  function el(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value != null) node.textContent = text(value);
    return node;
  }

  async function hydrateHomepageStories() {
    const section = document.getElementById('stories');
    const grid = section?.querySelector('.story-grid');
    if (!grid) return;

    const fields = [
      'slug','canonical_path','title','summary','deck','category','region',
      'image_url','image_credit','published_at'
    ].join(',');
    const articles = await get(
      'news_articles',
      `select=${fields}&status=eq.published&order=published_at.desc&limit=8`
    );
    if (!Array.isArray(articles) || articles.length === 0) return;

    const fragment = document.createDocumentFragment();
    for (const article of articles) {
      const link = el('a', 'story-card');
      link.href = storyHref(article);

      if (article.image_url) {
        const img = document.createElement('img');
        img.src = article.image_url;
        img.alt = article.title || 'FMB News';
        img.loading = 'lazy';
        img.decoding = 'async';
        link.appendChild(img);
      }

      const body = document.createElement('div');
      body.appendChild(el('em', '', article.region || article.category || 'FMB News'));
      body.appendChild(el('h3', '', article.title));
      body.appendChild(el('p', '', article.deck || article.summary || ''));
      link.appendChild(body);
      fragment.appendChild(link);
    }

    grid.replaceChildren(fragment);
    section.dataset.cmsHydrated = 'true';
  }

  async function latestEdition(type) {
    const editions = await get(
      'news_editions',
      `select=id,edition_type,edition_date,slug,title,deck,hero_image_url,hero_image_credit,published_at,window_start,window_end&edition_type=eq.${encodeURIComponent(type)}&status=eq.published&order=edition_date.desc&limit=1`
    );
    return Array.isArray(editions) && editions.length ? editions[0] : null;
  }

  async function editionEntries(editionId) {
    return get(
      'news_edition_entries',
      `select=id,entry_key,country,section,category,headline,verified_fact,why_it_matters,reputation_implication,opportunity_risk,source_links,image_url,image_credit,sort_order&edition_id=eq.${encodeURIComponent(editionId)}&order=sort_order.asc,created_at.asc`
    );
  }

  async function hydrateWorldwideLanding() {
    if (!location.pathname.replace(/\/+$/, '/').endsWith('/news/world/')) return;
    const grid = document.querySelector('.country-grid');
    const heading = document.querySelector('.world-feed-head h2');
    const intro = document.querySelector('.world-feed-head p');
    if (!grid) return;

    const edition = await latestEdition('worldwide');
    if (!edition) return;
    const entries = await editionEntries(edition.id);
    if (!entries?.length) return;

    if (heading) heading.textContent = formatDate(`${edition.edition_date}T12:00:00+08:00`);
    if (intro) intro.textContent = edition.deck || 'Current FMB Worldwide edition. Verified facts are separated from FMB analysis.';

    const fragment = document.createDocumentFragment();
    for (const entry of entries.slice(0, 8)) {
      const link = el('a', 'country-card');
      link.href = `/news/world/live/#${encodeURIComponent(entry.entry_key)}`;
      const small = document.createElement('small');
      small.appendChild(el('span', '', entry.country || entry.section || 'Worldwide'));
      small.appendChild(el('span', '', entry.category || 'Update'));
      link.appendChild(small);
      link.appendChild(el('h3', '', entry.headline));
      link.appendChild(el('p', '', entry.verified_fact || entry.why_it_matters || ''));
      fragment.appendChild(link);
    }
    grid.replaceChildren(fragment);
    grid.dataset.cmsHydrated = 'true';
  }

  async function hydrateBriefFeature() {
    const feature = document.querySelector('.brief-feature');
    if (!feature) return;
    const edition = await latestEdition('brief');
    if (!edition) return;

    const latestLink = feature.querySelector('.brief-feature-actions a:first-child');
    const cardLink = feature.querySelector('.brief-feature-latest a');
    const cardTitle = feature.querySelector('.brief-feature-latest h3');
    const cardCopy = feature.querySelector('.brief-feature-latest p');
    const cardMeta = feature.querySelector('.brief-feature-latest small');

    if (latestLink) latestLink.href = '/news/fmb-brief/live/';
    if (cardLink) cardLink.href = '/news/fmb-brief/live/';
    if (cardTitle) cardTitle.textContent = edition.title;
    if (cardCopy) cardCopy.textContent = edition.deck || '';
    if (cardMeta) cardMeta.textContent = `${formatDate(`${edition.edition_date}T12:00:00+08:00`)} · FMB Brief`;
    feature.dataset.cmsHydrated = 'true';
  }

  function appendParagraphs(container, content) {
    const sections = Array.isArray(content?.sections) ? content.sections : [];
    for (const section of sections) {
      const block = el('section', 'cms-article-section');
      if (section.heading) block.appendChild(el('h2', '', section.heading));
      for (const paragraph of Array.isArray(section.paragraphs) ? section.paragraphs : []) {
        block.appendChild(el('p', '', paragraph));
      }
      container.appendChild(block);
    }
  }

  async function renderArticleReader() {
    const mount = document.querySelector('[data-cms-article]');
    if (!mount) return;

    const pathMatch = location.pathname.match(/\/news\/read\/([^/]+)\/?$/i);
    const slug = pathMatch?.[1] ? decodeURIComponent(pathMatch[1]) : new URLSearchParams(location.search).get('slug');
    if (!slug) {
      mount.replaceChildren(el('p', 'cms-error', 'No article was specified.'));
      return;
    }

    const fields = [
      'slug','title','kicker','deck','summary','body','category','region','author_line',
      'image_url','image_credit','published_at','updated_at','seo_title','seo_description',
      'content_json','sources_json','image_metadata','canonical_path'
    ].join(',');
    const rows = await get('news_articles', `select=${fields}&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`);
    const article = rows?.[0];
    if (!article) {
      mount.replaceChildren(el('p', 'cms-error', 'This article is not available.'));
      return;
    }

    document.title = article.seo_title || `${article.title} | FMB News`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', article.seo_description || article.deck || article.summary || 'FMB News');

    const wrapper = el('article', 'cms-article');
    const header = el('header', 'cms-article-header');
    header.appendChild(el('div', 'cms-kicker', article.kicker || [article.region, article.category].filter(Boolean).join(' · ') || 'FMB News'));
    header.appendChild(el('h1', '', article.title));
    if (article.deck || article.summary) header.appendChild(el('p', 'cms-deck', article.deck || article.summary));
    header.appendChild(el('div', 'cms-byline', `${article.author_line || 'FMB News Desk'} · ${formatDate(article.published_at)}`));
    wrapper.appendChild(header);

    if (article.image_url) {
      const figure = document.createElement('figure');
      const img = document.createElement('img');
      img.src = article.image_url;
      img.alt = article.image_metadata?.alt || article.title;
      img.decoding = 'async';
      figure.appendChild(img);
      const captionText = article.image_metadata?.caption || article.image_credit;
      if (captionText) figure.appendChild(el('figcaption', '', captionText));
      wrapper.appendChild(figure);
    }

    const body = el('div', 'cms-article-body');
    if (article.content_json && Array.isArray(article.content_json.sections)) {
      appendParagraphs(body, article.content_json);
    } else if (article.body) {
      for (const paragraph of article.body.split(/\n\s*\n/).filter(Boolean)) body.appendChild(el('p', '', paragraph));
    }
    wrapper.appendChild(body);

    const sources = Array.isArray(article.sources_json) ? article.sources_json : [];
    if (sources.length) {
      const sourceBox = el('aside', 'cms-sources');
      sourceBox.appendChild(el('h2', '', 'Sources'));
      const list = document.createElement('ul');
      for (const source of sources) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = source.url || '#';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = [source.publisher, source.title].filter(Boolean).join(' — ') || source.url || 'Source';
        item.appendChild(link);
        list.appendChild(item);
      }
      sourceBox.appendChild(list);
      wrapper.appendChild(sourceBox);
    }

    mount.replaceChildren(wrapper);
  }

  async function renderEdition(type) {
    const mount = document.querySelector('[data-cms-edition]');
    if (!mount || mount.dataset.cmsEdition !== type) return;
    const edition = await latestEdition(type);
    if (!edition) {
      mount.replaceChildren(el('p', 'cms-error', `No published ${type === 'worldwide' ? 'FMB Worldwide' : 'FMB Brief'} edition is available yet.`));
      return;
    }
    const entries = await editionEntries(edition.id);

    document.title = `${edition.title} | ${type === 'worldwide' ? 'FMB Worldwide' : 'FMB Brief'}`;
    const header = el('header', 'cms-edition-header');
    header.appendChild(el('div', 'cms-kicker', `${type === 'worldwide' ? 'FMB Worldwide' : 'FMB Brief'} · ${formatDate(`${edition.edition_date}T12:00:00+08:00`)}`));
    header.appendChild(el('h1', '', edition.title));
    if (edition.deck) header.appendChild(el('p', 'cms-deck', edition.deck));

    const wrapper = el('div', 'cms-edition');
    wrapper.appendChild(header);

    for (const entry of entries || []) {
      const article = el('article', 'cms-edition-entry');
      article.id = entry.entry_key;
      article.appendChild(el('div', 'cms-entry-meta', [entry.country || entry.section, entry.category].filter(Boolean).join(' · ')));
      article.appendChild(el('h2', '', entry.headline));
      if (entry.verified_fact) {
        const p = el('p', 'cms-fact', entry.verified_fact);
        p.prepend(el('strong', '', 'Verified: '));
        article.appendChild(p);
      }
      if (entry.why_it_matters) {
        const p = el('p', '', entry.why_it_matters);
        p.prepend(el('strong', '', 'Why it matters: '));
        article.appendChild(p);
      }
      if (entry.reputation_implication) {
        const p = el('p', '', entry.reputation_implication);
        p.prepend(el('strong', '', 'Reputation / communications: '));
        article.appendChild(p);
      }
      if (entry.opportunity_risk) {
        const p = el('p', '', entry.opportunity_risk);
        p.prepend(el('strong', '', 'Opportunity / risk: '));
        article.appendChild(p);
      }
      const sources = Array.isArray(entry.source_links) ? entry.source_links : [];
      if (sources.length) {
        const links = el('div', 'cms-entry-sources');
        for (const source of sources) {
          if (!source?.url) continue;
          const link = document.createElement('a');
          link.href = source.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = source.publisher || source.title || 'Source';
          links.appendChild(link);
        }
        article.appendChild(links);
      }
      wrapper.appendChild(article);
    }

    mount.replaceChildren(wrapper);
  }

  async function boot() {
    const tasks = [
      hydrateHomepageStories(),
      hydrateWorldwideLanding(),
      hydrateBriefFeature(),
      renderArticleReader(),
      renderEdition('worldwide'),
      renderEdition('brief')
    ];
    await Promise.allSettled(tasks);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
