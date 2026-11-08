#!/usr/bin/env node
// © 2026 티쳐무 · 모든 권리 보유 — 고등학교 「소프트웨어와 생활」 웹 교과서
/**
 * Ⅲ단원 데이터 도구 점검
 *
 *   node tools/check-datatools.mjs
 *
 * src/lib/datatools.js 의 계산이 판다스와 같은 값을 내는지 본다.
 * 정답은 tools/make-data.py 가 판다스로 계산해 tools/data-golden.json 에 적어 둔 값이다.
 * 화면 실험실(자바스크립트)과 본문 파이썬 예제(판다스)가 다른 숫자를 보이면 학생이 헷갈린다.
 */
import { readFileSync } from 'node:fs';
import * as D from '../src/lib/datatools.js';

const golden = JSON.parse(readFileSync('tools/data-golden.json', 'utf8'));
const 오류 = [];
let 통과 = 0;
const 같다 = (이름, 실제, 기대, 허용 = 1e-3) => {
  if (Math.abs(실제 - 기대) <= 허용) 통과++;
  else 오류.push(`${이름}: 계산 ${실제} / 판다스 ${기대}`);
};
const 참 = (이름, 조건) => (조건 ? 통과++ : 오류.push(이름));

const bike = D.CSV읽기(readFileSync('public/data/bike.csv', 'utf8'));
참('bike.csv 행 수', bike.행.length === golden.행수);
const 열 = (k) => bike.행.map((r) => D.숫자로(r[k]));

for (const [k, g] of Object.entries(golden.요약)) {
  const s = D.요약(열(k));
  같다(`${k} 평균`, s.평균, g.평균);
  같다(`${k} 중앙값`, s.중앙값, g.중앙값);
  같다(`${k} 최솟값`, s.최솟값, g.최솟값);
  같다(`${k} 최댓값`, s.최댓값, g.최댓값);
  같다(`${k} 표준편차`, s.표준편차, g.표준편차);
  같다(`${k} q1`, s.q1, g.q1);
  같다(`${k} q3`, s.q3, g.q3);
}
for (const m of D.묶음평균(bike.행, '요일', '대여건수', D.차례.요일)) 같다(`요일 ${m.이름}`, m.평균, golden.요일평균[m.이름]);
for (const m of D.묶음평균(bike.행, '계절', '대여건수', D.차례.계절)) 같다(`계절 ${m.이름}`, m.평균, golden.계절평균[m.이름]);
for (const m of D.묶음평균(bike.행, '월', '대여건수', D.차례.월)) 같다(`${m.이름}월 합계`, m.합, golden.월합계[m.이름], 0);
for (const [k, g] of Object.entries(golden.상관)) {
  const [a, b] = k.split('~');
  같다(`상관 ${k}`, D.상관(열(a), 열(b)), g);
}

/* 정제 — 화면 CleanLab 이 쓰는 판정과 판다스 정제 결과가 같은가 */
const raw = D.CSV읽기(readFileSync('public/data/bike_raw.csv', 'utf8'));
const g = golden.정제;
참('raw 처음 행 수', raw.행.length === g.처음행수);
참('raw 처음 열 수', raw.열.length === g.처음열수);
참('raw 평균기온은 «수치?»(정제 거리)로 보인다', D.열갈래(raw.행, '평균기온') === '수치?');
참('raw 대여건수는 수치로 보인다', D.열갈래(raw.행, '대여건수') === '수치');

/* CSV 왕복 — 쓰고 다시 읽으면 같아야 한다 */
const 다시 = D.CSV읽기(D.CSV쓰기(raw.열, raw.행));
참('CSV 쓰기→읽기 왕복', JSON.stringify(다시) === JSON.stringify(raw));
참('따옴표 칸 읽기', D.CSV읽기('a,b\n"1,2","x""y"\n').행[0].a === '1,2' && D.CSV읽기('a,b\n"1,2","x""y"\n').행[0].b === 'x"y');

/* 눈금·구간 */
참('눈금 0~4456', JSON.stringify(D.눈금(0, 4456)) === JSON.stringify([0, 1000, 2000, 3000, 4000, 5000]));
const 칸 = D.구간세기(열('대여건수'), 10);
참('히스토그램 구간 합 = 행 수', 칸.reduce((a, c) => a + c.개수, 0) === golden.행수);

/* 그래프가 SVG 글을 낸다 */
for (const [이름, svg] of [
  ['꺾은선', D.꺾은선([{ 이름: '1', 값: 3 }, { 이름: '2', 값: 5 }], { y이름: 'y' })],
  ['막대', D.막대([{ 이름: '월', 값: 3 }], { y이름: 'y' })],
  ['히스토그램', D.히스토그램([1, 2, 3, 4, 5])],
  ['산점도', D.산점도([1, 2, 3], [2, 4, NaN])],
]) 참(`${이름} 그래프`, svg.startsWith('<svg') && svg.endsWith('</svg>') && !svg.includes('NaN'));

/* 상관 말 */
참('상관말 0.71', D.상관말(0.7062) === '강한 양의 상관');
참('상관말 -0.26', D.상관말(-0.2563) === '약한 음의 상관');
참('상관말 0.05', D.상관말(0.05) === '직선 관계가 거의 없다');

/* 비식별화 — 이름·전화를 지우고 나이를 묶으면 무리가 커져야 한다 */
const people = D.CSV읽기(readFileSync('public/data/people.csv', 'utf8'));
const 그대로 = D.비식별처리(people.행, Object.fromEntries(people.열.map((k) => [k, '그대로'])));
참('처리 전에는 모두 혼자(이름·전화가 다 다르다)', 그대로.무리.every((n) => n === 1));
/* 나이대+동네를 남기면 70대 두 분이 저마다 혼자다 — «드문 사람은 적은 정보로도 드러난다»를
   보여 주는 장치라 일부러 그렇게 만들었다(본문 8차시). 동네까지 묶어야 모두 2명 이상이 된다. */
const 동네그대로 = D.비식별처리(people.행, { 이름: '지우기', 나이: '묶기', 성별: '지우기', 동네: '그대로', 학교: '지우기', 전화: '지우기', 자주쓰는대여소: '지우기' });
참('나이대+동네면 혼자인 사람이 꼭 2명(70대)', 동네그대로.무리.filter((n) => n === 1).length === 2);
const 안전 = D.비식별처리(people.행, { 이름: '지우기', 나이: '묶기', 성별: '지우기', 동네: '묶기', 학교: '지우기', 전화: '지우기', 자주쓰는대여소: '지우기' });
참('나이대만 남기면 모든 무리가 2명 이상', 안전.무리.every((n) => n >= 2));
참('지운 열은 남지 않는다', !안전.남은열.includes('이름') && !('전화' in 안전.행[0]));
참('가리기', D.가리기('한가람') === '한**');
const 덜안전 = D.비식별처리(people.행, { 이름: '지우기', 나이: '그대로', 성별: '그대로', 동네: '그대로', 학교: '그대로', 전화: '지우기', 자주쓰는대여소: '그대로' });
참('이름만 지우면 아직 혼자인 사람이 있다(재식별 위험)', 덜안전.무리.some((n) => n === 1));

if (오류.length) {
  console.error(`✗ 데이터 도구 점검 실패 — ${오류.length}건`);
  for (const e of 오류) console.error('  · ' + e);
  process.exit(1);
}
console.log(`✓ 데이터 도구 — ${통과}가지 (판다스 값과 대조)`);
