#!/usr/bin/env node
// © 2026 티쳐무 · 모든 권리 보유 — 고등학교 「소프트웨어와 생활」 웹 교과서
/**
 * 예제 코드 실행 검증
 *
 *   node tools/check-examples.mjs
 *
 * CLAUDE.md 6장 10번: 실행해 보지 않은 예제 코드를 싣지 않는다.
 * 이 스크립트는 content/units/ 의 MDX에서 <CodeSample> 블록을 뽑아 실제로 실행하고
 * expect 값과 대조한다.
 *
 * Python  → 로컬 python 으로 실행해 대조한다.
 * C       → 로컬 C 컴파일러가 있으면 컴파일·실행해 대조하고, 없으면 "미검증"으로 센다.
 *           미검증 C 예제가 있으면 경고를 내되 실패로 처리하지는 않는다
 *           (컴파일러 설치 여부는 사용자 환경 문제다).
 */
import {
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  mkdtempSync,
  rmSync,
  existsSync,
  mkdirSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const ROOT = 'content/units';

/* ---------- 실행기 탐색 ---------- */
function 있는가(cmd, args = ['--version']) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  return r.status === 0 || (r.stdout ?? '').length > 0 || (r.stderr ?? '').length > 0
    ? !r.error
    : false;
}

const PY = ['python', 'python3', 'py'].find((c) => 있는가(c));

/**
 * C 컴파일러 탐색.
 * zig 는 `zig cc` 로 clang 을 그대로 쓸 수 있어 우선순위가 높다.
 * winget 으로 설치한 zig 는 셸 재시작 전까지 PATH 에 안 잡히므로 설치 경로도 훑는다.
 */
function zig찾기() {
  if (있는가('zig', ['version'])) return 'zig';
  const base = join(
    process.env.LOCALAPPDATA ?? '',
    'Microsoft',
    'WinGet',
    'Packages'
  );
  try {
    for (const d of readdirSync(base)) {
      if (!d.startsWith('zig.zig')) continue;
      for (const sub of readdirSync(join(base, d))) {
        const exe = join(base, d, sub, 'zig.exe');
        if (existsSync(exe)) return exe;
      }
    }
  } catch {
    /* 없으면 무시 */
  }
  return null;
}

const ZIG = zig찾기();
const 직접컴파일러 = ['gcc', 'clang', 'cc', 'tcc'].find((c) => 있는가(c));

/** { cmd, args } — 소스와 출력 경로를 받아 컴파일 명령을 만든다 */
const CC = ZIG
  ? { 이름: 'zig cc', cmd: ZIG, args: (src, exe) => ['cc', src, '-o', exe] }
  : 직접컴파일러
    ? { 이름: 직접컴파일러, cmd: 직접컴파일러, args: (src, exe) => [src, '-o', exe] }
    : null;

/* ---------- MDX 수집 ---------- */
function 모든MDX(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...모든MDX(p));
    else if (/\.mdx?$/.test(name)) out.push(p);
  }
  return out;
}

/**
 * <CodeSample ...> {`...`} </CodeSample> 블록을 뽑는다.
 * 코드는 MDX 템플릿 리터럴 안에 있고, \\n 은 실제 코드의 \n 이스케이프다.
 */
function 예제추출(src, file) {
  const out = [];
  const re = /<CodeSample\b([\s\S]*?)>\s*\{`([\s\S]*?)`\}\s*<\/CodeSample>/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const attrs = m[1];
    const rawCode = m[2];

    const lang = /lang=["'](\w+)["']/.exec(attrs)?.[1];
    const caption = /caption=["']([^"']*)["']/.exec(attrs)?.[1] ?? '';
    /* norun="이유" — 일부러 실패하는 예제(오타 시연·무한 루프)는 실행하지 않는다.
       이유를 반드시 적게 해서 "그냥 검증을 건너뛴" 예제와 구분한다. */
    const norun = /\bnorun=\{?["']([^"']*)["']\}?/.exec(attrs)?.[1] ?? null;

    /* expect={"...\n"} 또는 expect="..." */
    let expect = null;
    const e1 = /expect=\{"((?:[^"\\]|\\.)*)"\}/.exec(attrs);
    const e2 = /expect=["']((?:[^"'\\]|\\.)*)["']/.exec(attrs);
    const raw = e1?.[1] ?? e2?.[1];
    if (raw !== undefined) {
      expect = raw.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
    }

    let stdin = '';
    const s1 = /stdin=\{"((?:[^"\\]|\\.)*)"\}/.exec(attrs);
    const s2 = /stdin=["']((?:[^"'\\]|\\.)*)["']/.exec(attrs);
    const sraw = s1?.[1] ?? s2?.[1];
    if (sraw !== undefined) stdin = sraw.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

    /* MDX 템플릿 리터럴 안의 \\n → 코드의 \n 두 글자 */
    const code = rawCode.replace(/\\\\/g, '\\').replace(/\\`/g, '`');

    /* files="bike.csv,people.csv" — 실행 폴더에 놓을 연습용 데이터 (public/data/)
       plot="u3-l6-line" — 맷플롯립 그림을 public/figs/<plot>-N.png 로 저장한다 */
    const files = (/\bfiles=["']([^"']*)["']/.exec(attrs)?.[1] ?? '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    const plot = /\bplot=["']([\w-]+)["']/.exec(attrs)?.[1] ?? null;

    out.push({ file, lang, caption, code, expect, stdin, norun, files, plot });
  }
  return out;
}

