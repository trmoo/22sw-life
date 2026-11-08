// © 2026 티쳐무 · 모든 권리 보유 — 고등학교 「소프트웨어와 생활」 웹 교과서
/* ─────────────────────────────────────────────────────────────
   가상 보드 엔진 검사 — src/lib/boardsim.js

   1. 미션마다 «정답 규칙»이 실제로 통과하는가 (보드별)
   2. 흔한 «틀린 규칙»은 떨어지는가 — 채점이 너무 너그러우면 아무거나 통과한다
   3. 보드에 없는 센서·출력을 쓰면 규칙점검이 잡는가
   4. 생성한 코드가 진짜 문법에 맞는가
        · 마이크로비트 → 파이썬 compile() (모듈은 불러오지 않고 문법만)
        · 아두이노   → zig c++ -fsyntax-only + 아두이노 API 를 흉내 낸 머리 파일
      파이썬·zig 이 없으면 그 검사만 「미검증」으로 넘긴다(배포 워크플로에는 파이썬이 있다).
   정답 규칙을 이 파일에 두는 까닭: 화면 묶음에 넣으면 학생에게 보이기 때문이다.
   ───────────────────────────────────────────────────────────── */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { 으로, 보드, 미션, 미션채점, 규칙점검, 코드만들기, 동작목록, 한박자, 처음센서값, 서보값 } from '../src/lib/boardsim.js';

let 통과 = 0;
const 실패 = [];
const 미검증 = [];
const ok = (조건, 글) => (조건 ? 통과++ : 실패.push(글));

/* ---------- 정답과 오답 ---------- */
const A = (out, act, arg) => ({ out, act, arg });
const 정답 = {
  heart: { microbit: [{ when: { sensor: 'btnA', op: 'pressed' }, then: A('display', 'icon', 'HEART'), else: A('display', 'clear') }] },
  blink13: { arduino: [{ when: { sensor: 'btn', op: 'pressed' }, then: A('led', 'on'), else: A('led', 'off') }] },
  streetlight: {
    microbit: [{ when: { sensor: 'light', op: '<', value: 60 }, then: A('pixel', 'color', 'white'), else: A('pixel', 'off') }],
    arduino: [{ when: { sensor: 'light', op: '<', value: 300 }, then: A('pixel', 'color', 'white'), else: A('pixel', 'off') }],
  },
  parking: { arduino: [{ when: { sensor: 'distance', op: '<', value: 20 }, then: A('servo', 'angle', 90), else: A('servo', 'angle', 0) }] },
  heatalarm: {
    microbit: [
      { when: { sensor: 'temp', op: '>', value: 30 }, then: A('sound', 'tone', 440), else: A('sound', 'stop') },
      { when: { sensor: 'temp', op: '>', value: 30 }, then: A('pixel', 'color', 'red'), else: A('pixel', 'color', 'green') },
    ],
    arduino: [
      { when: { sensor: 'temp', op: '>', value: 30 }, then: A('sound', 'tone', 440), else: A('sound', 'stop') },
      { when: { sensor: 'temp', op: '>', value: 30 }, then: A('pixel', 'color', 'red'), else: A('pixel', 'color', 'green') },
    ],
  },
  theremin: {
    microbit: [{ then: A('sound', 'follow', 'light') }],
    arduino: [{ then: A('sound', 'follow', 'light') }],
  },
  fall: {
    microbit: [
      { when: { sensor: 'tilt', op: '>', value: 700 }, then: A('sound', 'tone', 523), else: A('sound', 'stop') },
      { when: { sensor: 'tilt', op: '>', value: 700 }, then: A('display', 'icon', 'NO'), else: A('display', 'clear') },
    ],
  },
};
const 오답 = [
  ['streetlight', 'microbit', '끄기를 빠뜨림', [{ when: { sensor: 'light', op: '<', value: 60 }, then: A('pixel', 'color', 'white') }]],
  ['streetlight', 'arduino', '마이크로비트 범위로 값을 적음(0~255 감각으로 20)', [{ when: { sensor: 'light', op: '<', value: 20 }, then: A('pixel', 'color', 'white'), else: A('pixel', 'off') }]],
  ['streetlight', 'microbit', '부등호를 거꾸로', [{ when: { sensor: 'light', op: '>', value: 60 }, then: A('pixel', 'color', 'white'), else: A('pixel', 'off') }]],
  ['parking', 'arduino', '열고 닫는 각도를 바꿈', [{ when: { sensor: 'distance', op: '<', value: 20 }, then: A('servo', 'angle', 0), else: A('servo', 'angle', 90) }]],
  ['parking', 'microbit', '거리 센서가 없는 보드', 정답.streetlight.microbit],
  ['heatalarm', 'microbit', '소리만 하고 색을 안 바꿈', [정답.heatalarm.microbit[0]]],
  ['theremin', 'microbit', '고정된 음만 냄', [{ then: A('sound', 'tone', 262) }]],
  ['fall', 'microbit', '아니면을 빠뜨려 경보가 계속 울림', [{ when: { sensor: 'tilt', op: '>', value: 700 }, then: A('sound', 'tone', 523) }, 정답.fall.microbit[1]]],
  ['heart', 'microbit', '아무 규칙도 없음', []],
];

