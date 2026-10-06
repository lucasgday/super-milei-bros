const crypto = require('node:crypto');

const paymentMode = () => process.env.MP_VOTES_MODE === 'test' ? 'test' : process.env.MP_VOTES_MODE === 'live' ? 'live' : 'off';
const paymentSecret = () => paymentMode() === 'test' ? process.env.MP_WEBHOOK_SECRET_TEST : process.env.MP_WEBHOOK_SECRET;
const accessToken = () => paymentMode() === 'test' ? process.env.MP_ACCESS_TOKEN_TEST : process.env.MP_ACCESS_TOKEN;
const paidVotesKey = () => `super-milei-bros:ideas:paid-votes-${paymentMode() === 'test' ? 'test-' : ''}v1`;
const paymentKey = id => `super-milei-bros:ideas:payment:${paymentMode() === 'test' ? 'test:' : ''}${id}`;
const voteAmount = 1000;
const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const enabled = () => process.env.MP_VOTES_ENABLED === 'true' && paymentMode() !== 'off'
  && Boolean(redisUrl() && redisToken() && accessToken() && paymentSecret());

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

function createReference(ideaId) {
  const nonce = crypto.randomBytes(12).toString('hex');
  const body = `${ideaId}:${nonce}`;
  const mac = crypto.createHmac('sha256', paymentSecret()).update(body).digest('hex');
  return `smb-v1:${body}:${mac}`;
}

function ideaFromReference(reference, ideas) {
  const match = /^smb-v1:([a-z0-9-]+):([a-f0-9]{24}):([a-f0-9]{64})$/.exec(String(reference || ''));
  if (!match) return null;
  const [, ideaId, nonce, signature] = match;
  const expected = crypto.createHmac('sha256', paymentSecret()).update(`${ideaId}:${nonce}`).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) return null;
  return ideas.find(idea => idea.id === ideaId) || null;
}

function validWebhookSignature(signature, requestId, dataId, secret = paymentSecret()) {
  if (typeof signature !== 'string' || typeof requestId !== 'string' || !/^[0-9]+$/.test(String(dataId || '')) || !secret) return false;
  const fields = Object.fromEntries(signature.split(',').map(part => part.trim().split('=')));
  if (!/^[0-9]+$/.test(fields.ts || '') || !/^[a-f0-9]{64}$/i.test(fields.v1 || '')) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${fields.ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest();
  return crypto.timingSafeEqual(Buffer.from(fields.v1, 'hex'), expected);
}

module.exports = { paidVotesKey, paymentKey, paymentMode, paymentSecret, accessToken, voteAmount, redis, enabled, createReference, ideaFromReference, validWebhookSignature };
