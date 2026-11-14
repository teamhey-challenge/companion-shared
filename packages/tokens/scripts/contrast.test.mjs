import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { color } = JSON.parse(readFileSync(new URL('../hey.tokens.json', import.meta.url), 'utf8'));
function luminance(hex) {
  const rgb = hex.slice(1, 7).match(/../g).map(v => parseInt(v, 16) / 255);
  return rgb.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
}
for (const [theme, tokens] of Object.entries(color)) test(`${theme}: enabled text and action semantic pairs meet 4.5:1`, () => {
  const pairs = ['fg-default', 'fg-muted', 'fg-subtle'].flatMap(fg => ['bg-page', 'bg-surface', 'bg-raised', 'accent-container', 'danger-container', 'success-container', 'warning-container', 'info-container', 'button-secondary'].map(bg => [fg, bg]));
  pairs.push(['fg-inverse', 'bg-inverse'], ['fg-on-accent', 'accent'], ['fg-on-accent', 'accent-pressed'], ['fg-on-primary', 'primary'], ['fg-on-primary', 'primary-pressed'], ['fg-on-secondary', 'button-secondary'], ['fg-on-secondary', 'button-secondary-pressed'], ['fg-on-danger', 'danger']);
  for (const state of ['success', 'warning', 'danger', 'info']) pairs.push([state, `${state}-container`]);
  for (const [fg, bg] of pairs) {
    const a = luminance(tokens[fg].$value), b = luminance(tokens[bg].$value);
    const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    assert.ok(ratio >= 4.5, `${theme} ${fg}/${bg}: ${ratio.toFixed(2)}:1`);
  }
});
