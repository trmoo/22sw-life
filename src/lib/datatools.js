// © 2026 티쳐무 · 모든 권리 보유 — 고등학교 「소프트웨어와 생활」 웹 교과서
/**
 * Ⅲ단원 데이터 도구 — 표 읽기 · 통계 · 그래프 (DOM 없음)
 *
 * 화면의 실험실(CleanLab·StatLab·ChartLab·DeidLab)이 함께 쓴다.
 * 파이썬(판다스)이 내려받히지 않는 교실에서도 정제·분석·시각화를 해 볼 수 있게
 * 같은 계산을 자바스크립트로 한 번 더 만들었다.
 *
 * ⚠ 계산은 판다스와 같은 값을 내야 한다 — 표준편차는 n-1 로 나누고(pandas 기본),
 *   사분위수는 선형 보간(pandas 기본)이다. tools/check-datatools.mjs 가
 *   tools/data-golden.json(판다스로 계산한 값)과 대조한다.
 */

/* ------------------------------------------------------------ 표 읽기 */

/** CSV 글을 { 열: [이름…], 행: [{이름: 글}…] } 로 읽는다. 큰따옴표로 감싼 칸도 읽는다. */
export function CSV읽기(글) {
  const 줄들 = [];
  let 칸 = '';
  let 줄 = [];
  let 따옴표 = false;
  const s = String(글).replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (따옴표) {
      if (c === '"' && s[i + 1] === '"') { 칸 += '"'; i++; }
      else if (c === '"') 따옴표 = false;
      else 칸 += c;
    } else if (c === '"') 따옴표 = true;
    else if (c === ',') { 줄.push(칸); 칸 = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      줄.push(칸); 줄들.push(줄); 줄 = []; 칸 = '';
    } else 칸 += c;
  }
  if (칸 !== '' || 줄.length) { 줄.push(칸); 줄들.push(줄); }
  const 남은 = 줄들.filter((r) => r.length > 1 || r[0] !== '');
  const 열 = 남은[0] ?? [];
  const 행 = 남은.slice(1).map((r) => Object.fromEntries(열.map((k, j) => [k, r[j] ?? ''])));
  return { 열, 행 };
}

