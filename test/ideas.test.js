const assert = require('node:assert/strict');
const { test } = require('node:test');

process.env.UPSTASH_REDIS_REST_URL = 'https://example.invalid';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
const handler = require('../api/ideas');

function response() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

const request = body => ({ method: 'POST', body, headers: { 'x-forwarded-for': '198.51.100.1' }, socket: {} });

test('lists curated ideas, disables free votes, and holds suggestions for review', async () => {
  const counts = new Map();
  const pending = [];
  let suggestions = 0;
  const originalFetch = global.fetch;
  global.fetch = async (_url, options) => {
    const [command, ...args] = JSON.parse(options.body);
    let result;
    if (command === 'HMGET') result = args.slice(1).map(id => counts.get(id) || null);
    if (command === 'EVAL' && args[2].includes(':suggest-rate:')) {
      suggestions++;
      result = suggestions <= 2 ? 1 : 0;
      if (result) pending.push(JSON.parse(args[4]));
    }
    return { ok: true, json: async () => ({ result }) };
  };
  try {
    const listed = response();
    await handler({ method: 'GET', headers: {}, socket: {} }, listed);
    assert.equal(listed.statusCode, 200);
    assert.equal(listed.body.ideas.length, 3);
    assert.equal(listed.body.ideas[0].votes, 0);
    assert.equal(listed.body.paymentEnabled, false);

    const voted = response();
    await handler(request({ action: 'vote', id: 'atlantico-sur' }), voted);
    assert.equal(voted.statusCode, 410);

    const title = 'Un nuevo personaje';
    const description = 'Podría tener una habilidad distinta en el siguiente nivel.';
    const invalid = response();
    await handler(request({ action: 'suggest', title: 'x', description }), invalid);
    assert.equal(invalid.statusCode, 400);
    for (let i = 0; i < 3; i++) {
      const submitted = response();
      await handler(request({ action: 'suggest', title, description }), submitted);
      assert.equal(submitted.statusCode, i < 2 ? 202 : 429);
    }
    assert.equal(pending.length, 2);
    const publicList = response();
    await handler({ method: 'GET', headers: {}, socket: {} }, publicList);
    assert.equal(publicList.body.ideas.some(idea => idea.title === title), false);
  } finally {
    global.fetch = originalFetch;
  }
});

test('keeps curated ideas visible when storage is not configured', async () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  try {
    const listed = response();
    await handler({ method: 'GET' }, listed);
    assert.equal(listed.statusCode, 200);
    assert.equal(listed.body.available, false);
    assert.equal(listed.body.ideas.length, 3);
    const submitted = response();
    await handler(request({ action: 'vote', id: 'atlantico-sur' }), submitted);
    assert.equal(submitted.statusCode, 503);
  } finally {
    process.env.UPSTASH_REDIS_REST_URL = url;
    process.env.UPSTASH_REDIS_REST_TOKEN = token;
  }
});
