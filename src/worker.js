function withWorkerMarker(response) {
  const headers = new Headers(response.headers);
  headers.set('X-FMB-News-Worker', 'fmb-news');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function serveAsset(request, env, pathname, searchParams) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = pathname;
  if (searchParams) assetUrl.search = searchParams.toString();
  const response = await env.ASSETS.fetch(new Request(assetUrl, request));
  return withWorkerMarker(response);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isNewsPath = url.pathname === '/news' || url.pathname.startsWith('/news/');
    const isLegacyNewsPath = url.pathname === '/fmbnews' || url.pathname.startsWith('/fmbnews/');

    // FMBNews owns both the canonical newsroom and its legacy /fmbnews aliases.
    // No other application should render or redirect these paths.
    if (!isNewsPath && !isLegacyNewsPath) return fetch(request);

    // Legacy FMB News URLs canonicalize here, inside the canonical FMBNews Worker.
    if (isLegacyNewsPath) {
      const suffix = url.pathname.slice('/fmbnews'.length);
      url.hostname = 'www.francinemariebautista.com';
      url.pathname = `/news${suffix || '/'}`;
      const response = Response.redirect(url.toString(), 308);
      return withWorkerMarker(response);
    }

    // Keep one canonical hostname for the newsroom.
    if (url.hostname === 'francinemariebautista.com') {
      url.hostname = 'www.francinemariebautista.com';
      const response = Response.redirect(url.toString(), 308);
      return withWorkerMarker(response);
    }

    // Canonicalize the newsroom root.
    if (url.pathname === '/news') {
      url.pathname = '/news/';
      const response = Response.redirect(url.toString(), 308);
      return withWorkerMarker(response);
    }

    // CMS article URLs remain clean while the static reader receives the slug.
    const readerMatch = url.pathname.match(/^\/news\/read\/([^/]+)\/?$/);
    if (readerMatch) {
      const params = new URLSearchParams(url.searchParams);
      params.set('slug', decodeURIComponent(readerMatch[1]));
      return serveAsset(request, env, '/news/read/index.html', params);
    }

    // FMB News is a static-site snapshot enhanced by the live Supabase CMS.
    // Resolve clean directory URLs explicitly so deployment does not depend on
    // platform-specific automatic index-file handling.
    let assetPath = url.pathname;
    const lastSegment = assetPath.split('/').filter(Boolean).at(-1) || '';
    const hasExtension = lastSegment.includes('.');

    if (assetPath.endsWith('/')) {
      assetPath += 'index.html';
    } else if (!hasExtension) {
      assetPath += '/index.html';
    }

    return serveAsset(request, env, assetPath, url.searchParams);
  },
};
