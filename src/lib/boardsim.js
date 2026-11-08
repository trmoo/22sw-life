// © 2026 티쳐무 · 모든 권리 보유 — 고등학교 「소프트웨어와 생활」 웹 교과서
/**
 * 가상 보드 엔진 — 마이크로비트 v2 · 아두이노 우노
 *
 * 학생은 「만약 [센서] [비교] [값] 이면 [동작], 아니면 [동작]」 규칙을 쌓는다.
 * 이 파일은 그 규칙으로 ① 한 박자(tick)씩 출력 상태를 계산하고
 * ② 같은 규칙을 진짜 보드에 올릴 수 있는 코드(MicroPython / 아두이노 C++)로 바꾸고
 * ③ 미션의 시험 사례를 돌려 채점한다.
 *
 * ⚠ DOM 을 쓰지 않는다 — tools/check-boardsim.mjs 가 node 로 불러다 시험한다.
 * ⚠ 생성 코드의 문법은 시험이 실제로 검사한다(파이썬 compile, zig c++ -fsyntax-only).
 *   API 이름을 바꿀 때는 반드시 `npm test` 를 돌릴 것.
 */

/* ───────────── 센서 ─────────────
   kind: 'button' 은 눌림/안 눌림, 'range' 는 숫자 값.
   같은 「빛 센서」라도 보드마다 값의 범위가 다르다 — 이것 자체가 Ⅱ단원의 배울 거리다. */
export const 보드 = {
  microbit: {
    이름: '마이크로비트 v2',
    언어: 'MicroPython',
    센서: {
      btnA: { 이름: '버튼 A', kind: 'button', 부품: '보드에 달림', py: 'button_a.is_pressed()' },
      btnB: { 이름: '버튼 B', kind: 'button', 부품: '보드에 달림', py: 'button_b.is_pressed()' },
      light: { 이름: '빛', kind: 'range', min: 0, max: 255, 단위: '', 처음: 160, 부품: 'LED 화면이 빛을 잰다', py: 'display.read_light_level()' },
      temp: { 이름: '온도', kind: 'range', min: -10, max: 50, 단위: '℃', 처음: 22, 부품: '처리 장치 안의 온도 센서', py: 'temperature()' },
      tilt: { 이름: '기울기(좌우)', kind: 'range', min: -1024, max: 1024, 단위: '', 처음: 0, 부품: '가속도 센서', py: 'accelerometer.get_x()' },
      sound: { 이름: '소리 크기', kind: 'range', min: 0, max: 255, 단위: '', 처음: 20, 부품: '마이크', py: 'microphone.sound_level()' },
    },
    출력: {
      display: { 이름: '5×5 LED 화면', 부품: '보드에 달림' },
      sound: { 이름: '스피커', 부품: '보드에 달림' },
      servo: { 이름: '서보 모터', 부품: '핀 1에 연결' },
      pixel: { 이름: '네오픽셀 8개', 부품: '핀 2에 연결' },
    },
  },
  arduino: {
    이름: '아두이노 우노',
    언어: 'Arduino C++',
    센서: {
      btn: { 이름: '버튼', kind: 'button', 부품: '디지털 2번 핀', c: 'digitalRead(2) == LOW' },
      light: { 이름: '빛(조도 센서)', kind: 'range', min: 0, max: 1023, 단위: '', 처음: 650, 부품: '아날로그 A0 핀', c: 'analogRead(A0)' },
      temp: { 이름: '온도(TMP36)', kind: 'range', min: -10, max: 50, 단위: '℃', 처음: 22, 부품: '아날로그 A1 핀', c: 'readTemp()' },
      distance: { 이름: '거리(초음파)', kind: 'range', min: 2, max: 200, 단위: 'cm', 처음: 120, 부품: '디지털 9번(trig)·10번(echo) 핀', c: 'readDistance()' },
      sound: { 이름: '소리 크기', kind: 'range', min: 0, max: 1023, 단위: '', 처음: 80, 부품: '아날로그 A2 핀', c: 'analogRead(A2)' },
    },
    출력: {
      led: { 이름: 'LED', 부품: '디지털 13번 핀' },
      sound: { 이름: '부저', 부품: '디지털 8번 핀' },
      servo: { 이름: '서보 모터', 부품: '디지털 6번 핀' },
      pixel: { 이름: '네오픽셀 8개', 부품: '디지털 7번 핀' },
    },
  },
};