/** 표를 다시 CSV 글로 쓴다 (정제한 결과를 내려받을 때) */
export function CSV쓰기(열, 행) {
  const 감싸기 = (v) => {
    const t = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return [열.join(','), ...행.map((r) => 열.map((k) => 감싸기(r[k])).join(','))].join('\n') + '\n';
}

/** 글 한 칸을 숫자로. 빈칸은 null, 숫자가 아니면 NaN (판다스의 NaN 과 «숫자로 못 읽음»을 가른다) */
export function 숫자로(v) {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

/** 열의 갈래를 짐작한다 — 화면의 열 이름표(수치·범주·날짜)에 쓴다 */
export function 열갈래(행, 열이름) {
  const 값 = 행.map((r) => r[열이름]).filter((v) => String(v ?? '').trim() !== '');
  if (!값.length) return '빈 열';
  if (값.every((v) => /^\d{4}-\d{2}-\d{2}$/.test(v))) return '날짜';
  const 숫자 = 값.filter((v) => Number.isFinite(Number(v))).length;
  if (숫자 === 값.length) return '수치';
  if (숫자 >= 값.length * 0.8) return '수치?'; // 대부분 숫자인데 몇 칸이 아니다 — 정제할 거리
  return '범주';
}

/* ------------------------------------------------------------ 통계 */

const 깨끗한 = (xs) => xs.filter((x) => typeof x === 'number' && Number.isFinite(x));

export function 합(xs) {
  return 깨끗한(xs).reduce((a, b) => a + b, 0);
}
export function 평균(xs) {
  const v = 깨끗한(xs);
  return v.length ? 합(v) / v.length : NaN;
}
/** 판다스 quantile 의 기본(선형 보간)과 같다 */
export function 분위수(xs, q) {
  const v = 깨끗한(xs).sort((a, b) => a - b);
  if (!v.length) return NaN;
  const p = (v.length - 1) * q;
  const lo = Math.floor(p);
  const hi = Math.ceil(p);
  return v[lo] + (v[hi] - v[lo]) * (p - lo);
}
export const 중앙값 = (xs) => 분위수(xs, 0.5);
export function 최솟값(xs) {
  const v = 깨끗한(xs);
  return v.length ? Math.min(...v) : NaN;
}
export function 최댓값(xs) {
  const v = 깨끗한(xs);
  return v.length ? Math.max(...v) : NaN;
}
/** 표본 표준편차(n-1) — 판다스 std() 의 기본값 */
export function 표준편차(xs) {
  const v = 깨끗한(xs);
  if (v.length < 2) return NaN;
  const m = 평균(v);
  return Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / (v.length - 1));
}
/** 피어슨 상관 계수. 둘 중 하나라도 비어 있는 줄은 뺀다(판다스 corr 과 같다) */
export function 상관(xs, ys) {
  const 짝 = [];
  for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
    if (Number.isFinite(xs[i]) && Number.isFinite(ys[i])) 짝.push([xs[i], ys[i]]);
  }
  if (짝.length < 2) return NaN;
  const mx = 평균(짝.map((p) => p[0]));
  const my = 평균(짝.map((p) => p[1]));
  let sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of 짝) {
    sxy += (x - mx) * (y - my);
    sxx += (x - mx) ** 2;
    syy += (y - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}
/** 상관 계수를 말로 — 화면 풀이에 쓴다. 기준은 흔히 쓰는 어림 기준이며 절대 규칙이 아니다 */
export function 상관말(r) {
  if (!Number.isFinite(r)) return '계산할 수 없다';
  const a = Math.abs(r);
  const 세기 = a >= 0.7 ? '강한' : a >= 0.4 ? '뚜렷한' : a >= 0.2 ? '약한' : '거의 없는';
  if (세기 === '거의 없는') return '직선 관계가 거의 없다';
  return `${세기} ${r > 0 ? '양의' : '음의'} 상관`;
}

/** 열 하나의 요약 — 판다스 describe() 에서 고른 것 */
export function 요약(xs) {
  const v = 깨끗한(xs);
  return {
    개수: v.length, 평균: 평균(v), 표준편차: 표준편차(v), 최솟값: 최솟값(v),
    q1: 분위수(v, 0.25), 중앙값: 중앙값(v), q3: 분위수(v, 0.75), 최댓값: 최댓값(v),
  };
}

/** 묶음별 평균. 차례는 순서목록을 따르고(요일·계절), 없으면 처음 나온 차례 */
export function 묶음평균(행, 묶을열, 값열, 순서목록) {
  const 모음 = new Map();
  for (const r of 행) {
    const k = r[묶을열];
    const x = 숫자로(r[값열]);
    if (!Number.isFinite(x)) continue;
    if (!모음.has(k)) 모음.set(k, []);
    모음.get(k).push(x);
  }
  const 키들 = 순서목록 ? 순서목록.filter((k) => 모음.has(k)) : [...모음.keys()];
  return 키들.map((k) => ({ 이름: k, 평균: 평균(모음.get(k)), 개수: 모음.get(k).length, 합: 합(모음.get(k)) }));
}

export const 차례 = {
  요일: ['월', '화', '수', '목', '금', '토', '일'],
  계절: ['봄', '여름', '가을', '겨울'],
  월: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
};

/* 화면에 숫자를 적을 때 — 소수 자리를 정해 천 단위 쉼표를 붙인다 */
export function 수(x, 자리 = 1) {
  if (!Number.isFinite(x)) return '—';
  return x.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 자리 });
}

/* ------------------------------------------------------------ 그래프 (SVG 글) */

/** 보기 좋은 눈금 — 0·1·2·5 단위로 끊는다 */
export function 눈금(lo, hi, 개수 = 5) {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (lo === hi) { lo -= 1; hi += 1; }
  const 거친 = (hi - lo) / 개수;
  const 크기 = 10 ** Math.floor(Math.log10(거친));
  const 단위 = [1, 2, 2.5, 5, 10].map((m) => m * 크기).find((s) => s >= 거친) ?? 10 * 크기;
  const 시작 = Math.floor(lo / 단위) * 단위;
  const 끝 = Math.ceil(hi / 단위) * 단위;
  const out = [];
  for (let t = 시작; t <= 끝 + 단위 / 2; t += 단위) out.push(Math.round(t * 1e6) / 1e6);
  return out;
}

const 이스케이프 = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const 판 = { w: 640, h: 340, l: 64, r: 18, t: 22, b: 52 };

