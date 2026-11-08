#!/usr/bin/env node
// © 2026 티쳐무 · 모든 권리 보유 — 고등학교 「소프트웨어와 생활」 웹 교과서
/**
 * 실행기 파일 문법 점검
 *
 * public/runner/ 의 파일은 번들러를 거치지 않는다. 그래서 문법 오류가 있어도 빌드는 통과하고,
 * 학생이 ▶ 실행을 누른 순간에야 「실행기에서 오류가 났다」로 터진다(2026-11-08 실제로 겪었다).
 *   py-worker.js       → node --check
 *   swlife_prelude.py  → 파이썬 ast.parse (py_compile 은 public/ 에 __pycache__ 를 남겨 배포본에 섞인다)
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const 오류 = [];
const js = spawnSync(process.execPath, ['--check', 'public/runner/py-worker.js'], { encoding: 'utf8' });
if (js.status !== 0) 오류.push(`py-worker.js 문법 오류\n${js.stderr}`);

const PY = ['python', 'python3', 'py'].find((c) => !spawnSync(c, ['--version']).error);
const py = spawnSync(
  PY,
  ['-c', "import ast,sys; ast.parse(open('public/runner/swlife_prelude.py', encoding='utf-8').read())"],
  { encoding: 'utf8' }
);
if (py.status !== 0) 오류.push(`swlife_prelude.py 문법 오류\n${py.stderr}`);

for (const f of ['public/runner/fonts/NanumGothic-Regular.ttf', 'public/runner/fonts/NanumGothic-OFL.txt']) {
  if (!existsSync(f)) 오류.push(`${f} 이 없다 — 맷플롯립 그림의 한글이 네모로 나온다`);
}
if (existsSync('public/runner/__pycache__')) 오류.push('public/runner/__pycache__ 가 있다 — 지울 것 (배포본에 섞인다)');

if (오류.length) {
  console.error('✗ 실행기 점검 실패');
  for (const e of 오류) console.error('  · ' + e);
  process.exit(1);
}
console.log('✓ 실행기 파일 — 워커·준비 코드 문법, 한글 글꼴과 라이선스');
