import test from 'node:test';
import assert from 'node:assert/strict';
import { checkCss } from './check-css.mjs';

const reasons = (css) => checkCss(css).map((p) => p.reason);

test('accepts var(--hey-*) only declarations', () => {
  const css = `.a { color: var(--hey-color-fg-default); padding: var(--hey-space-8) var(--hey-space-16);
  width: 100%; margin: 0; border: var(--hey-border-hairline) solid currentColor; background: transparent;
  grid-template-columns: 1fr auto; height: calc(var(--hey-space-8) * 2); line-height: 1.5; margin-top: 0px; }
  @media (width < 720px) { .a:hover { color: inherit } }`;
  assert.deepEqual(checkCss(css), []);
});

test('rejects hex, rgb, named colors', () => {
  assert.equal(reasons('.a{color:#fff}').length, 1);
  assert.equal(reasons('.a{color:#12345678}').length, 1);
  assert.equal(reasons('.a{background:rgba(0,0,0,.3)}').length, 1);
  assert.match(reasons('.a{color:red}')[0], /named color/);
});

test('rejects px/rem/em/dp lengths', () => {
  assert.match(reasons('.a{padding:12px}')[0], /length/);
  assert.match(reasons('.a{margin:0 1.5rem}')[0], /length/);
  assert.match(reasons('.a{width:calc(100% - 8px)}')[0], /length/);
  assert.match(reasons('.a{width:2em}')[0], /length/);
});

test('reports line numbers and ignores comments', () => {
  const p = checkCss('/* color: red; */\n.a {\n  color: var(--hey-color-fg-default);\n  gap: 4px;\n}');
  assert.equal(p.length, 1);
  assert.equal(p[0].line, 4);
});

test('does not flag selectors or var names containing color words', () => {
  assert.deepEqual(checkCss('.red:hover > .tan { color: var(--hey-color-danger); }'), []);
});
