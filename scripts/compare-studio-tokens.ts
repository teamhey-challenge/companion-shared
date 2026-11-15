// 스튜디오(hey-companion-ui) main 의 hey.tokens.json 과 이 저장소의 정본을 비교한다.
// 다르면 끝코드 1. git(SSH)으로 못 받으면(오프라인·키 없음) 안내만 찍고 0 으로 끝난다(오프라인 안전).
// GitHub REST API 쿼터를 쓰지 않는다. STUDIO_TOKENS_STRICT=1 이면 못 가져올 때도 1 로 끝난다.
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LOCAL = new URL('../packages/tokens/hey.tokens.json', import.meta.url);
const REMOTE = process.env.STUDIO_TOKENS_REMOTE ?? 'git@github.com:teamhey-challenge/hey-companion-ui.git';
const PATH_IN_REPO = 'shared/packages/tokens/hey.tokens.json';
const strict = process.env.STUDIO_TOKENS_STRICT === '1';

function skip(why: string): never {
  console.log(`compare-studio-tokens: 건너뜀 (${why})`);
  process.exit(strict ? 1 : 0);
}

if (!Bun.which('git')) skip('git 없음');
const tmp = mkdtempSync(join(tmpdir(), 'studio-tokens-'));
const git = (...args: string[]) =>
  Bun.spawnSync(['git', '-C', tmp, ...args], { stderr: 'pipe', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
let studioJson: string;
try {
  git('init', '-q', '--bare');
  const f = git('fetch', '-q', '--depth=1', REMOTE, 'main');
  if (f.exitCode !== 0) skip(`git fetch 실패: ${f.stderr.toString().trim().split('\n')[0]}`);
  const shown = git('show', `FETCH_HEAD:${PATH_IN_REPO}`);
  if (shown.exitCode !== 0) skip(`git show 실패: ${shown.stderr.toString().trim().split('\n')[0]}`);
  studioJson = shown.stdout.toString();
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

type Leaf = { $value?: unknown };
function flatten(node: unknown, path: string, out: Map<string, string>): void {
  if (node && typeof node === 'object' && !('$value' in (node as Leaf))) {
    for (const [k, v] of Object.entries(node)) flatten(v, path ? `${path}.${k}` : k, out);
  } else {
    out.set(path, JSON.stringify((node as Leaf)?.$value ?? node));
  }
}
const studio = new Map<string, string>(), local = new Map<string, string>();
flatten(JSON.parse(studioJson), '', studio);
flatten(JSON.parse(readFileSync(LOCAL, 'utf8')), '', local);

const diffs: string[] = [];
for (const [k, v] of studio) {
  if (!local.has(k)) diffs.push(`+ ${k} = ${v}  (스튜디오에만 있음)`);
  else if (local.get(k) !== v) diffs.push(`~ ${k}: 이 저장소 ${local.get(k)} → 스튜디오 ${v}`);
}
for (const [k, v] of local) if (!studio.has(k)) diffs.push(`- ${k} = ${v}  (이 저장소에만 있음)`);

if (diffs.length) {
  console.error(`compare-studio-tokens: 스튜디오 main 과 토큰이 다릅니다 (${diffs.length}건)\n${diffs.join('\n')}`);
  process.exit(1);
}
console.log(`compare-studio-tokens: 일치 (${studio.size}개 토큰)`);
