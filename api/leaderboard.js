const crypto = require('node:crypto');

const KEY = 'super-milei-bros:level-1:ranking-v1';

async function redis(command) {
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
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
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return res.status(503).json({ error: 'Ranking no configurado' });
  }

  try {
    if (req.method === 'GET') {
      const rows = await redis(['ZREVRANGE', KEY, 0, 9, 'WITHSCORES']);
      const ranking = [];
      for (let i = 0; i < rows.length; i += 2) {
        const entry = JSON.parse(rows[i]);
        ranking.push({ alias: entry.alias, score: Number(rows[i + 1]) });
      }
      return res.status(200).json({ ranking });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const { alias, score } = req.body || {};
    const name = typeof alias === 'string' ? alias.trim().replace(/\s+/g, ' ') : '';
    if (!/^[\p{L}\p{N} _-]{2,18}$/u.test(name) || !Number.isInteger(score) || score < 500 || score > 10000) {
      return res.status(400).json({ error: 'Alias o puntaje inválido' });
    }

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0];
    const digest = crypto.createHmac('sha256', process.env.UPSTASH_REDIS_REST_TOKEN).update(ip).digest('hex');
    const rateKey = `super-milei-bros:submissions:${digest}`;
    const count = Number(await redis(['INCR', rateKey]));
    if (count === 1) await redis(['EXPIRE', rateKey, 3600]);
    if (count > 5) return res.status(429).json({ error: 'Demasiados intentos. Probá más tarde.' });

    await redis(['ZADD', KEY, score, JSON.stringify({ alias: name, id: crypto.randomUUID() })]);
    return res.status(201).json({ ok: true });
  } catch {
    return res.status(503).json({ error: 'El ranking no está disponible ahora.' });
  }
};
