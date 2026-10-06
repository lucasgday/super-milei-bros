const ideas = require('../ideas.json');
const { redis, enabled, paidVotesKey, paymentKey, accessToken, voteAmount, ideaFromReference, validWebhookSignature } = require('../lib/vote-payments');

const applyPaymentScript = `
local idea = redis.call('HGET', KEYS[1], 'idea')
if idea and idea ~= ARGV[1] then return -2 end
local counted = redis.call('HGET', KEYS[1], 'counted') == '1'
local approved = ARGV[2] == '1'
if not idea then redis.call('HSET', KEYS[1], 'idea', ARGV[1]) end
if approved and not counted then
  redis.call('HSET', KEYS[1], 'counted', '1')
  return redis.call('HINCRBY', KEYS[2], ARGV[1], 1)
end
if not approved and counted then
  redis.call('HSET', KEYS[1], 'counted', '0')
  return redis.call('HINCRBY', KEYS[2], ARGV[1], -1)
end
return 0`;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (!enabled()) return res.status(503).end();
  const dataId = req.query?.['data.id'];
  if (!validWebhookSignature(req.headers['x-signature'], req.headers['x-request-id'], dataId)) return res.status(401).end();
  if (req.body?.type !== 'payment' || String(req.body?.data?.id) !== String(dataId)) return res.status(200).end();

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${accessToken()}` },
    });
    if (!response.ok) throw new Error('Payment unavailable');
    const payment = await response.json();
    const idea = ideaFromReference(payment.external_reference, ideas);
    if (String(payment.id) !== String(dataId) || !idea || payment.currency_id !== 'ARS'
      || Number(payment.transaction_amount) !== voteAmount) return res.status(200).end();
    const approved = payment.status === 'approved' && Number(payment.transaction_amount_refunded || 0) === 0;
    await redis(['EVAL', applyPaymentScript, 2, paymentKey(dataId), paidVotesKey(), idea.id, approved ? '1' : '0']);
    return res.status(200).end();
  } catch {
    return res.status(503).end();
  }
};