export const 아이콘 = {
  HEART: { 이름: '하트', 점: ['01010', '11111', '11111', '01110', '00100'] },
  HAPPY: { 이름: '웃음', 점: ['00000', '01010', '00000', '10001', '01110'] },
  SAD: { 이름: '슬픔', 점: ['00000', '01010', '00000', '01110', '10001'] },
  YES: { 이름: '체크', 점: ['00000', '00001', '00010', '10100', '01000'] },
  NO: { 이름: '엑스', 점: ['10001', '01010', '00100', '01010', '10001'] },
  ARROW_N: { 이름: '위 화살표', 점: ['00100', '01110', '10101', '00100', '00100'] },
};

export const 색 = {
  red: { 이름: '빨강', rgb: [255, 0, 0] },
  green: { 이름: '초록', rgb: [0, 255, 0] },
  blue: { 이름: '파랑', rgb: [0, 0, 255] },
  yellow: { 이름: '노랑', rgb: [255, 200, 0] },
  purple: { 이름: '보라', rgb: [160, 0, 255] },
  white: { 이름: '흰색', rgb: [255, 255, 255] },
};

/** 「으로/로」 — 받침이 없거나 ㄹ 받침이면 「로」 (보라로, 파랑으로, 흰색으로, 빨강으로) */
export function 으로(말) {
  const c =말.charCodeAt(말.length - 1) - 0xac00;
  if (c < 0 || c > 11171) return 말 + '(으)로';
  const 받침 = c % 28;
  return 말 + (받침 === 0 || 받침 === 8 ? '로' : '으로');
}

export const 음 = { 262: '도', 294: '레', 330: '미', 349: '파', 392: '솔', 440: '라', 494: '시', 523: '높은 도' };

/* ───────────── 동작 ─────────────
   { out, act, arg }
   display: icon(아이콘 열쇠) | clear       (마이크로비트)
   led:     on | off                       (아두이노)
   sound:   tone(Hz) | follow(센서) | stop
   servo:   angle(0~180) | follow(센서)
   pixel:   color(색 열쇠) | off */

/** 이 보드에서 쓸 수 있는 동작 목록 (화면의 고르기 상자에 쓴다) */
export function 동작목록(보드id) {
  const b = 보드[보드id];
  const out = [];
  if (b.출력.display) {
    for (const [k, v] of Object.entries(아이콘)) out.push({ out: 'display', act: 'icon', arg: k, 글: `LED 화면에 ${v.이름} 보이기` });
    out.push({ out: 'display', act: 'clear', 글: 'LED 화면 지우기' });
  }
  if (b.출력.led) {
    out.push({ out: 'led', act: 'on', 글: 'LED 켜기' });
    out.push({ out: 'led', act: 'off', 글: 'LED 끄기' });
  }
  const 소리이름 = b.출력.sound.이름;
  for (const [hz, n] of Object.entries(음)) out.push({ out: 'sound', act: 'tone', arg: Number(hz), 글: `${으로(소리이름)} 「${n}」 소리 내기` });
  out.push({ out: 'sound', act: 'stop', 글: `${소리이름} 끄기` });
  for (const a of [0, 45, 90, 135, 180]) out.push({ out: 'servo', act: 'angle', arg: a, 글: `서보를 ${a}도로` });
  for (const [k, v] of Object.entries(색)) out.push({ out: 'pixel', act: 'color', arg: k, 글: `네오픽셀을 ${으로(v.이름)}` });
  out.push({ out: 'pixel', act: 'off', 글: '네오픽셀 끄기' });
  for (const [k, s] of Object.entries(b.센서)) {
    if (s.kind !== 'range') continue;
    out.push({ out: 'servo', act: 'follow', arg: k, 글: `서보 각도가 「${s.이름}」 값을 따라가게` });
    out.push({ out: 'sound', act: 'follow', arg: k, 글: `소리 높이가 「${s.이름}」 값을 따라가게` });
  }
  return out;
}

