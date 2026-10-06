const crypto = require('node:crypto');

const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const countScript = "redis.call('PFADD', KEYS[1], ARGV[1]) if redis.call('TTL', KEYS[1]) < 0 then redis.call('EXPIRE', KEYS[1], 172800) end return redis.call('PFCOUNT', KEYS[1])";

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

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }
  if (!redisUrl() || !redisToken()) return res.status(503).json({ error: 'Contador no disponible' });

  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  const key = `super-milei-bros:visitors:${day}`;
  try {
    if (req.method === 'GET') return res.status(200).json({ day, visitors: Number(await redis(['PFCOUNT', key])) });
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    if (!ip) return res.status(400).json({ error: 'No se pudo registrar la visita' });
    const agent = String(req.headers['user-agent'] || '').slice(0, 256);
    const secret = process.env.VISITOR_HASH_SECRET || redisToken();
    const digest = crypto.createHmac('sha256', secret).update(`${day}:${ip}:${agent}`).digest('hex');
    const visitors = Number(await redis(['EVAL', countScript, 1, key, digest]));
    return res.status(200).json({ day, visitors });
  } catch {
    return res.status(503).json({ error: 'Contador no disponible' });
  }
};
