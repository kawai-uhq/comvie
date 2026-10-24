// Vercel serverless function: posts a "server not working" report to the team's Discord channel.
// Needs REPORT_WEBHOOK_URL (a Discord channel webhook URL).
// Optional: DISCORD_BOT_TOKEN. With it, every report also gets its own thread, and whatever the team writes
// in that thread is shown to the person who sent the report (see api/report-status.js).
const SERVERS = ['Server 1', 'Server 2', 'Server 3'];
const ISSUES = ["Won't load", 'No sound', 'Wrong video', 'Keeps buffering', 'Subtitles problem', 'Something else'];
const hits = new Map(); // ip -> [timestamps]; best-effort limit per warm instance

const clean = (v, max) =>
  String(v ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/@/g, '@​')
    .trim()
    .slice(0, max);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const hook = process.env.REPORT_WEBHOOK_URL;
  if (!hook) return res.status(503).json({ error: "Reporting isn't set up yet." });

  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= 5) return res.status(429).json({ error: 'Too many reports. Please try again in a few minutes.' });
  hits.set(ip, [...recent, now]);

  let b = req.body;
  if (typeof b === 'string') {
    try {
      b = JSON.parse(b);
    } catch {
      b = null;
    }
  }
  if (!b || typeof b !== 'object') return res.status(400).json({ error: 'Bad request.' });

  const type = b.type === 'tv' ? 'tv' : 'movie';
  const id = Number(b.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Bad request.' });
  const server = SERVERS.includes(b.server) ? b.server : 'Unknown';
  const issue = ISSUES.includes(b.issue) ? b.issue : 'Something else';
  const season = Number.isInteger(b.season) && b.season > 0 ? b.season : null;
  const episode = Number.isInteger(b.episode) && b.episode > 0 ? b.episode : null;
  const reportId = Math.random().toString(36).slice(2, 8).toUpperCase();
  const origin = `https://${req.headers.host}`;
  const link = `${origin}/watch/${type}/${id}${type === 'tv' ? `?s=${season ?? 1}&e=${episode ?? 1}` : ''}`;

  const fields = [
    { name: 'Title', value: clean(b.title, 200) || `${type} ${id}`, inline: false },
    { name: 'Server', value: server, inline: true },
    { name: 'Issue', value: issue, inline: true },
    ...(type === 'tv' ? [{ name: 'Episode', value: `S${season ?? 1} · E${episode ?? 1}`, inline: true }] : []),
    { name: 'Open it', value: link, inline: false }
  ];
  const note = clean(b.note, 300);
  if (note) fields.push({ name: 'Note', value: note, inline: false });

  try {
    const url = new URL(hook);
    url.searchParams.set('wait', 'true');
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Comvie reports',
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: `Server report #${reportId}`,
            color: 0xff6b57,
            fields,
            footer: { text: `Reporter ${clean(b.rid, 12) || 'anon'}` },
            description: 'Reply in the thread under this message. The reporter will see your reply on Comvie.',
            timestamp: new Date().toISOString()
          }
        ]
      })
    });
    if (!r.ok) return res.status(502).json({ error: "Couldn't deliver the report. Try again later." });
    const msg = await r.json().catch(() => null);

    let ref;
    const token = process.env.DISCORD_BOT_TOKEN;
    if (token && msg?.id && msg?.channel_id) {
      try {
        const t = await fetch(`https://discord.com/api/v10/channels/${msg.channel_id}/messages/${msg.id}/threads`, {
          method: 'POST',
          headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'DiscordBot (comvie, 1.0)' },
          body: JSON.stringify({ name: `Report #${reportId} - ${clean(b.title, 60) || type}`.slice(0, 100), auto_archive_duration: 10080 })
        });
        if (t.ok) ref = msg.id;
      } catch {
        /* the report is already delivered; replies just won't be available */
      }
    }
    return res.status(200).json({ id: reportId, ref });
  } catch {
    return res.status(502).json({ error: "Couldn't deliver the report. Try again later." });
  }
}
