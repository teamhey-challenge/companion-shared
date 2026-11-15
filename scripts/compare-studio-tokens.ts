// 스튜디오(hey-companion-ui) main 의 hey.tokens.json 과 이 저장소의 정본을 비교한다.
// 다르면 끝코드 1. gh 가 없거나 로그인·네트워크가 안 되면 안내만 찍고 0 으로 끝난다(오프라인 안전).
// STUDIO_TOKENS_STRICT=1 이면 못 가져올 때도 1 로 끝난다.
import { readFileSync } from 'node:fs';

const LOCAL = new URL('../packages/tokens/hey.tokens.json', import.meta.url);
const API = 'repos/teamhey-challenge/hey-companion-ui/contents/shared/packages/tokens/hey.tokens.json';
const strict = process.env.STUDIO_TOKENS_STRICT === '1';

function skip(why: string): never {
  console.log(`compare-studio-tokens: 건너뜀 (${why})`);
  process.exit(strict ? 1 : 0);
}

if (!Bun.which('gh')) skip('gh 없음');
const run = Bun.spawnSync(['gh', 'api', '-H', 'Accept: application/vnd.github.raw+json', API], { stderr: 'pipe' });
if (run.exitCode !== 0) skip(`gh api 실패: ${run.stderr.toString().trim().split('\n')[0]}`);

type Leaf = { $value?: unknown };
function flatten(node: unknown, path: string, out: Map<string, string>): void {
  if (node && typeof node === 'object' && !('$value' in (node as Leaf))) {
    for (const [k, v] of Object.entries(node)) flatten(v, path ? `${path}.${k}` : k, out);
  } else {
    out.set(path, JSON.stringify((node as Leaf)?.$value ?? node));
  }
}
const studio = new Map<string, string>(), local = new Map<string, string>();
flatten(JSON.parse(run.stdout.toString()), '', studio);
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
