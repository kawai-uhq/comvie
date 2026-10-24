// Serves the normal app page for /title/... and /watch/... but with the title's own name, text and
// picture in the link-preview tags, so a shared link looks right in Discord, WhatsApp, Telegram, etc.
// People still get the full app: the page is the same index.html, only the <head> tags change.
const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export default async function handler(req, res) {
  const type = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type;
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `https://${host}`;

  let html;
  try {
    const r = await fetch(`${origin}/index.html`);
    html = await r.text();
  } catch {
    return res.status(502).send('Please try again.');
  }

  const send = (body, cache) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', cache);
    return res.status(200).send(body);
  };

  const token = process.env.TMDB_TOKEN;
  if (!token || !/^(movie|tv)$/.test(type || '') || !/^\d{1,9}$/.test(id || '')) {
    return send(html, 'public, s-maxage=300');
  }

  try {
    const r = await fetch(`https://api.themoviedb.org/3/${type}/${id}?language=en-US`, {
      headers: { Authorization: `Bearer ${token}`, accept: 'application/json' }
    });
    if (!r.ok) return send(html, 'public, s-maxage=300');
    const j = await r.json();
    const title = (type === 'movie' ? j.title : j.name) || 'Comvie';
    const date = (type === 'movie' ? j.release_date : j.first_air_date) || '';
    const year = date.slice(0, 4);
    const rating = j.vote_average ? `★ ${Number(j.vote_average).toFixed(1)}` : '';
    const heading = `${title}${year ? ` (${year})` : ''} - Watch on Comvie`;
    const lead = [type === 'tv' ? 'TV series' : 'Movie', rating].filter(Boolean).join(' · ');
    let overview = String(j.overview || '').replace(/\s+/g, ' ').trim();
    if (overview.length > 220) overview = overview.slice(0, 217).trimEnd() + '...';
    const desc = overview ? `${lead} - ${overview}` : lead;
    const pic = j.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${j.backdrop_path}`
      : j.poster_path
        ? `https://image.tmdb.org/t/p/w500${j.poster_path}`
        : `${origin}/og.png?v=4`;
    const url = `${origin}/title/${type}/${id}`;

    const tags = [
      `<meta property="og:site_name" content="Comvie" />`,
      `<meta property="og:type" content="video.${type === 'tv' ? 'tv_show' : 'movie'}" />`,
      `<meta property="og:title" content="${esc(heading)}" />`,
      `<meta property="og:description" content="${esc(desc)}" />`,
      `<meta property="og:image" content="${esc(pic)}" />`,
      `<meta property="og:url" content="${esc(url)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${esc(heading)}" />`,
      `<meta name="twitter:description" content="${esc(desc)}" />`,
      `<meta name="twitter:image" content="${esc(pic)}" />`,
      `<meta name="description" content="${esc(desc)}" />`
    ].join('\n    ');

    // drop the generic tags, then add this title's own
    const out = html
      .replace(/\s*<meta\s+(?:property="og:[^"]*"|name="twitter:[^"]*"|name="description")[^>]*>/g, '')
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(heading)}</title>`)
      .replace('</head>', `    ${tags}\n  </head>`);
    return send(out, 'public, s-maxage=3600, stale-while-revalidate=86400');
  } catch {
    return send(html, 'public, s-maxage=300');
  }
}
