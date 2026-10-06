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
  const entries = [];
  let count = 0;
  const originalFetch = global.fetch;
  global.fetch = async (_url, options) => {
    const [command, , ...args] = JSON.parse(options.body);
    let result;
    if (command === 'INCR') result = ++count;
    if (command === 'EXPIRE') result = 1;
    if (command === 'ZADD') { entries.push([args[1], args[0]]); result = 1; }
    if (command === 'ZREVRANGE') result = entries.flat();
    return { ok: true, json: async () => ({ result }) };
  };
  try {
    const invalid = response();
    await handler({ method: 'POST', body: { alias: '<script>', score: 900 }, headers: {}, socket: {} }, invalid);
    assert.equal(invalid.statusCode, 400);

    const saved = response();
    await handler({ method: 'POST', body: { alias: 'Lucas', score: 900 }, headers: {}, socket: {} }, saved);
    assert.equal(saved.statusCode, 201);

    const listed = response();
    await handler({ method: 'GET' }, listed);
    assert.deepEqual(listed.body.ranking, [{ alias: 'Lucas', score: 900 }]);
  } finally {
    global.fetch = originalFetch;
  }
});
