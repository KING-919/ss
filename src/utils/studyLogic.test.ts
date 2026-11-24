import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePlanProgress,
  getStudentRank,
  VULNERABILITIES_CATALOG,
} from './studyLogic';

test('calculatePlanProgress handles bounds and zero totals cleanly', () => {
  assert.equal(calculatePlanProgress(0, 0), 0);
  assert.equal(calculatePlanProgress(3, 6), 50);
  assert.equal(calculatePlanProgress(10, 8), 100);
});

test('getStudentRank returns correct Arabic tier labels', () => {
  assert.equal(getStudentRank(2500).tier, 'platinum');
  assert.equal(getStudentRank(1300).tier, 'gold');
  assert.equal(getStudentRank(700).tier, 'silver');
  assert.equal(getStudentRank(100).tier, 'bronze');
});

test('VULNERABILITIES_CATALOG includes diverse intentional OWASP categories', () => {
  assert.ok(VULNERABILITIES_CATALOG.length >= 10);
  const ids = new Set(VULNERABILITIES_CATALOG.map((v) => v.id));
  assert.ok(ids.has('sqli-login'));
  assert.ok(ids.has('xss-stored'));
  assert.ok(ids.has('idor-notifications'));
  assert.ok(ids.has('cmd-injection'));
});
