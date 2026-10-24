// Vercel serverless function: returns what the team replied (in the report's Discord thread) to ONE report.
// Needs REPORT_WEBHOOK_URL and DISCORD_BOT_TOKEN. The bot needs: View Channel, Read Message History,
// and the "Message Content Intent" switched on in the Discord developer portal.
const API = 'https://discord.com/api/v10';
let channelId = null;

const discord = (path, token) =>
  fetch(`${API}${path}`, { headers: { Authorization: `Bot ${token}`, 'User-Agent': 'DiscordBot (comvie, 1.0)' } });

const tidy = (text) =>
  String(text ?? '')
    .replace(/<@[!&]?\d+>/g, '')
    .replace(/<#\d+>/g, '')
    .replace(/@(everyone|here)/g, '')
    .trim()
    .slice(0, 1000);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const hook = process.env.REPORT_WEBHOOK_URL;
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!hook || !token) return res.status(200).json({ replies: [] });

  const ref = String(req.query.ref || '');
  const rid = String(req.query.rid || '');
  if (!/^\d{15,22}$/.test(ref) || !/^[a-z0-9]{4,12}$/i.test(rid)) return res.status(400).json({ error: 'Bad request.' });

  try {
    if (!channelId) {
      const w = await fetch(hook);
      channelId = w.ok ? (await w.json()).channel_id : null;
    }
    if (!channelId) return res.status(200).json({ replies: [] });

    // Only the person who sent the report may read the answers: the report message carries their ID.
    const starter = await discord(`/channels/${channelId}/messages/${ref}`, token);
    if (!starter.ok) return res.status(200).json({ replies: [] });
    const first = await starter.json();
    const footer = first?.embeds?.[0]?.footer?.text ?? '';
    if (footer !== `Reporter ${rid}`) return res.status(200).json({ replies: [] });

    // A thread started from a message has the same ID as that message.
    const thread = await discord(`/channels/${ref}/messages?limit=50`, token);
    if (!thread.ok) return res.status(200).json({ replies: [] });
    const msgs = await thread.json();
    const replies = msgs
      .filter((m) => !m.author?.bot && (m.type === 0 || m.type === 19) && tidy(m.content))
      .reverse()
      .map((m) => ({ text: tidy(m.content), at: m.timestamp }));
    return res.status(200).json({ replies });
  } catch {
    return res.status(200).json({ replies: [] });
  }
}