function 틀(제목줄, x이름, y이름, 안쪽) {
  const { w, h, l, b } = 판;
  return (
    `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${이스케이프(제목줄)}" font-family="inherit">` +
    안쪽 +
    `<text x="${(l + w - 판.r) / 2}" y="${h - 8}" text-anchor="middle" font-size="14" font-weight="700" fill="#334155">${이스케이프(x이름)}</text>` +
    `<text x="16" y="${(판.t + h - b) / 2}" text-anchor="middle" font-size="14" font-weight="700" fill="#334155" transform="rotate(-90 16 ${(판.t + h - b) / 2})">${이스케이프(y이름)}</text>` +
    `</svg>`
  );
}

function y축(lo, hi, yMin) {
  const { w, h, l, r, t, b } = 판;
  const ts = 눈금(yMin ?? lo, hi);
  const y0 = ts[0];
  const y1 = ts[ts.length - 1];
  const Y = (v) => t + (h - t - b) * (1 - (v - y0) / (y1 - y0 || 1));
  let s = '';
  for (const v of ts) {
    s += `<line x1="${l}" x2="${w - r}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e2e8f0" />`;
    s += `<text x="${l - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="12" fill="#64748b">${수(v, 1)}</text>`;
  }
  return { s, Y, y0, y1 };
}

/**
 * 꺾은선 — 시간에 따른 변화
 * @param 점들 [{이름, 값}] 차례대로
 * @param 옵션 { y이름, x이름, y0부터 (y축을 0에서 시작) }
 */
export function 꺾은선(점들, 옵션 = {}) {
  const { w, h, l, r, b } = 판;
  const 값 = 점들.map((p) => p.값);
  const lo = 최솟값(값);
  const hi = 최댓값(값);
  const ax = y축(lo, hi, 옵션.y0부터 === false ? lo : Math.min(0, lo));
  const X = (i) => l + ((w - l - r) * (i + 0.5)) / 점들.length;
  const 건너 = Math.max(1, Math.ceil(점들.length / 12));
  let s = ax.s;
  s += `<polyline fill="none" stroke="#b4492b" stroke-width="${점들.length > 60 ? 1.6 : 2.6}" points="${점들.map((p, i) => `${X(i)},${ax.Y(p.값)}`).join(' ')}" />`;
  if (점들.length <= 40) for (const [i, p] of 점들.entries()) s += `<circle cx="${X(i)}" cy="${ax.Y(p.값)}" r="3.5" fill="#b4492b" />`;
  점들.forEach((p, i) => {
    /* 점이 많으면(날마다) 이름이 붙은 점(매달 1일)에만 눈금 글을 단다 */
    const 보임 = 점들.length > 40 ? p.이름 !== '' : i % 건너 === 0;
    if (보임) s += `<text x="${X(i)}" y="${h - b + 18}" text-anchor="middle" font-size="12" fill="#64748b">${이스케이프(p.이름)}</text>`;
  });
  return 틀('꺾은선 그래프', 옵션.x이름 ?? '', 옵션.y이름 ?? '', s);
}

/** 막대 — 묶음끼리 비교 */
export function 막대(점들, 옵션 = {}) {
  const { w, h, l, r, b } = 판;
  const 값 = 점들.map((p) => p.값);
  const lo = 최솟값(값);
  const hi = 최댓값(값);
  const 바닥 = 옵션.y0부터 === false ? lo - (hi - lo) * 0.15 : Math.min(0, lo);
  const ax = y축(lo, hi, 바닥);
  const 칸 = (w - l - r) / 점들.length;
  let s = ax.s;
  점들.forEach((p, i) => {
    const x = l + 칸 * i + 칸 * 0.18;
    const y = ax.Y(Math.max(p.값, ax.y0));
    const 높이 = ax.Y(ax.y0) - y;
    const 강조 = 옵션.강조 && 옵션.강조.includes(p.이름);
    s += `<rect x="${x}" y="${y}" width="${칸 * 0.64}" height="${Math.max(0, 높이)}" rx="3" fill="${강조 ? '#b4492b' : '#94a3b8'}" />`;
    s += `<text x="${x + 칸 * 0.32}" y="${y - 5}" text-anchor="middle" font-size="12" font-weight="700" fill="#334155">${수(p.값, 0)}</text>`;
    s += `<text x="${x + 칸 * 0.32}" y="${h - b + 18}" text-anchor="middle" font-size="13" fill="#475569">${이스케이프(p.이름)}</text>`;
  });
  return 틀('막대그래프', 옵션.x이름 ?? '', 옵션.y이름 ?? '', s);
}

