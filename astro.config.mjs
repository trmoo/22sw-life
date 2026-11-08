// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

/**
 * © 2026 티쳐무 · 모든 권리 보유
 * 고등학교 「소프트웨어와 생활」 웹 교과서 — Astro 설정
 *
 * base 경로: 로컬 개발은 '/' , GitHub Pages 는 배포 워크플로가 BASE_PATH=/<저장소>/ 로 빌드한다.
 * 모든 내부 링크는 src/lib/url.ts 의 href()를 거치므로 이 값만 바꾸면 전체가 따라온다.
 */
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://example.invalid',
  base,
  trailingSlash: 'always',
  integrations: [mdx()],
  markdown: {
    // 코드 블록 강조는 예제 컴포넌트(CodeSample)가 담당한다.
    // 본문 Markdown 안의 fenced code 는 밝은 테마로 최소 강조만 한다.
    shikiConfig: { theme: 'github-light', wrap: true },
  },
  build: {
    // /units/01/03/index.html 형태 — 학교망 프록시에서 확장자 없는 URL이 더 안전하다
    format: 'directory',
  },
  // 학교 전산실 크롬 기준. 최신 문법 트랜스파일은 Vite 기본값을 따른다.
  vite: {
    build: {
      // 소스맵은 배포물에서 제외 (용량·불필요한 노출 방지)
      sourcemap: false,
    },
    // ⚠ rollupOptions.output.banner 는 Astro 가 클라이언트 묶음을 만들 때 덮어써서 남지 않는다
    //   (22hs-programming 도 같다). 저작권 표시는 모든 페이지의 HTML 주석과 화면 푸터에 넣고,
    //   tools/check-html.mjs 가 페이지마다 확인한다.
  },
});