export const 동작열쇠 = (a) => (a ? `${a.out}:${a.act}:${a.arg ?? ''}` : '');
export function 열쇠로동작(보드id, k) {
  if (!k) return null;
  return 동작목록(보드id).find((a) => 동작열쇠(a) === k) ?? null;
}

/* ───────────── 시뮬레이션 ───────────── */

export function 처음출력() {
  return { display: null, led: false, sound: 0, servo: 90, pixel: null };
}

/** 센서 값을 0~1 비율로 (따라가기 동작에 쓴다) */
function 비율(s, v) {
  return Math.max(0, Math.min(1, (v - s.min) / (s.max - s.min)));
}

function 실행(보드id, a, 센서값, 출력) {
  const b = 보드[보드id];
  if (!a) return;
  if (a.out === 'display') 출력.display = a.act === 'icon' ? a.arg : null;
  else if (a.out === 'led') 출력.led = a.act === 'on';
  else if (a.out === 'sound') {
    if (a.act === 'tone') 출력.sound = a.arg;
    else if (a.act === 'stop') 출력.sound = 0;
    else 출력.sound = Math.round(200 + 비율(b.센서[a.arg], 센서값[a.arg]) * 800);
  } else if (a.out === 'servo') {
    if (a.act === 'angle') 출력.servo = a.arg;
    else 출력.servo = Math.round(비율(b.센서[a.arg], 센서값[a.arg]) * 180);
  } else if (a.out === 'pixel') 출력.pixel = a.act === 'color' ? a.arg : null;
}

/** 조건이 참인가. 「항상」 규칙은 when 이 없다. */
export function 조건참(when, 센서값) {
  if (!when) return true;
  const v = 센서값[when.sensor];
  if (when.op === 'pressed') return !!v;
  if (when.op === 'notpressed') return !v;
  if (when.op === '<') return v < when.value;
  if (when.op === '>') return v > when.value;
  return false;
}

/** 규칙이 이 보드에서 쓸 수 있는가 — 쓸 수 없는 까닭을 글로 돌려준다 (없으면 null) */
export function 규칙점검(보드id, r) {
  const b = 보드[보드id];
  if (r.when) {
    const s = b.센서[r.when.sensor];
    if (!s) return `${b.이름}에는 이 센서가 없다`;
    if (s.kind === 'button' && !['pressed', 'notpressed'].includes(r.when.op)) return '버튼은 「눌렸을 때」로 비교한다';
    if (s.kind === 'range' && !['<', '>'].includes(r.when.op)) return '숫자 센서는 「보다 작으면/크면」으로 비교한다';
    if (s.kind === 'range' && (r.when.value < s.min || r.when.value > s.max)) {
      return `${s.이름} 값은 ${s.min}~${s.max} 사이다 — ${r.when.value} 는 나올 수 없다`;
    }
  }
  for (const a of [r.then, r.else]) {
    if (!a) continue;
    if (!b.출력[a.out]) return `${b.이름}의 출력에 맞지 않는 동작이다 (${a.out === 'display' ? 'LED 화면은 마이크로비트에만' : 'LED 하나는 아두이노 쪽 동작'})`;
    if (a.act === 'follow' && !b.센서[a.arg]) return `${b.이름}에는 따라갈 센서가 없다`;
  }
  return null;
}

/**
 * 한 박자 계산 — 위 규칙부터 차례로 실행한다. 같은 출력을 두 규칙이 건드리면
 * 아래 규칙이 이긴다. 실제 코드도 위에서 아래로 실행되므로 결과가 같다.
 * 출력은 이전 상태를 이어받는다(아무 규칙도 건드리지 않으면 그대로 남는다 — 실제 보드와 같다).
 */
export function 한박자(보드id, 규칙들, 센서값, 이전출력 = 처음출력()) {
  const 출력 = { ...이전출력 };
  for (const r of 규칙들) {
    if (규칙점검(보드id, r)) continue;
    실행(보드id, 조건참(r.when, 센서값) ? r.then : r.else, 센서값, 출력);
  }
  return 출력;
}