/** 구간 나누기 — 히스토그램용. 판다스·맷플롯립의 hist 처럼 같은 너비로 나누고 마지막 구간은 끝값을 포함한다 */
export function 구간세기(xs, 구간수 = 10) {
  const v = 깨끗한(xs);
  const lo = 최솟값(v);
  const hi = 최댓값(v);
  const 너비 = (hi - lo) / 구간수 || 1;
  const 칸 = Array.from({ length: 구간수 }, (_, i) => ({ 부터: lo + 너비 * i, 까지: lo + 너비 * (i + 1), 개수: 0 }));
  for (const x of v) 칸[Math.min(구간수 - 1, Math.floor((x - lo) / 너비))].개수++;
  return 칸;
}

/** 히스토그램 — 값이 어디에 몰려 있나(분포) */
export function 히스토그램(xs, 옵션 = {}) {
  const { w, h, l, r, b } = 판;
  const 칸 = 구간세기(xs, 옵션.구간수 ?? 10);
  const ax = y축(0, 최댓값(칸.map((c) => c.개수)), 0);
  const 너비 = (w - l - r) / 칸.length;
  let s = ax.s;
  칸.forEach((c, i) => {
    const y = ax.Y(c.개수);
    s += `<rect x="${l + 너비 * i + 1}" y="${y}" width="${너비 - 2}" height="${ax.Y(0) - y}" fill="#0f766e" opacity=".8" />`;
    if (c.개수) s += `<text x="${l + 너비 * (i + 0.5)}" y="${y - 4}" text-anchor="middle" font-size="11" fill="#334155">${c.개수}</text>`;
  });
  const 이름칸 = Math.max(1, Math.ceil(칸.length / 6));
  for (let i = 0; i <= 칸.length; i += 이름칸) {
    const v = i < 칸.length ? 칸[i].부터 : 칸[칸.length - 1].까지;
    s += `<text x="${l + 너비 * i}" y="${h - b + 18}" text-anchor="middle" font-size="12" fill="#64748b">${수(v, 0)}</text>`;
  }
  return 틀('히스토그램', 옵션.x이름 ?? '', 옵션.y이름 ?? '날짜 수(일)', s);
}

