const crypto = require('node:crypto');

const ideas = require('../ideas.json');
const { paidVotesKey, paymentMode, enabled: paidVotesEnabled } = require('../lib/vote-payments');

const pendingKey = 'super-milei-bros:ideas:pending-v1';
const suggestScript = "local count = redis.call('INCR', KEYS[1]) if count == 1 then redis.call('EXPIRE', KEYS[1], 86400) end if count > 2 then return 0 end redis.call('RPUSH', KEYS[2], ARGV[1]) return 1";
const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function redis(command) {
  const response = await fetch(redisUrl(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${redisToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error('Storage unavailable');
  const data = await response.json();
  if (data.error) throw new Error('Storage unavailable');
  return data.result;
}

function visitorDigest(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0];
  return crypto.createHmac('sha256', redisToken()).update(ip).digest('hex');
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const available = Boolean(redisUrl() && redisToken());

  try {
    if (req.method === 'GET') {
      if (!available) return res.status(200).json({ ideas: ideas.map(idea => ({ ...idea, votes: 0 })), available: false, paymentEnabled: false });
      const counts = await redis(['HMGET', paidVotesKey(), ...ideas.map(idea => idea.id)]);
      return res.status(200).json({
        ideas: ideas.map((idea, index) => ({ ...idea, votes: Number(counts[index] || 0) })),
        available: true,
        paymentEnabled: paidVotesEnabled(),
        paymentMode: paidVotesEnabled() ? paymentMode() : 'off',
      });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Método no permitido' });
    }
    if (!available) return res.status(503).json({ error: 'Las propuestas no están disponibles ahora.' });

    const digest = visitorDigest(req);
    if (req.body?.action === 'vote') {
      return res.status(410).json({ error: 'Los votos gratuitos terminaron. Elegí la propuesta para apoyar con Mercado Pago.' });
    }

    if (req.body?.action === 'suggest') {
      const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
      const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
      if (title.length < 6 || title.length > 80 || /[\r\n\x00-\x1f]/.test(title)
        || description.length < 20 || description.length > 500 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(description)) {
        return res.status(400).json({ error: 'Escribí un título y una descripción breves.' });
      }
      const rateKey = `super-milei-bros:ideas:suggest-rate:${digest}`;
      const suggestion = JSON.stringify({ id: crypto.randomUUID(), title, description, submittedAt: new Date().toISOString() });
      const accepted = await redis(['EVAL', suggestScript, 2, rateKey, pendingKey, suggestion]);
      if (!accepted) return res.status(429).json({ error: 'Límite de propuestas por hoy. Volvé mañana.' });
      return res.status(202).json({ ok: true, message: 'Propuesta recibida. Se revisará antes de publicarse.' });
    }

    return res.status(400).json({ error: 'Acción inválida.' });
  } catch {
    return res.status(503).json({ error: 'Las propuestas no están disponibles ahora.' });
  }
};