for (const [id, m] of Object.entries(미션)) {
  ok(정답[id], `미션 ${id} 에 정답 규칙이 없다 — 이 파일에 적을 것`);
  for (const [b, rules] of Object.entries(정답[id] ?? {})) {
    const r = 미션채점(b, rules, m);
    ok(r.통과, `정답이 떨어짐: ${id} / ${b} — ${r.결과.filter((x) => !x.ok).map((x) => x.글).join(', ')}`);
  }
  for (const b of m.boards ?? Object.keys(보드)) ok(정답[id]?.[b], `미션 ${id} 는 ${b} 로도 풀 수 있다는데 그 정답이 없다`);
}
for (const [id, b, 왜, rules] of 오답) {
  ok(!미션채점(b, rules, 미션[id]).통과, `오답이 통과함: ${id} / ${b} — ${왜}`);
}

/* ---------- 규칙 점검 ---------- */
ok(규칙점검('microbit', { when: { sensor: 'distance', op: '<', value: 10 }, then: A('display', 'clear') }), '마이크로비트에 거리 센서 규칙을 허락함');
ok(규칙점검('arduino', { then: A('display', 'icon', 'HEART') }), '아두이노에 LED 화면 동작을 허락함');
ok(규칙점검('microbit', { then: A('led', 'on') }), '마이크로비트에 13번 LED 동작을 허락함');
ok(규칙점검('microbit', { when: { sensor: 'light', op: '<', value: 900 }, then: A('display', 'clear') }), '마이크로비트 빛 900(범위 밖)을 허락함');
ok(!규칙점검('arduino', { when: { sensor: 'light', op: '<', value: 900 }, then: A('led', 'on') }), '아두이노 빛 900 을 막음');
ok(서보값(0) === 26 && 서보값(90) === 77 && 서보값(180) === 128, `서보값 계산 ${서보값(0)}/${서보값(90)}/${서보값(180)}`);

/* 조사 */
for (const [말, 기대] of [['보라', '보라로'], ['파랑', '파랑으로'], ['흰색', '흰색으로'], ['스피커', '스피커로'], ['부저', '부저로'], ['빨강', '빨강으로'], ['연필', '연필로']]) {
  ok(으로(말) === 기대, `조사: ${말} → ${으로(말)} (기대 ${기대})`);
}
ok(동작목록('microbit').some((a) => a.글 === '네오픽셀을 보라로'), '동작 글에 「보라로」 가 없다');

/* 아래 규칙이 이긴다 — 코드 차례와 같아야 한다 */
const 겹침 = 한박자('arduino', [{ then: A('led', 'on') }, { then: A('led', 'off') }], 처음센서값('arduino'));
ok(겹침.led === false, '같은 출력을 두 규칙이 건드릴 때 아래 규칙이 이기지 않는다');

/* ---------- 생성 코드 문법 ---------- */
const 임시 = mkdtempSync(join(tmpdir(), 'boardsim-'));
const 코드모음 = [];
for (const b of Object.keys(보드)) {
  /* 모든 동작을 한 번씩 — 조건 있는 규칙과 「항상」 규칙을 섞는다 */
  const 센서들 = Object.entries(보드[b].센서);
  const 규칙 = 동작목록(b).map((a, i) => {
    const [k, s] = 센서들[i % 센서들.length];
    if (i % 3 === 0) return { then: a };
    const when = s.kind === 'button' ? { sensor: k, op: i % 2 ? 'pressed' : 'notpressed' } : { sensor: k, op: i % 2 ? '<' : '>', value: Math.round((s.min + s.max) / 2) };
    return { when, then: a, else: i % 2 ? 동작목록(b)[0] : undefined };
  });
  코드모음.push([b, '모든 동작', 코드만들기(b, 규칙)]);
  코드모음.push([b, '빈 규칙', 코드만들기(b, [])]);
  for (const [id, per] of Object.entries(정답)) if (per[b]) 코드모음.push([b, `미션 ${id}`, 코드만들기(b, per[b])]);
}

