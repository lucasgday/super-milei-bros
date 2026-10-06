const crypto = require('node:crypto');
const ideas = require('../ideas.json');
const { redis, enabled, voteAmount, createReference } = require('./lib/vote-payments');

const rateScript = "local count = redis.call('INCR', KEYS[1]) if count == 1 then redis.call('EXPIRE', KEYS[1], 3600) end return count";

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  if (!enabled()) return res.status(503).json({ error: 'Los votos pagos todavía no están disponibles.' });
  const idea = ideas.find(item => item.id === req.body?.id);
  if (!idea) return res.status(400).json({ error: 'Propuesta inválida.' });

  try {
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0];
    const digest = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(ip).digest('hex');
    const requests = Number(await redis(['EVAL', rateScript, 1, `super-milei-bros:ideas:checkout-rate:${digest}`]));
    if (requests > 8) return res.status(429).json({ error: 'Esperá un rato antes de iniciar otro pago.' });

    const site = new URL(process.env.MP_RETURN_URL || 'https://super-milei-bros.vercel.app/');
    if (site.protocol !== 'https:') throw new Error('Invalid return URL');
    const backUrl = new URL('/', site);
    const preference = {
      items: [{ id: `idea-${idea.id}`, title: `Voto para ${idea.title}`, currency_id: 'ARS', quantity: 1, unit_price: voteAmount }],
      external_reference: createReference(idea.id),
      back_urls: Object.fromEntries(['success', 'pending', 'failure'].map(status => {
        const url = new URL(backUrl);
        url.searchParams.set('vote', status);
        return [status, url.href];
      })),
      auto_return: 'approved',
    };
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify(preference),
    });
    if (!response.ok) throw new Error('Preference unavailable');
    const checkout = await response.json();
    const url = new URL(checkout.init_point);
    if (url.protocol !== 'https:' || !/^(?:www\.)?mercadopago\.com(?:\.ar)?$/.test(url.hostname)) throw new Error('Invalid checkout URL');
    return res.status(200).json({ url: url.href });
  } catch {
    return res.status(503).json({ error: 'No pudimos iniciar el pago. Probá más tarde.' });
  }
};