export function 처음센서값(보드id) {
  const o = {};
  for (const [k, s] of Object.entries(보드[보드id].센서)) o[k] = s.kind === 'button' ? false : s.처음;
  return o;
}

/* ───────────── 미션 채점 ─────────────
   mission.tests: [{ 설명, 센서: { light: 0.05 | 숫자 }, 기대: { led: true } }]
   range 센서 값을 0~1 사이 소수(비율)로 적으면 보드의 범위로 바꿔 넣는다.
   한 사례는 처음 상태에서 박자를 세 번 돌린 뒤의 출력을 본다. */
export function 미션채점(보드id, 규칙들, mission) {
  const b = 보드[보드id];
  const 결과 = [];
  if (mission.boards && !mission.boards.includes(보드id)) {
    return { 통과: false, 결과: [{ ok: false, 글: `이 미션은 ${mission.boards.map((x) => 보드[x].이름).join('·')}로 풀어야 한다 — ${b.이름}에는 필요한 부품이 없다` }] };
  }
  let 출력 = 처음출력();
  for (const t of mission.tests) {
    const 센서값 = 처음센서값(보드id);
    for (const [k, v] of Object.entries(t.센서 ?? {})) {
      const s = b.센서[k];
      if (!s) continue;
      센서값[k] = s.kind === 'range' && typeof v === 'number' && v > 0 && v < 1 && !Number.isInteger(v) ? Math.round(s.min + v * (s.max - s.min)) : v;
    }
    /* 미션의 사례는 차례로 이어진다 — 앞 사례의 출력이 남아 있는 상태에서 다음 사례를 본다.
       그래야 「어두우면 켜고, 밝으면 끈다」에서 «끄기»를 빠뜨린 규칙이 걸린다. */
    for (let i = 0; i < 3; i++) 출력 = 한박자(보드id, 규칙들, 센서값, 출력);
    const 틀림 = Object.entries(t.기대).filter(([k, v]) => {
      if (k === 'servoMin') return 출력.servo < v;
      if (k === 'servoMax') return 출력.servo > v;
      if (k === 'soundOn') return v ? 출력.sound === 0 : 출력.sound !== 0;
      return 출력[k] !== v;
    });
    결과.push({ ok: 틀림.length === 0, 글: t.설명, 센서값 });
  }
  const 더 = 추가검사(보드id, 규칙들, mission);
  if (더) 결과.push(더);
  return { 통과: 결과.every((r) => r.ok), 결과 };
}

/* ───────────── 코드 생성 ───────────── */

function py조건(보드id, w) {
  if (!w) return null;
  const s = 보드[보드id].센서[w.sensor];
  if (w.op === 'pressed') return s.py;
  if (w.op === 'notpressed') return `not ${s.py}`;
  return `${s.py} ${w.op} ${w.value}`;
}
function c조건(보드id, w) {
  if (!w) return null;
  const s = 보드[보드id].센서[w.sensor];
  if (w.op === 'pressed') return s.c;
  if (w.op === 'notpressed') return `!(${s.c})`;
  return `${s.c} ${w.op} ${w.value}`;
}

/** 서보 각도(0~180) → 마이크로비트 write_analog 값. 20ms 주기에서 0.5ms~2.5ms 펄스 */
export const 서보값 = (각) => Math.round(1023 * (0.5 + (각 / 180) * 2) / 20);

function py동작(보드id, a) {
  const b = 보드[보드id];
  if (a.out === 'display') return a.act === 'icon' ? [`display.show(Image.${a.arg})`] : ['display.clear()'];
  if (a.out === 'sound') {
    if (a.act === 'tone') return [`music.pitch(${a.arg})  # ${음[a.arg]}`];
    if (a.act === 'stop') return ['music.stop()'];
    const s = b.센서[a.arg];
    return [`music.pitch(int(200 + (${s.py} - (${s.min})) * 800 / ${s.max - s.min}))`];
  }
  if (a.out === 'servo') {
    if (a.act === 'angle') return [`pin1.write_analog(${서보값(a.arg)})  # ${a.arg}도`];
    const s = b.센서[a.arg];
    return [`pin1.write_analog(${서보값(0)} + int(max(0, min(${s.max - s.min}, ${s.py} - (${s.min}))) * ${서보값(180) - 서보값(0)} / ${s.max - s.min}))`];
  }
  if (a.out === 'pixel') {
    const rgb = a.act === 'color' ? 색[a.arg].rgb : [0, 0, 0];
    return ['for i in range(8):', `    np[i] = (${rgb.join(', ')})`, 'np.show()'];
  }
  throw new Error(`마이크로비트에서 쓸 수 없는 동작 ${동작열쇠(a)}`);
}