const PY = ['python', 'python3', 'py'].find((c) => !spawnSync(c, ['--version']).error);
function zig찾기() {
  if (!spawnSync('zig', ['version']).error) return 'zig';
  const base = join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'WinGet', 'Packages');
  try {
    for (const d of readdirSync(base)) if (d.startsWith('zig.zig')) for (const s of readdirSync(join(base, d))) {
      const e = join(base, d, s, 'zig.exe');
      if (existsSync(e)) return e;
    }
  } catch {}
  return null;
}
const ZIG = zig찾기();

/* 아두이노 API 흉내 — 이름과 인자 꼴만 맞으면 된다 (문법·이름 검사용) */
writeFileSync(join(임시, 'Arduino.h'), `#pragma once
#define HIGH 1
#define LOW 0
#define INPUT 0
#define OUTPUT 1
#define INPUT_PULLUP 2
#define A0 14
#define A1 15
#define A2 16
#define NEO_GRB 0x52
#define NEO_KHZ800 0x0000
void pinMode(int, int); void digitalWrite(int, int); int digitalRead(int); int analogRead(int);
void delay(unsigned long); void delayMicroseconds(unsigned int); unsigned long pulseIn(int, int, unsigned long);
void tone(int, unsigned int); void noTone(int);
long map(long, long, long, long, long);
#define constrain(amt, low, high) ((amt) < (low) ? (low) : ((amt) > (high) ? (high) : (amt)))  /* 진짜 Arduino.h 와 같은 매크로 */
`);
writeFileSync(join(임시, 'Servo.h'), '#pragma once\nclass Servo { public: void attach(int); void write(int); };\n');
writeFileSync(join(임시, 'Adafruit_NeoPixel.h'), '#pragma once\n#include "Arduino.h"\nclass Adafruit_NeoPixel { public: Adafruit_NeoPixel(int, int, int); void begin(); void show(); void fill(unsigned long); static unsigned long Color(int, int, int); };\n');

/* 검사기가 살아 있는지 — 일부러 틀린 코드는 반드시 걸려야 한다 */
코드모음.push(['arduino', '__일부러틀림', 'void loop() { tone(8); }\n']);
코드모음.push(['microbit', '__일부러틀림', 'while True\n    pass\n']);

코드모음.forEach(([b, 이름, 코드], i) => {
  const 틀림 = 이름 === '__일부러틀림';
  if (b === 'microbit') {
    if (!PY) return 미검증.push(`${b} ${이름} (파이썬 없음)`);
    const f = join(임시, `m${i}.py`);
    writeFileSync(f, 코드);
    const r = spawnSync(PY, ['-c', `import sys; compile(open(sys.argv[1], encoding='utf-8').read(), 'm', 'exec')`, f], { encoding: 'utf8' });
    if (틀림) return ok(r.status !== 0, '파이썬 문법 검사기가 틀린 코드를 못 잡는다');
    ok(r.status === 0, `마이크로비트 코드 문법 오류 (${이름})\n${r.stderr}\n${코드}`);
  } else {
    if (!ZIG) return 미검증.push(`${b} ${이름} (zig 없음)`);
    const f = join(임시, `a${i}.cpp`);
    /* .ino 는 Arduino.h 를 저절로 넣고 main 을 대신 만든다 — 같은 일을 흉내 낸다 */
    writeFileSync(f, `#include "Arduino.h"\n${코드}`);
    /* ⚠ zig 0.16 은 -fsyntax-only 뒤에 목적 파일이 없다며 「error: FileNotFound」 를 늘 덧붙이고 1 을 돌려준다.
       그래서 종료 코드가 아니라 그 밖의 error 줄이 있는지로 판정한다(아래 「일부러 틀림」 이 걸리는지로 확인).
       c++ 대신 cc -x c++ 를 쓰는 까닭: c++ 는 libc++ 를 통째로 빌드하려다 윈도우에서 실패한다. */
    const r = spawnSync(ZIG, ['cc', '-x', 'c++', '-fsyntax-only', '-nostdinc++', '-I', 임시, f], { encoding: 'utf8' });
    const 오류줄 = (r.stderr ?? '').split('\n').filter((l) => /error:/.test(l) && !/error: FileNotFound/.test(l));
    if (틀림) return ok(오류줄.length > 0, 'zig 문법 검사기가 틀린 코드를 못 잡는다');
    ok(오류줄.length === 0, `아두이노 코드 문법 오류 (${이름})\n${오류줄.join('\n')}\n${코드}`);
  }
});
rmSync(임시, { recursive: true, force: true });

console.log(`\n가상 보드 엔진 검사 — 미션 ${Object.keys(미션).length}개, 생성 코드 ${코드모음.length}개`);
for (const m of 미검증) console.log(`  미검증  ${m}`);
if (실패.length) {
  for (const f of 실패) console.error(`  실패  ${f}`);
  console.error(`실패 — ${통과}건 통과, ${실패.length}건 실패`);
  process.exit(1);
}
console.log(`통과 — ${통과}건`);
