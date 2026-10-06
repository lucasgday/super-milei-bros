const assert = require('node:assert/strict');
const { test } = require('node:test');
const handler = require('../api/visitors');

function response() {
  return {
    setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('daily visitor counter deduplicates without storing raw IPs', async () => {
  process.env.UPSTASH_REDIS_REST_URL = 'https://example.invalid';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  const originalFetch = global.fetch;
  const visitors = new Set();
  global.fetch = async (_url, options) => {
    const command = JSON.parse(options.body);
    if (command[0] === 'EVAL') visitors.add(command[4]);
    return { ok: true, json: async () => ({ result: visitors.size }) };
  };
  try {
    const req = ip => ({ method: 'POST', headers: { 'x-forwarded-for': ip, 'user-agent': 'Browser' }, socket: {} });
    for (const [ip, expected] of [['198.51.100.1', 1], ['198.51.100.1', 1], ['198.51.100.2', 2]]) {
      const res = response();
      await handler(req(ip), res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.visitors, expected);
    }
    assert.equal([...visitors].some(value => value.includes('198.51.100')), false);
    const listed = response();
    await handler({ method: 'GET' }, listed);
    assert.equal(listed.body.visitors, 2);
  } finally {
    global.fetch = originalFetch;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  }
});
