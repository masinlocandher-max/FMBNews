export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isNewsPath = url.pathname === '/news' || url.pathname.startsWith('/news/');

    // The route pattern intentionally catches /news* so query strings on /news
    // are included. Anything outside the actual /news path boundary is passed
    // straight through to the existing origin.
    if (!isNewsPath) return fetch(request);

    // Keep one canonical hostname for the newsroom.
    if (url.hostname === 'francinemariebautista.com') {
      url.hostname = 'www.francinemariebautista.com';
      return Response.redirect(url.toString(), 308);
    }

    // CMS article URLs remain clean while the static reader receives the slug.
    const readerMatch = url.pathname.match(/^\/news\/read\/([^/]+)\/?$/);
    if (readerMatch) {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = '/news/read/index.html';
      assetUrl.searchParams.set('slug', decodeURIComponent(readerMatch[1]));
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }

    return env.ASSETS.fetch(request);
  },
};
