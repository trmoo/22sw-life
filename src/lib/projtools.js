// © 2026 티쳐무 · 모든 권리 보유 — 고등학교 「소프트웨어와 생활」 웹 교과서
/**
 * Ⅴ단원 스타트업 프로젝트 도구의 계산부 (DOM 없음 — node 로 시험한다)
 *
 *   페르소나   — 사용자 한 사람을 지어내 그리고, «불편»이 장면 속에 있는지 살핀다 (3차시)
 *   린 캔버스 — 아이디어를 한 장 계획표 아홉 칸으로 (4차시)
 *   시안       — 눌러 보는 화면 설계(프로토타입). 단추가 어디로 가는지, 막다른 화면이 없는지 (5차시)
 *   작업 보드 — 역할 나누기 + 할 일 카드 (5·6차시)
 *   가치 평가 — 사회적·기능적·윤리적 관점, 우리 팀과 동료의 평가를 견준다 (7차시)
 *
 * 점검은 모두 «채점»이 아니라 «스스로 점검»이다. 글자 규칙으로만 보므로 사람처럼 읽지 못한다.
 * 그래서 함수마다 통과/미통과와 함께 «왜»를 돌려준다 — 화면은 그 까닭을 학생에게 보여 준다.
 */

export function 이스케이프(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** 여러 줄 글 → 빈 줄을 뺀 줄 목록. 앞에 붙인 「1)」「-」「•」 같은 머리표는 떼어 낸다 */
export function 줄들(글) {
  return String(글 ?? '')
    .split(/\r?\n/)
    .map((x) => x.replace(/^\s*(?:[-•·*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}

const 채움 = (v) => String(v ?? '').trim().length > 0;

/* ============================== 페르소나 ============================== */

export const 페르소나모습 = ['🧑‍🎓', '👩‍🎓', '🧑‍🏫', '👵', '👴', '🧑‍🍳', '🧑‍🔧', '🧑‍💼', '🧒', '🧑‍🦽'];
export const 지어낸이름들 = ['서윤', '도현', '하린', '지호', '민서', '예준', '채원', '시우', '다은', '건우', '수아', '윤재'];

/** 불편 칸에 이런 낱말이 보이면 «해결책»을 먼저 적은 것이다 — 요구와 해결책을 가르는 것이 3차시의 핵심 */
export const 해결책낱말 = ['앱', '어플', '애플리케이션', '기능', '사이트', '프로그램', '있으면 좋겠', '있었으면', '만들어', '챗봇', '알림을'];
/** 불편이 «장면» 속에 있는지 — 언제·어디서·무엇을 하다가 */
export const 장면낱말 = ['때', '마다', '도중', '중에', '에서', '하면', '하려고', '려는데', '는데', '니까', '하다가', '아침', '저녁', '점심', '쉬는 시간'];

export function 페르소나점검(p) {
  const 불편 = 줄들(p.불편);
  const 섞인낱말 = [...new Set(불편.flatMap((줄) => 해결책낱말.filter((w) => 줄.includes(w))))];
  const 장면없는줄 = 불편.filter((줄) => !장면낱말.some((w) => 줄.includes(w)));
  return [
    { 열쇠: 'who', 이름: '지어낸 이름과 한 줄 소개를 적었다', ok: 채움(p.이름) && 채움(p.소개), 도움: '실제 친구 이름은 쓰지 않는다. 나이·하는 일 정도로 소개한다.' },
    { 열쇠: 'pain2', 이름: '불편을 두 가지 이상 적었다', ok: 불편.length >= 2, 도움: `지금 ${불편.length}가지 — 한 줄에 하나씩 적는다.` },
    {
      열쇠: 'scene',
      이름: '불편마다 «언제·어디서»가 드러난다',
      ok: 불편.length > 0 && 장면없는줄.length === 0,
      도움: 장면없는줄.length ? `「${장면없는줄[0]}」 — 언제, 무엇을 하다가 겪는 불편인가?` : '좋다. 장면이 보이면 해결책도 구체적이 된다.',
    },
    {
      열쇠: 'nosol',
      이름: '불편 칸에 해결책을 섞지 않았다',
      ok: 불편.length > 0 && 섞인낱말.length === 0,
      도움: 섞인낱말.length ? `「${섞인낱말.join('」 「')}」 — 해결책 낱말이다. 지금은 «무엇이 불편한가»만 적고, 해결책은 4차시에 찾는다.` : '좋다. 요구와 해결책을 갈라 두었다.',
    },
    { 열쇠: 'alt', 이름: '지금은 어떻게 버티는지 적었다', ok: 채움(p.대안), 도움: '사람들은 불편해도 나름의 방법으로 버틴다. 그 방법이 우리의 진짜 경쟁 상대다.' },
    { 열쇠: 'evidence', 이름: '근거에 몇 명에게서 들었는지 숫자가 있다', ok: /\d/.test(String(p.근거 ?? '')), 도움: '페르소나는 상상이 아니라 인터뷰·관찰을 모아 만든 «대표 인물»이다.' },
  ];
}

/* ============================== 린 캔버스 ============================== */

/**
 * 칸 아홉 + 딸린 칸 둘(현재 대안·얼리 어답터).
 * 자리는 가로 10칸 격자 — 위 두 줄은 다섯 기둥(2칸씩), 아래 줄은 비용(1~5)·수익(6~10).
 * 차례는 린 캔버스를 채우라고 흔히 권하는 순서다: 고객 → 문제 → 가치 → 해결책 → … → 경쟁 우위.
 */
export const 캔버스칸 = [
  { key: 'problem', 이름: '문제', 차례: 2, 물음: '고객이 겪는 가장 큰 불편 1~3가지 (한 줄에 하나)', 자리: 'pb' },
  { key: 'alt', 이름: '현재 대안', 딸림: 'problem', 물음: '지금은 그 불편을 어떻게 버티나', 자리: 'pb' },
  { key: 'solution', 이름: '해결책', 차례: 4, 물음: '문제마다 핵심 기능 하나씩 (문제와 같은 줄 수로)', 자리: 'so' },
  { key: 'metric', 이름: '핵심 지표', 차례: 8, 물음: '잘되고 있는지 무엇을 세어 보면 알까', 자리: 'me' },
  { key: 'uvp', 이름: '고유 가치 제안', 차례: 3, 물음: '왜 다른 방법 말고 이것을 써야 하나 — 한 문장', 자리: 'uv' },
  { key: 'unfair', 이름: '경쟁 우위', 차례: 9, 물음: '남이 쉽게 따라 할 수 없는 우리만의 것', 자리: 'un' },
  { key: 'channel', 이름: '채널', 차례: 5, 물음: '고객이 이것을 어떻게 알고 찾아오나', 자리: 'ch' },
  { key: 'customer', 이름: '고객군', 차례: 1, 물음: '누구를 위한 것인가 (구체적으로)', 자리: 'cu' },
  { key: 'early', 이름: '얼리 어답터', 딸림: 'customer', 물음: '가장 먼저, 가장 절실하게 써 줄 사람', 자리: 'cu' },
  { key: 'cost', 이름: '비용 구조', 차례: 7, 물음: '만들고 운영하는 데 드는 돈·시간·사람', 자리: 'co' },
  { key: 'revenue', 이름: '수익 흐름 · 이어 가는 방법', 차례: 6, 물음: '돈을 번다면 어떻게? 돈을 벌지 않는다면 누가 어떻게 계속 운영하나', 자리: 're' },
];
export const 캔버스본칸 = 캔버스칸.filter((k) => !k.딸림);

/** 본문 예시 — 지어낸 「우리 학교 분실물 찾기」. 화면에는 «예시»라고 밝혀 보여 준다 */
export const 캔버스예시 = {
  customer: '물건을 자주 잃어버리는 우리 학교 학생\n분실물을 맡아 두는 학생회 생활부',
  early: '체육 시간이 많아 체육복·물병을 자주 잃는 1학년',
  problem: '잃어버린 물건이 어디로 갔는지 알 길이 없다\n분실물 보관함에 가 보기가 번거롭다\n주인을 못 찾은 물건이 학기 말에 버려진다',
  alt: '반 단체 대화방에 물어보기, 학기 말 분실물 전시회',
  uvp: '잃어버린 물건, 교실에서 1분 안에 찾아본다',
  solution: '주운 사람이 사진 한 장으로 등록\n물건·색·장소로 검색\n2주가 지나면 주인 후보 반에 알려 주기',
  channel: '조회 시간 안내, 분실물 보관함에 붙인 QR 코드, 학교 누리집 배너',
  revenue: '돈은 받지 않는다 — 학생회 예산과 학교 서버로 운영하고, 정보 동아리가 해마다 이어 맡는다',
  cost: '무료 웹 호스팅, 관리하는 학생의 시간(일주일에 1시간)',
  metric: '한 달에 주인을 찾은 물건 수, 학기 말에 버려지는 물건 수',
  unfair: '학생회가 보관함을 직접 맡고 있어 실제 물건과 기록이 늘 맞는다',
};

const 막연한고객 = ['모든', '누구나', '모두', '전 국민', '사람들', '아무나'];

export function 캔버스점검(c) {
  const 빈칸 = 캔버스본칸.filter((k) => !채움(c[k.key])).map((k) => k.이름);
  const 문제 = 줄들(c.problem), 해결 = 줄들(c.solution);
  const 막연 = 막연한고객.filter((w) => String(c.customer ?? '').includes(w));
  const 가치 = String(c.uvp ?? '').trim();
  return [
    { 열쇠: 'all', 이름: '아홉 칸을 모두 채웠다', ok: 빈칸.length === 0, 도움: 빈칸.length ? `아직 빈 칸: ${빈칸.join(' · ')}` : '모두 채웠다. 이제 칸끼리 이어지는지 본다.' },
    {
      열쇠: 'customer',
      이름: '고객군이 구체적이다',
      ok: 채움(c.customer) && 막연.length === 0,
      도움: 막연.length ? `「${막연[0]}」 — 모두를 위한 서비스는 아무도 절실하지 않다. 가장 불편한 사람부터 좁힌다.` : '누구를 위한 것인지 좁혀 두었다.',
    },
    { 열쇠: 'problem3', 이름: '문제는 1~3가지다', ok: 문제.length >= 1 && 문제.length <= 3, 도움: `지금 ${문제.length}가지 — 가장 큰 것 세 개까지만 남긴다.` },
    {
      열쇠: 'pair',
      이름: '문제마다 해결책이 하나씩 짝지어 있다',
      ok: 문제.length > 0 && 문제.length === 해결.length,
      도움: `문제 ${문제.length}줄 · 해결책 ${해결.length}줄 — 해결책이 더 많으면 아무도 원하지 않는 기능을 만들 수 있다.`,
    },
    {
      열쇠: 'uvp',
      이름: '고유 가치 제안이 짧은 한 문장이다',
      ok: 가치.length > 0 && 줄들(가치).length === 1 && 가치.length <= 50,
      도움: 가치.length > 50 ? `${가치.length}자 — 처음 보는 사람이 한 번 읽고 알아듣게 50자 안으로 줄여 본다.` : '한 번 읽고 «아, 그거구나» 할 수 있어야 한다.',
    },
    {
      열쇠: 'metric',
      이름: '핵심 지표를 셀 수 있다',
      ok: /수|율|명|개|번|회|시간|분|%|\d/.test(String(c.metric ?? '')),
      도움: '「만족도가 높아진다」보다 「한 달에 주인을 찾은 물건 수」처럼 세어 볼 수 있게 적는다.',
    },
    { 열쇠: 'alt', 이름: '현재 대안을 적었다', ok: 채움(c.alt), 도움: '고객이 지금 쓰는 방법보다 나아야 바꿔 쓴다.' },
  ];
}

/** 3차시 페르소나 → 캔버스 초안. 이미 적은 칸은 덮어쓰지 않는다 */
export function 페르소나에서캔버스(p, c = {}) {
  const 새 = { ...c };
  const 소개 = [p.이름, p.소개].filter(채움).join(' — ');
  if (!채움(새.customer) && 소개) 새.customer = 소개;
  if (!채움(새.problem) && 줄들(p.불편).length) 새.problem = 줄들(p.불편).slice(0, 3).join('\n');
  if (!채움(새.alt) && 채움(p.대안)) 새.alt = String(p.대안).trim();
  return 새;
}

/* ============================== 시안 (눌러 보는 화면 설계) ============================== */

export const 요소종류 = {
  제목: { 표시: '제목', 기본: '화면 제목' },
  글: { 표시: '글', 기본: '설명하는 글' },
  입력칸: { 표시: '입력칸', 기본: '여기에 적는다' },
  단추: { 표시: '단추', 기본: '누르기' },
  목록: { 표시: '목록', 기본: '첫째 줄\n둘째 줄\n셋째 줄' },
  그림: { 표시: '그림 자리', 기본: '사진이 들어갈 곳' },
};

export function 새시안() {
  return { 화면: [{ id: 's1', 제목: '첫 화면', 요소: [{ 종류: '제목', 글: '우리 서비스 이름' }] }] };
}

export function 새화면id(시안) {
  const 번호들 = 시안.화면.map((h) => Number(String(h.id).replace(/\D/g, '')) || 0);
  return 's' + (Math.max(0, ...번호들) + 1);
}

/** 본문 예시 — 지어낸 「분실물 찾기」 화면 넷 */
export const 시안예시 = {
  화면: [
    {
      id: 's1',
      제목: '첫 화면',
      요소: [
        { 종류: '제목', 글: '🔎 찾아줘 우리 학교' },
        { 종류: '글', 글: '잃어버린 물건을 찾거나, 주운 물건을 맡겨 주세요.' },
        { 종류: '단추', 글: '잃어버렸어요', 갈곳: 's2' },
        { 종류: '단추', 글: '주웠어요', 갈곳: 's4' },
      ],
    },
    {
      id: 's2',
      제목: '찾기',
      요소: [
        { 종류: '제목', 글: '무엇을 잃어버렸나요?' },
        { 종류: '입력칸', 글: '예: 체육복' },
        { 종류: '단추', 글: '찾아보기', 갈곳: 's3' },
        { 종류: '단추', 글: '← 처음으로', 갈곳: 's1' },
      ],
    },
    {
      id: 's3',
      제목: '찾은 결과',
      요소: [
        { 종류: '제목', 글: '「체육복」 2건' },
        { 종류: '목록', 글: '남색 체육복 · 체육관 · 11월 3일\n검정 체육복 바지 · 운동장 · 11월 5일' },
        { 종류: '글', 글: '보관함: 1층 학생회실 앞' },
        { 종류: '단추', 글: '다시 찾기', 갈곳: 's2' },
        { 종류: '단추', 글: '← 처음으로', 갈곳: 's1' },
      ],
    },
    {
      id: 's4',
      제목: '맡기기',
      요소: [
        { 종류: '제목', 글: '주운 물건 맡기기' },
        { 종류: '그림', 글: '물건 사진' },
        { 종류: '입력칸', 글: '물건 이름' },
        { 종류: '입력칸', 글: '주운 곳' },
        { 종류: '단추', 글: '등록하기', 갈곳: 's1' },
      ],
    },
  ],
};

/** 시안 점검 — 오류는 «눌러 보면 고장 나는 것», 주의는 «써 보는 사람이 헤맬 수 있는 것» */
export function 시안점검(시안) {
  const 결과 = [];
  const 화면들 = 시안?.화면 ?? [];
  const 있는id = new Set(화면들.map((h) => h.id));
  const 이름 = (h) => `「${h.제목 || '이름 없는 화면'}」`;

  for (const h of 화면들) {
    const 단추들 = (h.요소 ?? []).filter((e) => e.종류 === '단추');
    if (!(h.요소 ?? []).length) 결과.push({ 수준: '주의', 화면: h.id, 글: `${이름(h)} 화면이 비어 있다.` });
    for (const b of 단추들) {
      if (!String(b.글 ?? '').trim()) 결과.push({ 수준: '주의', 화면: h.id, 글: `${이름(h)} 화면에 글자 없는 단추가 있다 — 무엇을 하는 단추인지 알 수 없다.` });
      if (!b.갈곳) 결과.push({ 수준: '오류', 화면: h.id, 글: `${이름(h)} 화면의 「${b.글}」 단추가 갈 곳이 정해지지 않았다.` });
      else if (!있는id.has(b.갈곳)) 결과.push({ 수준: '오류', 화면: h.id, 글: `${이름(h)} 화면의 「${b.글}」 단추가 지운 화면으로 간다.` });
    }
    if (화면들.length > 1 && 단추들.length === 0) {
      결과.push({ 수준: '주의', 화면: h.id, 글: `${이름(h)} 화면은 막다른 곳이다 — 다른 화면으로 가는 단추가 없다.` });
    }
  }

  /* 첫 화면에서 단추를 눌러 닿을 수 있는 화면을 넓이 우선으로 찾는다 */
  if (화면들.length) {
    const 닿음 = new Set([화면들[0].id]);
    const 줄 = [화면들[0].id];
    while (줄.length) {
      const 꺼낸 = 줄.shift();
      const h = 화면들.find((x) => x.id === 꺼낸);
      for (const b of (h?.요소 ?? []).filter((e) => e.종류 === '단추' && 있는id.has(e.갈곳))) {
        if (!닿음.has(b.갈곳)) {
          닿음.add(b.갈곳);
          줄.push(b.갈곳);
        }
      }
    }
    for (const h of 화면들.filter((x) => !닿음.has(x.id))) {
      결과.push({ 수준: '주의', 화면: h.id, 글: `${이름(h)} 화면은 첫 화면에서 갈 수 없다 — 어느 단추도 이 화면으로 오지 않는다.` });
    }
  }
  return 결과;
}

/** 화면 이동 지도 — [{ 에서, 단추, 으로 }] */
export function 시안흐름(시안) {
  const 화면들 = 시안?.화면 ?? [];
  const 제목 = Object.fromEntries(화면들.map((h) => [h.id, h.제목]));
  return 화면들.flatMap((h) =>
    (h.요소 ?? []).filter((e) => e.종류 === '단추' && e.갈곳 && 제목[e.갈곳] !== undefined).map((e) => ({ 에서: h.제목, 단추: e.글, 으로: 제목[e.갈곳] })),
  );
}

/** 화면 하나를 HTML 로 — 시안 만들기 미리보기와 내려받는 파일이 함께 쓴다 */
export function 요소HTML(e) {
  const t = 이스케이프(e.글);
  switch (e.종류) {
    case '제목': return `<h2 class="pv-h">${t}</h2>`;
    case '글': return `<p class="pv-p">${t}</p>`;
    case '입력칸': return `<input class="pv-in" type="text" placeholder="${t}">`;
    case '단추': return `<button type="button" class="pv-btn" data-go="${이스케이프(e.갈곳 ?? '')}">${t || '(글자 없음)'}</button>`;
    case '목록': return `<ul class="pv-ul">${줄들(e.글).map((x) => `<li>${이스케이프(x)}</li>`).join('')}</ul>`;
    case '그림': return `<div class="pv-img">🖼 ${t}</div>`;
    default: return '';
  }
}

export const 미리보기CSS = `.pv-h{font-size:1.25rem;margin:0 0 10px;line-height:1.35}.pv-p{margin:0 0 10px;color:#4d5b73;font-size:.95rem;line-height:1.6}
.pv-in{display:block;width:100%;box-sizing:border-box;font:inherit;font-size:.95rem;padding:10px 12px;margin:0 0 10px;border:1.5px solid #cbd5e1;border-radius:10px}
.pv-btn{display:block;width:100%;font:inherit;font-weight:700;font-size:1rem;padding:12px;margin:0 0 10px;border:0;border-radius:12px;background:#b4492b;color:#fff;cursor:pointer}
.pv-btn[data-go=""]{background:#94a3b8;cursor:not-allowed}.pv-ul{margin:0 0 10px;padding:0;list-style:none}
.pv-ul li{padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:6px;font-size:.92rem;background:#fff}
.pv-img{display:grid;place-items:center;height:120px;margin:0 0 10px;border:2px dashed #cbd5e1;border-radius:12px;color:#8492a8;font-size:.9rem;background:#f8fafc}`;

/** 눌러 보는 시안을 HTML 파일 하나로 — 친구 휴대 전화에서 열어 «사용자 시험»을 할 수 있다 */
export function 시안HTML(시안, 이름 = '우리 팀 시안') {
  const 화면들 = 시안?.화면 ?? [];
  const 본문 = 화면들
    .map((h, i) => `<section class="sc" id="${이스케이프(h.id)}"${i ? ' hidden' : ''}><p class="tag">${이스케이프(h.제목)}</p>${(h.요소 ?? []).map(요소HTML).join('')}</section>`)
    .join('\n');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${이스케이프(이름)}</title><style>body{margin:0;background:#eef1f6;font-family:'Malgun Gothic',-apple-system,sans-serif;color:#1c2536}
.phone{max-width:380px;margin:24px auto;background:#fff;border-radius:28px;border:10px solid #1c2536;min-height:560px;padding:18px 16px;box-sizing:border-box}
.tag{font-size:.75rem;color:#8492a8;margin:0 0 8px}.note{max-width:380px;margin:0 auto 24px;font-size:.8rem;color:#64748b;text-align:center;line-height:1.6}
${미리보기CSS}</style></head><body><div class="phone">${본문}</div>
<p class="note">눌러 보는 시안(프로토타입)이다. 적은 내용은 어디에도 저장·전송되지 않는다.<br>© 2026 티쳐무 · 「소프트웨어와 생활」 웹 교과서 — 학생이 만든 시안은 학생의 것이다.</p>
<script>document.addEventListener('click',function(ev){var b=ev.target.closest('[data-go]');if(!b)return;var t=document.getElementById(b.getAttribute('data-go'));if(!t)return;
document.querySelectorAll('.sc').forEach(function(s){s.hidden=s!==t});window.scrollTo(0,0)});</script></body></html>`;
}

/* ============================== 작업 보드 ============================== */

export const 역할들 = [
  { 이름: '기획', 하는일: '물음과 요구를 지키고, 무엇을 먼저 만들지 정리한다' },
  { 이름: '화면 설계', 하는일: '시안을 그리고, 쓰는 사람이 헤매지 않게 다듬는다' },
  { 이름: '개발', 하는일: '핵심 기능을 코드로 만든다' },
  { 이름: '시험', 하는일: '시험표를 만들고, 친구에게 써 보게 하며 고장을 찾는다' },
  { 이름: '기록·발표', 하는일: '회의와 결정을 기록하고, 발표를 준비한다' },
];
export const 보드칸 = ['할 일', '하는 중', '다 함'];

export function 새보드() {
  return { 사람: [{ 별명: '', 역할: [] }, { 별명: '', 역할: [] }, { 별명: '', 역할: [] }], 카드: [] };
}

export function 보드점검(b) {
  const 사람 = (b?.사람 ?? []).filter((x) => 채움(x.별명));
  const 카드 = b?.카드 ?? [];
  const 빈역할 = 역할들.map((r) => r.이름).filter((r) => !사람.some((x) => (x.역할 ?? []).includes(r)));
  const 역할없는 = 사람.filter((x) => !(x.역할 ?? []).length).map((x) => x.별명);
  const 담당없는 = 카드.filter((k) => !채움(k.담당));
  const 하는중 = {};
  for (const k of 카드.filter((k) => k.칸 === 1 && 채움(k.담당))) 하는중[k.담당] = (하는중[k.담당] ?? 0) + 1;
  const 몰린 = Object.entries(하는중).filter(([, n]) => n > 2).map(([이름]) => 이름);
  const 맡은수 = 사람.map((x) => 카드.filter((k) => k.담당 === x.별명).length);
  const 고르다 = 맡은수.length < 2 || !카드.length || Math.max(...맡은수) <= Math.max(2, 2 * Math.min(...맡은수) + 1);
  return [
    { 열쇠: 'people', 이름: '팀원이 둘 이상 있다', ok: 사람.length >= 2, 도움: '이름 대신 별명이나 번호로 적는다.' },
    { 열쇠: 'roles', 이름: '모든 역할에 맡은 사람이 있다', ok: 사람.length > 0 && 빈역할.length === 0, 도움: 빈역할.length ? `아직 아무도 안 맡은 역할: ${빈역할.join(' · ')}` : '한 사람이 두 역할을 맡아도 된다.' },
    { 열쇠: 'everyone', 이름: '모든 팀원이 역할을 하나 이상 맡았다', ok: 사람.length > 0 && 역할없는.length === 0, 도움: 역할없는.length ? `역할이 없는 사람: ${역할없는.join(' · ')}` : '모두가 맡은 일이 있다.' },
    { 열쇠: 'owner', 이름: '모든 할 일 카드에 담당이 있다', ok: 카드.length > 0 && 담당없는.length === 0, 도움: 카드.length ? `담당이 없는 카드 ${담당없는.length}장 — 「모두가 할 일」은 아무도 하지 않는 일이 되기 쉽다.` : '할 일 카드를 먼저 만든다.' },
    { 열쇠: 'wip', 이름: '한 사람이 「하는 중」 카드를 두 장 넘게 들고 있지 않다', ok: 몰린.length === 0, 도움: 몰린.length ? `${몰린.join(' · ')} — 하던 일을 끝내고 새 일을 집는다.` : '한 번에 한두 가지에 집중한다.' },
    { 열쇠: 'fair', 이름: '할 일이 한 사람에게 몰리지 않았다', ok: 고르다, 도움: `사람마다 맡은 카드: ${사람.map((x, i) => `${x.별명} ${맡은수[i]}`).join(' · ') || '없음'}` },
  ];
}

export function 보드진행(b) {
  const 카드 = b?.카드 ?? [];
  const 다함 = 카드.filter((k) => k.칸 === 2).length;
  return { 전체: 카드.length, 다함, 비율: 카드.length ? 다함 / 카드.length : 0 };
}

/* ============================== 가치 평가 ============================== */

export const 관점들 = [
  {
    key: 'social',
    이름: '사회적 가치',
    색: '#15803d',
    물음: '누구에게 어떤 보탬이 되나',
    기준: ['풀려는 문제가 실제로 있다는 근거가 있다', '혜택을 받는 사람이 분명하다', '공동체나 환경에 보탬이 된다', '계속 운영할 방법이 있다'],
  },
  {
    key: 'function',
    이름: '기능적 가치',
    색: '#2b59c3',
    물음: '제대로, 쓰기 쉽게 도는가',
    기준: ['핵심 기능이 시험표대로 오류 없이 돈다', '처음 쓰는 사람도 도움 없이 쓸 수 있다', '막히거나 헤매는 화면이 없다', '사용자 요구를 기능으로 빠짐없이 옮겼다'],
  },
  {
    key: 'ethic',
    이름: '윤리적 가치',
    색: '#b4492b',
    물음: '누구도 해치지 않는가',
    기준: ['꼭 필요한 정보만 모은다 (개인정보 최소화)', '글자 크기·색·소리 등 누구나 쓸 수 있게 했다', '사람을 속이거나 붙잡아 두는 설계가 없다', '남의 글·그림·코드를 허락과 출처대로 썼다'],
  },
];
export const 점수말 = ['', '아직 멀었다', '조금 갖췄다', '대체로 갖췄다', '잘 갖췄다'];

/** 점수 {social:[0~4,…], …} → 관점별 평균(매긴 것만, 하나도 없으면 null) */
export function 관점평균(점수) {
  const o = {};
  for (const 관 of 관점들) {
    const 매김 = (점수?.[관.key] ?? []).filter((x) => x >= 1 && x <= 4);
    o[관.key] = 매김.length ? 매김.reduce((a, b) => a + b, 0) / 매김.length : null;
  }
  return o;
}

/** 우리 팀 평가와 동료 평가를 견주어 토의할 거리를 찾는다 */
export function 가치요약(우리, 동료) {
  const 평 = 관점평균(우리), 동평 = 관점평균(동료);
  const 매긴 = 관점들.filter((관) => 평[관.key] !== null);
  const 낮은 = 매긴.length ? 매긴.reduce((a, b) => (평[b.key] < 평[a.key] ? b : a)) : null;
  const 갈림 = [];
  for (const 관 of 관점들) {
    관.기준.forEach((기준, i) => {
      const a = 우리?.[관.key]?.[i] ?? 0, b = 동료?.[관.key]?.[i] ?? 0;
      if (a && b && Math.abs(a - b) >= 2) 갈림.push({ 관점: 관.이름, 기준, 우리: a, 동료: b });
    });
  }
  const 다매김 = 관점들.every((관) => 관.기준.every((_, i) => (우리?.[관.key]?.[i] ?? 0) >= 1));
  return { 우리: 평, 동료: 동평, 낮은관점: 낮은?.이름 ?? null, 갈림, 다매김 };
}

/** 세 관점 삼각형의 꼭짓점 — 위(사회) · 오른쪽 아래(기능) · 왼쪽 아래(윤리). 평균 4 = 반지름 끝 */
export function 삼각좌표(평균들, cx = 150, cy = 140, r = 100) {
  return 관점들.map((관, i) => {
    const 각 = (-90 + i * 120) * (Math.PI / 180);
    const 길이 = ((평균들?.[관.key] ?? 0) / 4) * r;
    return [Math.round((cx + 길이 * Math.cos(각)) * 10) / 10, Math.round((cy + 길이 * Math.sin(각)) * 10) / 10];
  });
}

/* ============================== 저장 ============================== */

/** localStorage 가 막힌 브라우저에서도 도구는 돌아가야 한다 — 실패하면 조용히 null/false */
export function 읽기(열쇠) {
  try {
    const v = localStorage.getItem(열쇠);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}
export function 쓰기(열쇠, 값) {
  try {
    localStorage.setItem(열쇠, JSON.stringify(값));
    return true;
  } catch {
    return false;
  }
}

/** 내려받는 기록 파일의 공통 껍데기 */
export function 기록HTML(제목, 본문, 덧CSS = '') {
  const 오늘 = new Date().toLocaleDateString('ko-KR');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${이스케이프(제목)}</title>
<style>body{font-family:'Malgun Gothic',sans-serif;max-width:960px;margin:32px auto;padding:0 20px;line-height:1.7;color:#1c2536}
h1{font-size:1.5rem;border-bottom:3px solid #b4492b;padding-bottom:8px}h2{font-size:1.05rem;margin:22px 0 6px;color:#8f3418}
.m{color:#64748b;font-size:.9rem}.a{white-space:pre-wrap;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;background:#fafafa}
ul{padding-left:1.2em}footer{margin-top:40px;font-size:.8rem;color:#94a3b8}${덧CSS}</style></head><body>
<h1>${이스케이프(제목)}</h1><p class="m">작성일 ${오늘} · 「소프트웨어와 생활」 웹 교과서</p>
<p class="m">이름·학번: ______________________ (파일을 내기 전에 직접 적는다)</p>
${본문}
<footer>© 2026 티쳐무 · 「소프트웨어와 생활」 웹 교과서 — 학생이 적은 내용은 학생의 것이다.</footer></body></html>`;
}

export function 점검목록HTML(점검) {
  return `<h2>스스로 점검</h2><ul>${점검.map((c) => `<li>${c.ok ? '●' : '○'} ${이스케이프(c.이름)}</li>`).join('')}</ul>`;
}