function c동작(보드id, a) {
  const b = 보드[보드id];
  if (a.out === 'led') return [`digitalWrite(13, ${a.act === 'on' ? 'HIGH' : 'LOW'});`];
  if (a.out === 'sound') {
    if (a.act === 'tone') return [`tone(8, ${a.arg});  // ${음[a.arg]}`];
    if (a.act === 'stop') return ['noTone(8);'];
    const s = b.센서[a.arg];
    return [`tone(8, map(constrain(${s.c}, ${s.min}, ${s.max}), ${s.min}, ${s.max}, 200, 1000));`];
  }
  if (a.out === 'servo') {
    if (a.act === 'angle') return [`servo.write(${a.arg});`];
    const s = b.센서[a.arg];
    return [`servo.write(map(constrain(${s.c}, ${s.min}, ${s.max}), ${s.min}, ${s.max}, 0, 180));`];
  }
  if (a.out === 'pixel') {
    const rgb = a.act === 'color' ? 색[a.arg].rgb : [0, 0, 0];
    return [`strip.fill(strip.Color(${rgb.join(', ')}));`, 'strip.show();'];
  }
  throw new Error(`아두이노에서 쓸 수 없는 동작 ${동작열쇠(a)}`);
}

function 쓰는것(규칙들) {
  const 출력 = new Set();
  const 센서 = new Set();
  for (const r of 규칙들) {
    if (r.when) 센서.add(r.when.sensor);
    for (const a of [r.then, r.else]) {
      if (!a) continue;
      출력.add(a.out);
      if (a.act === 'follow') 센서.add(a.arg);
    }
  }
  return { 출력, 센서 };
}