/** 산점도 — 두 값이 함께 움직이나(관계). 짝이 하나라도 비면 그 점은 찍지 않는다 */
export function 산점도(xs, ys, 옵션 = {}) {
  const { w, h, l, r, b } = 판;
  const 짝 = xs.map((x, i) => [x, ys[i]]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  const ax = y축(최솟값(짝.map((p) => p[1])), 최댓값(짝.map((p) => p[1])), Math.min(0, 최솟값(짝.map((p) => p[1]))));
  const xt = 눈금(최솟값(짝.map((p) => p[0])), 최댓값(짝.map((p) => p[0])));
  const X = (v) => l + ((w - l - r) * (v - xt[0])) / (xt[xt.length - 1] - xt[0] || 1);
  let s = ax.s;
  for (const v of xt) s += `<text x="${X(v)}" y="${h - b + 18}" text-anchor="middle" font-size="12" fill="#64748b">${수(v, 1)}</text>`;
  for (const [x, y] of 짝) s += `<circle cx="${X(x)}" cy="${ax.Y(y)}" r="3.4" fill="#1d4ed8" opacity=".45" />`;
  return 틀('산점도', 옵션.x이름 ?? '', 옵션.y이름 ?? '', s);
}

/* ------------------------------------------------------------ 비식별화 */

/**
 * 비식별화 처리 — 열마다 방법을 골라 표를 바꾼다
 *   그대로 · 지우기(열을 뺀다) · 가리기(첫 글자만 남김) · 묶기(나이 → 10살 단위, 동네 → 구 단위 등)
 */
export const 묶는법 = {
  나이: (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? `${Math.floor(n / 10) * 10}대` : v;
  },
  전화: () => '010-****-****',
  학교: (v) => (v === '-' ? '-' : '고등학교'),
  자주쓰는대여소: (v) => (/역|시장/.test(v) ? '시내' : '동네'),
  동네: () => '새솔시',
  이름: (v) => String(v).slice(0, 1) + '**',
  성별: (v) => v,
};

export function 가리기(v) {
  const t = String(v);
  if (t.length <= 1) return '*';
  return t.slice(0, 1) + '*'.repeat(t.length - 1);
}

/**
 * 처리한 표에서 «같은 모습»의 사람이 몇 명씩인지 센다.
 * 남은 열의 값이 모두 같은 사람끼리 한 무리다. 무리가 1명이면 그 사람은 드러날 수 있다.
 * (k-익명성: 모든 무리가 k명 이상이면 «k-익명» 이라 한다)
 */
export function 무리크기(행, 남은열) {
  const 셈 = new Map();
  const 열쇠 = (r) => 남은열.map((k) => r[k]).join('\u0001');
  for (const r of 행) 셈.set(열쇠(r), (셈.get(열쇠(r)) ?? 0) + 1);
  return 행.map((r) => 셈.get(열쇠(r)));
}

export function 비식별처리(행, 방법) {
  const 남은열 = Object.keys(방법).filter((k) => 방법[k] !== '지우기');
  const 새행 = 행.map((r) => {
    const o = {};
    for (const k of 남은열) {
      const m = 방법[k];
      o[k] = m === '가리기' ? 가리기(r[k]) : m === '묶기' ? (묶는법[k] ?? ((v) => v))(r[k]) : r[k];
    }
    return o;
  });
  return { 남은열, 행: 새행, 무리: 무리크기(새행, 남은열) };
}

/**
 * 여러 선 — 같은 가로축에 계열 여러 개 (Ⅳ단원 시뮬레이션: S·I·R, 자전거 수, 줄 길이 …)
 * @param 계열들 [{ 이름, 값들: number[], 색, 점선? }]
 * @param 옵션 { x값들: (string|number)[], x이름, y이름, y최대, 눈금수, 세로선:[{x, 글}] }
 */
export function 여러선(계열들, 옵션 = {}) {
  const { w, h, l, r, b } = 판;
  const 길이 = Math.max(...계열들.map((c) => c.값들.length));
  const 모든값 = 계열들.flatMap((c) => c.값들).filter(Number.isFinite);
  const ax = y축(0, 옵션.y최대 ?? Math.max(1, ...모든값), 0);
  const X = (i) => l + ((w - l - r) * i) / Math.max(1, 길이 - 1);
  let s = ax.s;
  for (const 선 of 옵션.세로선 ?? []) {
    const x = X(선.x);
    s += `<line x1="${x}" x2="${x}" y1="${판.t}" y2="${h - b}" stroke="#94a3b8" stroke-dasharray="4 4" />`;
    if (선.글) s += `<text x="${x + 4}" y="${판.t + 12}" font-size="12" fill="#475569">${이스케이프(선.글)}</text>`;
  }
  for (const c of 계열들) {
    const pts = c.값들.map((v, i) => (Number.isFinite(v) ? `${X(i).toFixed(1)},${ax.Y(v).toFixed(1)}` : null)).filter(Boolean);
    s += `<polyline fill="none" stroke="${c.색}" stroke-width="2.6" ${c.점선 ? 'stroke-dasharray="6 5"' : ''} stroke-linejoin="round" points="${pts.join(' ')}" />`;
  }
  /* 가로 눈금 — 6개 안팎 */
  const xs = 옵션.x값들 ?? Array.from({ length: 길이 }, (_, i) => i);
  const 간격 = Math.max(1, Math.ceil(길이 / (옵션.눈금수 ?? 6)));
  for (let i = 0; i < 길이; i += 간격) {
    s += `<text x="${X(i)}" y="${h - b + 18}" text-anchor="middle" font-size="12" fill="#64748b">${이스케이프(xs[i])}</text>`;
  }
  /* 범례 — 오른쪽 위 */
  계열들.forEach((c, i) => {
    const y = 판.t + 6 + i * 18;
    s += `<line x1="${w - r - 118}" x2="${w - r - 96}" y1="${y}" y2="${y}" stroke="${c.색}" stroke-width="3" ${c.점선 ? 'stroke-dasharray="5 4"' : ''} />`;
    s += `<text x="${w - r - 90}" y="${y + 4}" font-size="12" fill="#334155">${이스케이프(c.이름)}</text>`;
  });
  return 틀('선 그래프', 옵션.x이름 ?? '', 옵션.y이름 ?? '', s);
}
