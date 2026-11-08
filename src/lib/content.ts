// © 2026 티쳐무 · 모든 권리 보유 — 고등학교 「소프트웨어와 생활」 웹 교과서
/**
 * 본문(MDX) 렌더링 지원
 *
 * MDX 파일에서 컴포넌트를 import 하지 않아도 쓸 수 있게 컴포넌트 지도를 넘긴다.
 * 집필자(교사)가 import 문을 관리하지 않아도 되게 하려는 결정이다.
 * 쓸 수 있는 컴포넌트 목록은 앱 CLAUDE.md 「본문 컴포넌트」 표에 적어 둔다.
 */
import InfoBox from '@components/content/InfoBox.astro';
import CodeSample from '@components/content/CodeSample.astro';
import CheckQuiz from '@components/content/CheckQuiz.astro';
import QuizItem from '@components/content/QuizItem.astro';
import Term from '@components/content/Term.astro';
import MiniCards from '@components/content/MiniCards.astro';
import CompareTable from '@components/content/CompareTable.astro';
import MoreBox from '@components/content/MoreBox.astro';
import Figure from '@components/content/Figure.astro';
import Activity from '@components/content/Activity.astro';
import LessonLink from '@components/content/LessonLink.astro';
import CodeTask from '@components/content/CodeTask.astro';
import Cloze from '@components/content/Cloze.astro';
import Predict from '@components/content/Predict.astro';
import Sorter from '@components/content/Sorter.astro';
import Bucket from '@components/content/Bucket.astro';
import Worksheet from '@components/content/Worksheet.astro';
import DayMap from '@components/content/DayMap.astro';
import BeforeAfter from '@components/content/BeforeAfter.astro';
import ImpactScale from '@components/content/ImpactScale.astro';
import BoardSim from '@components/content/BoardSim.astro';
import ReactiveCanvas from '@components/content/ReactiveCanvas.astro';
import CleanLab from '@components/content/CleanLab.astro';
import StatLab from '@components/content/StatLab.astro';
import ChartLab from '@components/content/ChartLab.astro';
import DeidLab from '@components/content/DeidLab.astro';
import DataFile from '@components/content/DataFile.astro';
import StationSim from '@components/content/StationSim.astro';
import QueueSim from '@components/content/QueueSim.astro';
import MonteCarloPi from '@components/content/MonteCarloPi.astro';
import SirSim from '@components/content/SirSim.astro';
import PersonaMaker from '@components/content/PersonaMaker.astro';
import LeanCanvas from '@components/content/LeanCanvas.astro';
import ProtoBuilder from '@components/content/ProtoBuilder.astro';
import TaskBoard from '@components/content/TaskBoard.astro';
import ValueReview from '@components/content/ValueReview.astro';

export const 본문컴포넌트 = {
  InfoBox,
  CodeSample,
  CheckQuiz,
  QuizItem,
  Term,
  MiniCards,
  CompareTable,
  MoreBox,
  Figure,
  Activity,
  LessonLink,
  CodeTask,
  Cloze,
  Predict,
  Sorter,
  Bucket,
  Worksheet,
  DayMap,
  BeforeAfter,
  ImpactScale,
  BoardSim,
  ReactiveCanvas,
  CleanLab,
  StatLab,
  ChartLab,
  DeidLab,
  DataFile,
  StationSim,
  QueueSim,
  MonteCarloPi,
  SirSim,
  PersonaMaker,
  LeanCanvas,
  ProtoBuilder,
  TaskBoard,
  ValueReview,
};

export interface 목차항목 {
  id: string;
  text: string;
  depth: 2 | 3;
}

/**
 * MDX 가 뽑아 준 제목 목록을 우측 목차 형식으로 바꾼다.
 * h2·h3 만 목차에 올린다 — 그 아래는 목차가 너무 잘게 쪼개진다.
 */
export function 본문목차(
  headings: { depth: number; slug: string; text: string }[]
): 목차항목[] {
  return headings
    .filter((h) => h.depth === 2 || h.depth === 3)
    .map((h) => ({ id: h.slug, text: h.text, depth: h.depth as 2 | 3 }));
}
