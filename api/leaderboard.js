const crypto = require('node:crypto');

const rankingKey = 'super-milei-bros:global:ranking-v1';
const legacyKeyFor = level => `super-milei-bros:level-${level}:ranking-v1`;
const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function redis(command) {
  const response = await fetch(redisUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error('Storage unavailable');
  const data = await response.json();
  if (data.error) throw new Error('Storage unavailable');
  return data.result;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!redisUrl() || !redisToken()) {
    return res.status(503).json({ error: 'Ranking no configurado' });
  }

  try {
    if (req.method === 'GET') {
      const ranking = [];
      for (const [key, level] of [[rankingKey, null], [legacyKeyFor(1), 1], [legacyKeyFor(2), 2]]) {
        const rows = await redis(['ZREVRANGE', key, 0, 9, 'WITHSCORES']);
        for (let i = 0; i < rows.length; i += 2) {
          const entry = JSON.parse(rows[i]);
          ranking.push({ alias: entry.alias, score: Number(rows[i + 1]), level: entry.level || level });
        }
      }
      ranking.sort((a, b) => b.score - a.score);
      return res.status(200).json({ ranking: ranking.slice(0, 10) });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const { alias, score, level = 1 } = req.body || {};
    const name = typeof alias === 'string' ? alias.trim().replace(/\s+/g, ' ') : '';
    if (!/^[\p{L}\p{N} _-]{2,18}$/u.test(name) || !Number.isInteger(score) || score < 0 || score > 10000 || (level !== 1 && level !== 2)) {
      return res.status(400).json({ error: 'Alias o puntaje inválido' });
    }

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0];
    const digest = crypto.createHmac('sha256', redisToken()).update(ip).digest('hex');
    const rateKey = `super-milei-bros:submissions:${digest}`;
    const count = Number(await redis(['INCR', rateKey]));
    if (count === 1) await redis(['EXPIRE', rateKey, 3600]);
    if (count > 5) return res.status(429).json({ error: 'Demasiados intentos. Probá más tarde.' });

    await redis(['ZADD', rankingKey, score, JSON.stringify({ alias: name, level, id: crypto.randomUUID() })]);
    return res.status(201).json({ ok: true });
  } catch {
    return res.status(503).json({ error: 'El ranking no está disponible ahora.' });
  }
};
