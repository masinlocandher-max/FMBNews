(() => {
  'use strict';
  const SUPABASE_URL = 'https://wjnavdpppnhxbuydkrkd.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_bpdFntTHbHmxsG4L0PtcCw_5dJ8gpr8';
  const API = `${SUPABASE_URL}/rest/v1`;
  const mount = document.querySelector('[data-cms-article]');
  if (!mount) return;

  const pathMatch = location.pathname.match(/\/news\/read\/([^/]+)\/?$/i);
  const slug = pathMatch?.[1] ? decodeURIComponent(pathMatch[1]) : new URLSearchParams(location.search).get('slug');
  if (!slug) return;

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  };

  const insertCallout = (continuation) => {
    const article = mount.querySelector('.cms-article');
    if (!article || article.querySelector('.cms-continuation')) return Boolean(article);
    if (!continuation?.url || !continuation?.title) return true;

    const aside = document.createElement('aside');
    aside.className = 'cms-continuation';
    aside.style.cssText = 'margin:1.2rem 0 1.5rem;padding:18px 20px;border:1px solid rgba(207,162,255,.42);border-radius:18px;background:linear-gradient(135deg,rgba(30,7,48,.96),rgba(76,17,120,.92));color:#fff;box-shadow:0 18px 45px rgba(33,8,53,.18);display:grid;grid-template-columns:44px 1fr;gap:14px;align-items:start';

    const icon = document.createElement('img');
    icon.src = '/assets/images/icon-transparent.png';
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
    icon.style.cssText = 'width:44px;height:44px;object-fit:contain;filter:drop-shadow(0 6px 12px rgba(0,0,0,.28))';

    const content = document.createElement('div');
    const label = document.createElement('div');
    label.textContent = 'CONTINUES FROM';
    label.style.cssText = 'font:800 11px/1.2 Arial,sans-serif;letter-spacing:.18em;color:#dcbcff;margin-bottom:7px';

    const link = document.createElement('a');
    link.href = continuation.url;
    link.textContent = continuation.title;
    link.style.cssText = 'color:#fff;text-decoration:underline;text-decoration-color:#c894ff;text-underline-offset:4px;font:700 17px/1.35 Georgia,serif';

    content.appendChild(label);
    content.appendChild(link);

    if (continuation.originalPublishedAt) {
      const meta = document.createElement('div');
      meta.textContent = `First report: ${formatDate(continuation.originalPublishedAt)}`;
      meta.style.cssText = 'margin-top:6px;font:600 12px/1.4 Arial,sans-serif;color:#d9c8e5';
      content.appendChild(meta);
    }

    if (continuation.whatChanged) {
      const changed = document.createElement('p');
      changed.textContent = `What changed: ${continuation.whatChanged}`;
      changed.style.cssText = 'margin:10px 0 0;font:500 14px/1.55 Arial,sans-serif;color:#f3eafa';
      content.appendChild(changed);
    }

    aside.append(icon, content);
    const header = article.querySelector('.cms-article-header');
    if (header?.nextSibling) article.insertBefore(aside, header.nextSibling);
    else article.appendChild(aside);
    return true;
  };

  fetch(`${API}/news_articles?select=content_json&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Accept: 'application/json' }
  })
    .then((response) => response.ok ? response.json() : [])
    .then((rows) => {
      const continuation = rows?.[0]?.content_json?.continuation;
      if (!continuation) return;
      if (insertCallout(continuation)) return;
      const observer = new MutationObserver(() => {
        if (insertCallout(continuation)) observer.disconnect();
      });
      observer.observe(mount, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 8000);
    })
    .catch(() => {});
})();