const assert = require("node:assert/strict");
const { test } = require("node:test");
const { isPrivateIp } = require("../src/fetcher/http-fetcher");

test("isPrivateIp correctly identifies IPv4 and IPv6 private/internal addresses", () => {
  // Private / internal addresses
  assert.equal(isPrivateIp("127.0.0.1"), true);
  assert.equal(isPrivateIp("10.0.0.1"), true);
  assert.equal(isPrivateIp("172.16.0.1"), true);
  assert.equal(isPrivateIp("172.31.255.255"), true);
  assert.equal(isPrivateIp("192.168.1.100"), true);
  assert.equal(isPrivateIp("169.254.169.254"), true);
  assert.equal(isPrivateIp("0.0.0.0"), true);
  assert.equal(isPrivateIp("::1"), true);

  // Public addresses
  assert.equal(isPrivateIp("93.184.216.34"), false); // example.com
  assert.equal(isPrivateIp("8.8.8.8"), false); // Google DNS
  assert.equal(isPrivateIp("103.247.11.1"), false); // Public IP
});

