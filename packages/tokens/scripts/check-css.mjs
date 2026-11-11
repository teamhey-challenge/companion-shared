// Fails on color or length literals in CSS declarations; only var(--hey-*) may carry values.
// Usage: node check-css.mjs [file-or-dir ...]   (default: packages/ui-web/src)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const NAMED = new Set(`aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.split(/\s+/));

const UNITS = 'px|rem|em|dp|sp|pt|pc|cm|mm|in|vh|vw|vmin|vmax|svh|dvh|lvh|svw|dvw|lvw|ch|ex|cqw|cqh';
const LENGTH_RE = new RegExp(`(?<![\\w.#-])[+-]?(\\d*\\.?\\d+)(${UNITS})(?![\\w%])`, 'gi');
const FUNC_COLOR_RE = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\s*\(/i;
const HEX_RE = /#[0-9a-f]{3,8}\b/i;

/** Blank out comments, keeping newlines so line numbers survive. */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

/** Returns [{line, text, reason}] for one CSS source. */
export function checkCss(source) {
  const css = stripComments(source);
  const problems = [];
  let start = 0;
  let depthParen = 0;
  let quote = null;
  const flush = (end, terminator) => {
    const seg = css.slice(start, end);
    start = end + 1;
    if (terminator === '{') return; // selector or at-rule prelude
    const lead = seg.match(/^\s*/)[0];
    const body = seg.slice(lead.length);
    if (!body || body.startsWith('@') || !body.includes(':')) return;
    const line = css.slice(0, start - 1 - seg.length + lead.length).split('\n').length;
    const colon = body.indexOf(':');
    const prop = body.slice(0, colon).trim().toLowerCase();
    if (prop.startsWith('--') && !prop.startsWith('--hey-')) {
      // custom property: still checked like any value
    }
    if (prop === 'font-family' || prop === 'content' || prop === 'src') return;
    let value = body.slice(colon + 1);
    value = value.replace(/var\(\s*--hey-[a-z0-9-]+\s*\)/gi, ' ');
    value = value.replace(/url\([^)]*\)/gi, ' ').replace(/"[^"]*"|'[^']*'/g, ' ');
    const report = (reason) => problems.push({ line, text: body.trim().replace(/\s+/g, ' '), reason });
    if (HEX_RE.test(value)) report('hex color literal');
    if (FUNC_COLOR_RE.test(value)) report('color function literal');
    for (const w of value.toLowerCase().match(/[a-z][a-z-]*/g) ?? []) {
      if (NAMED.has(w)) report(`named color "${w}"`);
    }
    for (const m of value.matchAll(LENGTH_RE)) {
      if (parseFloat(m[1]) !== 0) report(`length literal "${m[0]}"`);
    }
  };
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '(') depthParen++;
    else if (c === ')') depthParen = Math.max(0, depthParen - 1);
    else if (depthParen === 0) {
      if (c === '{') flush(i, '{');
      else if (c === ';') flush(i, ';');
      else if (c === '}') flush(i, '}');
    }
  }
  return problems;
}

function collect(path, out) {
  const st = statSync(path);
  if (st.isDirectory()) {
    for (const e of readdirSync(path)) {
      if (e === 'node_modules' || e.startsWith('.')) continue;
      collect(join(path, e), out);
    }
  } else if (path.endsWith('.css')) out.push(path);
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
  const args = process.argv.slice(2);
  const targets = args.length ? args.map((a) => resolve(a)) : [join(root, 'packages/ui-web/src')];
  const files = [];
  for (const t of targets) if (existsSync(t)) collect(t, files);
  let bad = 0;
  for (const f of files) {
    for (const p of checkCss(readFileSync(f, 'utf8'))) {
      bad++;
      console.error(`${f}:${p.line}: ${p.reason}: ${p.text}`);
    }
  }
  if (bad) {
    console.error(`check:css failed — ${bad} violation(s) in ${files.length} file(s)`);
    process.exit(1);
  }
  console.log(`check:css ok — ${files.length} file(s)`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
