const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { test } = require('node:test');

process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.invalid';
process.env.UPSTASH_REDIS_REST_TOKEN = 'redis-test-token';
process.env.MP_ACCESS_TOKEN = 'mp-test-token';
process.env.MP_WEBHOOK_SECRET = 'webhook-test-secret';
process.env.MP_VOTES_ENABLED = 'true';

const checkout = require('../api/paid-votes');
const webhook = require('../api/mp-webhook');
const { createReference, validWebhookSignature } = require('../lib/vote-payments');

function response() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

function signedRequest(id) {
  const ts = '1704908010';
  const requestId = 'test-request';
  const signature = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET)
    .update(`id:${id};request-id:${requestId};ts:${ts};`).digest('hex');
  return {
    method: 'POST',
    query: { 'data.id': String(id) },
    headers: { 'x-signature': `ts=${ts},v1=${signature}`, 'x-request-id': requestId },
    body: { type: 'payment', data: { id: String(id) } },
  };
}

test('checkout uses a server-priced preference and refuses unknown ideas', async () => {
  const originalFetch = global.fetch;
  let preference;
  global.fetch = async (url, options) => {
    if (String(url).includes('redis.example')) return { ok: true, json: async () => ({ result: 1 }) };
    assert.equal(url, 'https://api.mercadopago.com/checkout/preferences');
    preference = JSON.parse(options.body);
    return { ok: true, json: async () => ({ init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect/test' }) };
  };
  try {
    const invalid = response();
    await checkout({ method: 'POST', body: { id: 'inventada' }, headers: {}, socket: {} }, invalid);
    assert.equal(invalid.statusCode, 400);
    const result = response();
    await checkout({ method: 'POST', body: { id: 'atlantico-sur', price: 1 }, headers: {}, socket: {} }, result);
    assert.equal(result.statusCode, 200);
    assert.equal(preference.items[0].unit_price, 1000);
    assert.equal(preference.items[0].currency_id, 'ARS');
    assert.match(preference.external_reference, /^smb-v1:atlantico-sur:/);
    assert.equal(result.body.url, 'https://www.mercadopago.com.ar/checkout/v1/redirect/test');
  } finally { global.fetch = originalFetch; }
});

test('webhook counts approved payments once, rejects forgery, and reverses refunds', async () => {
  const originalFetch = global.fetch;
  const reference = createReference('atlantico-sur');
  const payment = { id: 12345, external_reference: reference, status: 'approved', currency_id: 'ARS', transaction_amount: 1000 };
  let votes = 0;
  let counted = false;
  let paymentFetches = 0;
  global.fetch = async (url, options) => {
    if (String(url).includes('api.mercadopago.com')) {
      paymentFetches++;
      return { ok: true, json: async () => payment };
    }
    const command = JSON.parse(options.body);
    assert.equal(command[0], 'EVAL');
    const approved = command.at(-1) === '1';
    if (approved && !counted) { votes++; counted = true; }
    if (!approved && counted) { votes--; counted = false; }
    return { ok: true, json: async () => ({ result: votes }) };
  };
  try {
    const forged = signedRequest(12345);
    forged.headers['x-signature'] = 'ts=1704908010,v1=' + '0'.repeat(64);
    const rejected = response();
    await webhook(forged, rejected);
    assert.equal(rejected.statusCode, 401);
    assert.equal(paymentFetches, 0);

    for (let i = 0; i < 2; i++) {
      const accepted = response();
      await webhook(signedRequest(12345), accepted);
      assert.equal(accepted.statusCode, 200);
    }
    assert.equal(votes, 1);

    payment.transaction_amount = 999;
    const wrongAmount = response();
    await webhook(signedRequest(12345), wrongAmount);
    assert.equal(wrongAmount.statusCode, 200);
    assert.equal(votes, 1);

    payment.transaction_amount = 1000;
    payment.status = 'refunded';
    const refund = response();
    await webhook(signedRequest(12345), refund);
    assert.equal(refund.statusCode, 200);
    assert.equal(votes, 0);
    assert.equal(validWebhookSignature('ts=1,v1=' + '0'.repeat(64), 'x', '12345'), false);
  } finally { global.fetch = originalFetch; }
});
