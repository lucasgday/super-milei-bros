const assert = require('node:assert/strict');
const { test } = require('node:test');

process.env.UPSTASH_REDIS_REST_URL = 'https://example.invalid';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
const handler = require('../api/leaderboard');

function response() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('validates submissions and returns ranked entries', async () => {
  const entries = new Map();
  let count = 0;
  const originalFetch = global.fetch;
  global.fetch = async (_url, options) => {
    const [command, key, ...args] = JSON.parse(options.body);
    let result;
    if (command === 'EVAL') result = ++count;
    if (command === 'ZADD') { entries.set(key, [...(entries.get(key) || []), [args[1], args[0]]]); result = 1; }
    if (command === 'ZREVRANGE') result = (entries.get(key) || []).flat();
    return { ok: true, json: async () => ({ result }) };
  };
  try {
    const invalid = response();
    await handler({ method: 'POST', body: { alias: '<script>', score: 900 }, headers: {}, socket: {} }, invalid);
    assert.equal(invalid.statusCode, 400);

    const saved = response();
    await handler({ method: 'POST', body: { alias: 'Lucas', score: 900 }, headers: {}, socket: {} }, saved);
    assert.equal(saved.statusCode, 201);
    assert.equal(count, 1);

    const listed = response();
    await handler({ method: 'GET' }, listed);
    assert.deepEqual(listed.body.ranking, [{ alias: 'Lucas', score: 900, level: 1 }]);

    const second = response();
    await handler({ method: 'POST', body: { alias: 'Kari', score: 1200, level: 2 }, headers: {}, socket: {} }, second);
    assert.equal(second.statusCode, 201);
    const secondList = response();
    await handler({ method: 'GET' }, secondList);
    assert.deepEqual(secondList.body.ranking, [
      { alias: 'Kari', score: 1200, level: 2 },
      { alias: 'Lucas', score: 900, level: 1 },
    ]);

    const third = response();
    await handler({ method: 'POST', body: { alias: 'Duo', score: 14500, level: 3 }, headers: {}, socket: {} }, third);
    assert.equal(third.statusCode, 201);

    entries.set('super-milei-bros:level-1:ranking-v1', [[JSON.stringify({ alias: 'Histórico', id: 'old' }), 750]]);
    const migrated = response();
    await handler({ method: 'GET' }, migrated);
    assert.deepEqual(migrated.body.ranking[3], { alias: 'Histórico', score: 750, level: 1 });

    for (let i = 0; i < 2; i++) {
      const allowed = response();
      await handler({ method: 'POST', body: { alias: 'Lucas', score: 900 }, headers: {}, socket: {} }, allowed);
      assert.equal(allowed.statusCode, 201);
    }
    const limited = response();
    await handler({ method: 'POST', body: { alias: 'Lucas', score: 900 }, headers: {}, socket: {} }, limited);
    assert.equal(limited.statusCode, 429);
  } finally {
    global.fetch = originalFetch;
  }
});

test('accepts Vercel Marketplace KV environment variable names', async () => {
  const originalFetch = global.fetch;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.KV_REST_API_URL = 'https://kv.example.invalid';
  process.env.KV_REST_API_TOKEN = 'kv-test-token';
  let calledUrl;
  global.fetch = async url => {
    calledUrl = url;
    return { ok: true, json: async () => ({ result: [] }) };
  };
  try {
    const listed = response();
    await handler({ method: 'GET' }, listed);
    assert.equal(listed.statusCode, 200);
    assert.equal(calledUrl, 'https://kv.example.invalid');
  } finally {
    global.fetch = originalFetch;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.invalid';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  }
});

test('loads global and historical rankings concurrently', async () => {
  const originalFetch = global.fetch;
  const keys = [];
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  global.fetch = async (_url, options) => {
    keys.push(JSON.parse(options.body)[1]);
    await gate;
    return { ok: true, json: async () => ({ result: [] }) };
  };
  try {
    const listed = response();
    const pending = handler({ method: 'GET' }, listed);
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(keys, [
      'super-milei-bros:global:ranking-v1',
      'super-milei-bros:level-1:ranking-v1',
      'super-milei-bros:level-2:ranking-v1',
    ]);
    release();
    await pending;
    assert.equal(listed.statusCode, 200);
  } finally {
    release();
    global.fetch = originalFetch;
  }
});