/* ---------- 실행 ---------- */
/**
 * 맷플롯립 예제는 브라우저 실행기와 같은 준비 코드(public/runner/swlife_prelude.py)를 먼저 돌린다.
 * 같은 글꼴·같은 설정으로 그려야 «확인된 실행 결과» 그림이 학생 화면의 그림과 같다.
 */
const 그림폴더 = 'public/figs';
const 준비코드 = 'public/runner/swlife_prelude.py';
const 글꼴 = 'public/runner/fonts/NanumGothic-Regular.ttf';
function 감싸기(plot) {
  const q = (p) => JSON.stringify(join(process.cwd(), p));
  return [
    'import base64, os',
    '_ns = {}',
    `exec(open(${q(준비코드)}, encoding="utf-8").read(), _ns)`,
    '_n = [0]',
    'def _보내기(b64):',
    '    _n[0] += 1',
    `    with open(os.path.join(${q(그림폴더)}, "${plot}-%d.png" % _n[0]), "wb") as f:`,
    '        f.write(base64.b64decode(b64))',
    `_show = _ns["_준비"](_보내기, ${q(글꼴)})`,
    '_g = {"__name__": "__main__"}',
    'exec(compile(open("main.py", encoding="utf-8").read(), "main.py", "exec"), _g)',
    '_show()',
    'print("@@그림 %d장" % _n[0], end="")',
    '',
  ].join('\n');
}

