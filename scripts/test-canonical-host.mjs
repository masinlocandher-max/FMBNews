import assert from 'node:assert/strict';
import worker from '../src/worker.js';

const canonical = 'https://francinemariebautista.com';
const alias = 'https://www.francinemariebautista.com';
const query = '?source=host-audit&next=%2Fnews%2F&x=1&x=2';
const assets = {
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === '/news/sitemap.xml') {
      return new Response(`<?xml version="1.0"?><urlset><url><loc>${canonical}/news/</loc></url></urlset>`);
    }
    return new Response('News asset');
  },
};
const env = { ASSETS: assets };
for (const origin of [alias, alias.replace('https:', 'http:'), canonical.replace('https:', 'http:')]) {
  for (const path of ['/news/', '/news/a%20story/', '/news/sitemap.xml', '/news/assets/example.css']) {
    const result = await worker.fetch(new Request(origin + path + query), env);
    assert.equal(result.status, 308);
    assert.equal(result.headers.get('Location'), canonical + path + query);
  }
}
const home = await worker.fetch(new Request(canonical + '/news/'), env);
assert.equal(home.status, 200);
assert.equal(home.headers.get('X-FMB-News-Worker'), 'fmb-news');
const legacyReader = await worker.fetch(new Request(canonical + '/news/read/test-story/' + query), env);
assert.equal(legacyReader.headers.get('Location'), canonical + '/news/test-story/' + query);

const originalFetch = globalThis.fetch;
globalThis.fetch = async () => Response.json([{
  slug: 'test-story',
  title: 'Test story',
  canonical_path: alias + '/news/test-story/',
  published_at: new Date().toISOString(),
}]);
try {
  for (const path of ['/news/sitemap.xml', '/news/news-sitemap.xml', '/news/feed.xml']) {
    const response = await worker.fetch(new Request(canonical + path), env);
    assert.equal(response.status, 200);
    const xml = await response.text();
    assert.ok(xml.includes(canonical + '/news/test-story/'));
    assert.ok(!xml.includes(alias));
  }
} finally {
  globalThis.fetch = originalFetch;
}
console.log('Newsroom canonical redirects, query retention, CMS sitemaps and feed verified.');