/** 규칙 → 진짜 보드에 올릴 코드. 쓸 수 없는 규칙은 주석으로 남기고 건너뛴다. */
export function 코드만들기(보드id, 규칙들) {
  const 좋은규칙 = 규칙들.filter((r) => !규칙점검(보드id, r) && (r.then || r.else));
  const 빠진 = 규칙들.length - 좋은규칙.length;
  const { 출력, 센서 } = 쓰는것(좋은규칙);
  const L = [];
  if (보드id === 'microbit') {
    L.push('# 「소프트웨어와 생활」 가상 보드에서 만든 코드 — 마이크로비트 v2 (MicroPython)');
    L.push('from microbit import *');
    if (출력.has('sound')) L.push('import music');
    if (출력.has('pixel')) L.push('import neopixel');
    L.push('');
    if (출력.has('pixel')) L.push('np = neopixel.NeoPixel(pin2, 8)   # 핀 2에 네오픽셀 8개');
    if (출력.has('servo')) L.push('pin1.set_analog_period(20)       # 핀 1의 서보 모터: 20ms 주기');
    if (빠진) L.push(`# 이 보드에서 쓸 수 없는 규칙 ${빠진}개는 넣지 않았다`);
    if (출력.has('pixel') || 출력.has('servo') || 빠진) L.push('');
    L.push('while True:');
    if (!좋은규칙.length) L.push('    pass');
    좋은규칙.forEach((r, i) => {
      L.push(`    # 규칙 ${i + 1}`);
      const 조건 = py조건('microbit', r.when);
      const 그러면 = r.then ? py동작('microbit', r.then) : ['pass'];
      if (!조건) {
        for (const x of 그러면) L.push('    ' + x);
        return;
      }
      L.push(`    if ${조건}:`);
      for (const x of 그러면) L.push('        ' + x);
      if (r.else) {
        L.push('    else:');
        for (const x of py동작('microbit', r.else)) L.push('        ' + x);
      }
    });
    L.push('    sleep(100)');
    return L.join('\n') + '\n';
  }

  L.push('// 「소프트웨어와 생활」 가상 보드에서 만든 코드 — 아두이노 우노');
  if (출력.has('servo')) L.push('#include <Servo.h>');
  if (출력.has('pixel')) L.push('#include <Adafruit_NeoPixel.h>   // 라이브러리 관리자에서 설치');
  L.push('');
  if (출력.has('servo')) L.push('Servo servo;');
  if (출력.has('pixel')) L.push('Adafruit_NeoPixel strip(8, 7, NEO_GRB + NEO_KHZ800);   // 7번 핀에 8개');
  if (빠진) L.push(`// 이 보드에서 쓸 수 없는 규칙 ${빠진}개는 넣지 않았다`);
  if (센서.has('distance')) {
    L.push('', '// 초음파 센서: 소리를 쏘고 되돌아오는 시간으로 거리(cm)를 잰다', 'long readDistance() {',
      '  digitalWrite(9, LOW);', '  delayMicroseconds(2);', '  digitalWrite(9, HIGH);', '  delayMicroseconds(10);',
      '  digitalWrite(9, LOW);', '  long t = pulseIn(10, HIGH, 30000);',
      '  // 메아리가 안 돌아오면 t 가 0 이다. 그대로 쓰면 「0cm — 아주 가깝다」로 읽힌다.',
      '  if (t == 0) return 999;',
      '  return t * 0.034 / 2;', '}');
  }
  if (센서.has('temp')) {
    L.push('', '// TMP36: 0.5V 가 0℃, 10mV 마다 1℃', 'float readTemp() {', '  float v = analogRead(A1) * 5.0 / 1024.0;', '  return (v - 0.5) * 100.0;', '}');
  }
  L.push('', 'void setup() {');
  if (센서.has('btn')) L.push('  pinMode(2, INPUT_PULLUP);   // 버튼: 누르면 LOW');
  if (센서.has('distance')) L.push('  pinMode(9, OUTPUT);', '  pinMode(10, INPUT);');
  if (출력.has('led')) L.push('  pinMode(13, OUTPUT);');
  if (출력.has('servo')) L.push('  servo.attach(6);');
  if (출력.has('pixel')) L.push('  strip.begin();');
  L.push('}', '', 'void loop() {');
  좋은규칙.forEach((r, i) => {
    L.push(`  // 규칙 ${i + 1}`);
    const 조건 = c조건('arduino', r.when);
    const 그러면 = r.then ? c동작('arduino', r.then) : [];
    if (!조건) {
      for (const x of 그러면) L.push('  ' + x);
      return;
    }
    L.push(`  if (${조건}) {`);
    for (const x of 그러면) L.push('    ' + x);
    if (r.else) {
      L.push('  } else {');
      for (const x of c동작('arduino', r.else)) L.push('    ' + x);
    }
    L.push('  }');
  });
  L.push('  delay(100);', '}');
  return L.join('\n') + '\n';
}

/* ───────────── 미션 ─────────────
   차시 본문에서 <BoardSim mission="streetlight" /> 처럼 열쇠로 부른다.
   정답 규칙은 이 파일에 두지 않는다 (화면 묶음에 실려 학생에게 보이므로) — tools/check-boardsim.mjs 에 있다. */