function python실행(code, stdin, files = [], plot = null) {
  const dir = mkdtempSync(join(tmpdir(), 'ex-py-'));
  try {
    const f = join(dir, 'main.py');
    writeFileSync(f, code, 'utf8');
    for (const 이름 of files) {
      const 원본 = join('public/data', 이름);
      if (!existsSync(원본)) return { err: `데이터 파일 ${원본} 이 없다 (tools/make-data.py 를 돌렸나?)` };
      writeFileSync(join(dir, 이름), readFileSync(원본));
    }
    let 돌릴것 = f;
    if (plot) {
      mkdirSync(그림폴더, { recursive: true });
      for (const old of readdirSync(그림폴더)) if (old.startsWith(plot + '-')) rmSync(join(그림폴더, old));
      돌릴것 = join(dir, '_run.py');
      writeFileSync(돌릴것, 감싸기(plot), 'utf8');
    }
    /* Windows 파이썬은 파이프로 출력할 때 기본이 cp949 라서 한글이 깨진다.
       UTF-8 을 강제해야 기대 출력과 바이트 단위로 맞춰 볼 수 있다. */
    const r = spawnSync(PY, [돌릴것], {
      input: stdin,
      encoding: 'utf8',
      timeout: plot || files.length ? 60000 : 10000, // 판다스·맷플롯립은 불러오는 데만 몇 초 걸린다
      /* 파일을 만드는 예제(2단원 17·18차시)가 저장소를 어지럽히지 않게,
         그리고 이어 쓰기("a") 예제가 앞 실행의 파일에 덧붙어 기대 출력과
         어긋나지 않게 임시 폴더에서 돌린다. 예제마다 폴더가 새로 만들어진다. */
      cwd: dir,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', MPLBACKEND: 'Agg' },
    });
    if (r.status !== 0) return { err: (r.stderr || '실행 실패').trim() };
    let out = r.stdout.replace(/\r\n/g, '\n');
    let 그림 = 0;
    const m = /@@그림 (\d+)장$/.exec(out);
    if (m) {
      그림 = Number(m[1]);
      out = out.slice(0, m.index);
    }
    return { out, 그림, 경고: r.stderr ?? "" };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function c실행(code, stdin) {
  const dir = mkdtempSync(join(tmpdir(), 'ex-c-'));
  try {
    const src = join(dir, 'main.c');
    const exe = join(dir, process.platform === 'win32' ? 'main.exe' : 'main');
    writeFileSync(src, code, 'utf8');
    const c = spawnSync(CC.cmd, CC.args(src, exe), { encoding: 'utf8', timeout: 120000 });
    if (c.status !== 0) return { err: `컴파일 실패: ${(c.stderr || '').trim().slice(0, 300)}` };
    /* python실행 과 같은 이유로 임시 폴더에서 돌린다 */
    const r = spawnSync(exe, [], { input: stdin, encoding: 'utf8', timeout: 10000, cwd: dir });
    if (r.status !== 0 && !r.stdout) return { err: (r.stderr || '실행 실패').trim() };
    return { out: r.stdout.replace(/\r\n/g, '\n') };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/* ---------- 본 검사 ---------- */
const files = 모든MDX(ROOT);
const 예제들 = files.flatMap((f) => 예제추출(readFileSync(f, 'utf8'), relative(process.cwd(), f)));

let 통과 = 0;
const 오류 = [];
const 미검증 = [];

console.log(`실행기: python=${PY ?? '없음'} / C=${CC ? CC.이름 : '없음'}`);
console.log(`예제 ${예제들.length}개 (파일 ${files.length}개)\n`);

for (const ex of 예제들) {
  const 이름 = `${ex.file} [${ex.lang}] ${ex.caption || '(제목 없음)'}`;

  if (ex.expect === null) {
    오류.push(`${이름}: expect 가 없다 — 기대 출력을 반드시 적는다`);
    continue;
  }

  /* 일부러 실패하는 예제는 자동 실행에서 뺀다. 기대 출력은 집필자가 손으로 확인한 값이다.
     빠뜨리고 지나가지 않게 목록에 남겨 매번 보이게 한다. */
  if (ex.norun !== null) {
    미검증.push(`${이름}: 실행 제외 — ${ex.norun}`);
    continue;
  }

  const 실행기 = ex.lang === 'python' ? PY : ex.lang === 'c' ? CC : null;
  if (!실행기) {
    미검증.push(`${이름}: ${ex.lang} 실행기가 없어 확인하지 못했다`);
    continue;
  }

  /* 맷플롯립을 쓰는데 plot 이름이 없으면 «확인된 그림»을 실을 수 없다 */
  if (ex.lang === 'python' && /import matplotlib/.test(ex.code) && !ex.plot) {
    오류.push(`${이름}: 맷플롯립 예제에는 plot="이름" 을 붙인다 (확인된 그림을 저장할 이름)`);
    continue;
  }
  const r =
    ex.lang === 'python' ? python실행(ex.code, ex.stdin, ex.files, ex.plot) : c실행(ex.code, ex.stdin);
  if (ex.plot && !r.err && !r.그림) {
    오류.push(`${이름}: plot="${ex.plot}" 인데 그림이 한 장도 나오지 않았다`);
    continue;
  }
  /* 글꼴에 없는 글자는 그림에서 네모(□)가 된다. 맷플롯립은 경고만 하고 그림은 그려 내므로 여기서 잡는다 */
  if (ex.plot && /missing from font/.test(r.경고 ?? '')) {
    const 글자 = (r.경고.match(/Glyph[^\n]*/) ?? [''])[0];
    오류.push(`${이름}: 그림에 글꼴에 없는 글자가 있다 — ${글자}`);
    continue;
  }

  if (r.err) {
    오류.push(`${이름}\n        실행 오류: ${r.err.split('\n').slice(-3).join(' ').slice(0, 240)}`);
    continue;
  }
  if (r.out !== ex.expect) {
    오류.push(
      `${이름}\n        기대: ${JSON.stringify(ex.expect)}\n        실제: ${JSON.stringify(r.out)}`
    );
    continue;
  }
  통과++;
  console.log(`  ok   ${이름}`);
}

for (const w of 미검증) console.log(`  경고 ${w}`);
for (const e of 오류) console.log(`  오류 ${e}`);

console.log(
  `\n${오류.length === 0 ? '통과' : '실패'} — 확인 ${통과}건, 미검증 ${미검증.length}건, 오류 ${오류.length}건`
);
if (미검증.length > 0 && !CC) {
  console.log(
    'C 예제를 검증하려면 C 컴파일러가 필요하다. TCC(약 1MB) 또는 MSYS2 gcc 설치를 검토한다.'
  );
}
process.exit(오류.length === 0 ? 0 : 1);
