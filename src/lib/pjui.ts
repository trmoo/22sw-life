// © 2026 티쳐무 · 모든 권리 보유 — 고등학교 「소프트웨어와 생활」 웹 교과서
/**
 * Ⅴ단원 프로젝트 도구가 함께 쓰는 화면 조각 (브라우저 전용)
 * 계산은 projtools.js 에 두고, 여기에는 단추·내려받기·점검표 그리기만 둔다.
 */
import { 이스케이프 } from './projtools.js';

interface 점검 { 이름: string; ok: boolean; 도움?: string }

/** 기본 confirm 창 대신 — 한 번 누르면 글이 「정말? 한 번 더」로 바뀌고 3초 안에 다시 눌러야 한다 */
export function 두번확인(단추: HTMLButtonElement, 할일: () => void) {
  const 처음글 = 단추.textContent ?? '';
  let 기다림 = 0;
  단추.addEventListener('click', () => {
    if (!기다림) {
      단추.textContent = '정말? 한 번 더 누르기';
      기다림 = window.setTimeout(() => {
        기다림 = 0;
        단추.textContent = 처음글;
      }, 3000);
      return;
    }
    clearTimeout(기다림);
    기다림 = 0;
    단추.textContent = 처음글;
    할일();
  });
}

export function 내려받기(파일이름: string, html: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  a.download = 파일이름.replace(/[\\/:*?"<>|]/g, '_') + '.html';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

export function 점검그리기(자리: HTMLElement, 목록: 점검[]) {
  자리.innerHTML =
    `<b>스스로 점검 — ${목록.filter((c) => c.ok).length} / ${목록.length}</b><ul>` +
    목록
      .map((c) => `<li class="${c.ok ? 'is-ok' : ''}">${c.ok ? '●' : '○'} ${이스케이프(c.이름)}${c.도움 ? `<small>${이스케이프(c.도움)}</small>` : ''}</li>`)
      .join('') +
    `</ul><p class="pj__note">글자 규칙으로 살펴보는 점검표다. 다 켜졌다고 좋은 답이 되는 것은 아니다 — 마지막 판단은 내가 한다.</p>`;
}
