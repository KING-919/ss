import test from 'node:test';
import assert from 'node:assert/strict';
import {
  signWeakJwt,
  verifyWeakJwt,
  resolveVirtualFile,
  executeSandboxedPing,
  resolveSandboxedSsrf,
  unsafeMerge,
  renderVulnerableTemplate,
} from './labSandbox';

test('weak JWT signs and verifies HS256 and intentionally accepts alg: none', () => {
  const token = signWeakJwt({ id: 2, username: 'sara', role: 'student' });
  const verified = verifyWeakJwt(token);
  assert.equal(verified?.username, 'sara');
  assert.equal(verified?.role, 'student');

  // Craft unsigned alg: none admin token
  const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const adminBody = Buffer.from(JSON.stringify({ id: 1, username: 'admin', role: 'admin' })).toString('base64url');
  const forgedToken = `${noneHeader}.${adminBody}.`;
  const forged = verifyWeakJwt(forgedToken);
  assert.equal(forged?.role, 'admin');
});

test('sandboxed path traversal reads virtual resources and simulated parent secrets', () => {
  const normal = resolveVirtualFile('qudrat_quant_summary.txt');
  assert.equal(normal.found, true);
  assert.ok(normal.content?.includes('القدرات الكمي'));

  const leaked = resolveVirtualFile('../../.env.lab');
  assert.equal(leaked.found, true);
  assert.ok(leaked.content?.includes('FLAG{DOT_ENV_EXPOSURE_SUCCESS}'));
});

test('sandboxed command injection detects operators and simulates output safely', () => {
  const clean = executeSandboxedPing('127.0.0.1');
  assert.equal(clean.injected, false);
  assert.ok(clean.output.includes('1 packets transmitted'));

  const exploit = executeSandboxedPing('127.0.0.1; whoami && env');
  assert.equal(exploit.injected, true);
  assert.ok(exploit.output.includes('alardah-app-service'));
  assert.ok(exploit.output.includes('FLAG{CMD_INJECTION_ENV_DUMP}'));
});

test('sandboxed SSRF returns simulated cloud metadata and internal RPC payload', () => {
  const meta = resolveSandboxedSsrf('http://169.254.169.254/latest/meta-data/');
  assert.equal(meta.internal, true);
  assert.ok(meta.body.includes('FLAG{SSRF_CLOUD_METADATA_LEAK}'));
});

test('unsafeMerge performs recursive merge and SSTI evaluates expressions', () => {
  const target: Record<string, unknown> = { theme: 'light' };
  unsafeMerge(target, { notifications: { email: true } });
  assert.deepEqual(target.notifications, { email: true });

  const cert = renderVulnerableTemplate('مرحباً {{7*7}} - {{name}}', { name: 'سارة' });
  assert.equal(cert, 'مرحباً 49 - سارة');
});