export const 미션 = {
  heart: {
    제목: '버튼을 누르면 하트',
    설명: '버튼 A를 누르는 동안 LED 화면에 하트가 보이고, 떼면 지워지게 하자.',
    boards: ['microbit'],
    tests: [
      { 설명: '버튼을 누르면 하트가 보인다', 센서: { btnA: true }, 기대: { display: 'HEART' } },
      { 설명: '버튼을 떼면 화면이 지워진다', 센서: { btnA: false }, 기대: { display: null } },
    ],
  },
  blink13: {
    제목: '버튼을 누르면 LED',
    설명: '버튼을 누르는 동안 LED가 켜지고, 떼면 꺼지게 하자.',
    boards: ['arduino'],
    tests: [
      { 설명: '버튼을 누르면 LED가 켜진다', 센서: { btn: true }, 기대: { led: true } },
      { 설명: '버튼을 떼면 LED가 꺼진다', 센서: { btn: false }, 기대: { led: false } },
    ],
  },
  streetlight: {
    제목: '스마트 가로등',
    설명: '어두워지면 네오픽셀이 흰색으로 켜지고, 밝아지면 꺼지게 하자. 마이크로비트와 아두이노 어느 쪽으로도 풀 수 있다.',
    tests: [
      { 설명: '아주 어두울 때(밤) 불이 켜진다', 센서: { light: 0.05 }, 기대: { pixel: 'white' } },
      { 설명: '아주 밝을 때(낮) 불이 꺼진다', 센서: { light: 0.85 }, 기대: { pixel: null } },
      { 설명: '다시 어두워지면 또 켜진다', 센서: { light: 0.08 }, 기대: { pixel: 'white' } },
    ],
  },
  parking: {
    제목: '주차 차단기',
    설명: '차가 20cm 보다 가까이 오면 차단기(서보)가 90도로 열리고, 멀어지면 0도로 닫히게 하자.',
    boards: ['arduino'],
    tests: [
      { 설명: '차가 10cm 앞에 오면 열린다', 센서: { distance: 10 }, 기대: { servo: 90 } },
      { 설명: '차가 150cm 떨어져 있으면 닫힌다', 센서: { distance: 150 }, 기대: { servo: 0 } },
      { 설명: '차가 다시 15cm 로 오면 열린다', 센서: { distance: 15 }, 기대: { servo: 90 } },
    ],
  },
  heatalarm: {
    제목: '더위 경보',
    설명: '온도가 30℃ 를 넘으면 「라」 소리로 경보를 울리고 네오픽셀을 빨강으로, 그렇지 않으면 소리를 끄고 초록으로 두자.',
    tests: [
      { 설명: '35℃ 에서 경보가 울린다', 센서: { temp: 35 }, 기대: { soundOn: true, pixel: 'red' } },
      { 설명: '22℃ 에서 조용하고 초록이다', 센서: { temp: 22 }, 기대: { soundOn: false, pixel: 'green' } },
    ],
  },
  theremin: {
    제목: '빛으로 연주하는 악기',
    설명: '손으로 빛 센서를 가릴수록 소리가 낮아지는 악기를 만들자. 소리 높이가 빛 값을 따라가게 하면 된다.',
    tests: [
      { 설명: '어두우면 낮은 소리', 센서: { light: 0.1 }, 기대: { soundOn: true } },
      { 설명: '밝으면 높은 소리', 센서: { light: 0.9 }, 기대: { soundOn: true } },
    ],
    추가검사: 'pitchRises',
  },
  fall: {
    제목: '넘어짐 알림 밴드',
    설명: '웨어러블 밴드를 찬 사람이 크게 기울면(기울기 값이 700보다 크면) 「높은 도」 경보와 함께 LED 화면에 엑스를 띄우고, 바로 서면 소리를 끄고 화면을 지우자.',
    boards: ['microbit'],
    tests: [
      { 설명: '크게 기울면 경보와 엑스', 센서: { tilt: 900 }, 기대: { soundOn: true, display: 'NO' } },
      { 설명: '바로 서면 조용하고 화면이 꺼진다', 센서: { tilt: 0 }, 기대: { soundOn: false, display: null } },
    ],
  },
};

/** 미션의 추가 검사 — 소리 높이가 센서를 따라 올라가는가 */
export function 추가검사(보드id, 규칙들, mission) {
  if (mission.추가검사 !== 'pitchRises') return null;
  const s = 보드[보드id].센서.light;
  if (!s) return null;
  const 어둠 = 한박자(보드id, 규칙들, { ...처음센서값(보드id), light: Math.round(s.min + 0.1 * (s.max - s.min)) });
  const 밝음 = 한박자(보드id, 규칙들, { ...처음센서값(보드id), light: Math.round(s.min + 0.9 * (s.max - s.min)) });
  return { ok: 밝음.sound > 어둠.sound, 글: '밝을수록 소리가 높아진다' };
}
