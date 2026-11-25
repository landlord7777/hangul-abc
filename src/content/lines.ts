// 화면에서 하트 요정이 하는 말 모음 — 더빙 대본에 그대로 들어가므로 한 문구에 한 문장만 쓴다
import { en, ko, type Say } from './types'

export const LINES = {
  hello: [ko('안녕!'), ko('오늘은 무엇을 공부할까?')],
  koStart: [ko('한글 공부')],
  enStart: [en('English')],
  locked: [ko('앞 레벨을 먼저 해 보자!')],
  quizIntro: [ko('잘 듣고 맞는 것을 골라 봐.')],
  buildIntro: [ko('블록을 눌러서 똑같이 만들어 봐.')],
  pictureQ: [ko('그림에 맞는 낱말을 골라 봐.')],
  blankQ: [ko('빈칸에 들어갈 글자를 골라 봐.')],
  blendIntro: [ko('소리를 합치면 무엇이 될까?')],
  lookAlikeIntro: [ko('비슷한 글자를 잘 듣고 골라 봐.')],
  traceIntro: [ko('흐린 글자를 따라 써 봐.')],
  retry: [ko('다시 해볼까?')],
  traceMore: [ko('글자를 따라서 조금 더 써 볼까?')],
  traceSkip: [ko('좋아!'), ko('다음 거 해 보자.')],
  penOnly: [ko('펜슬로 써요.')],
  fingerToo: [ko('손가락으로도 써요.')],
  timeUp: [ko('오늘 공부 끝!'), ko('내일 또 만나요.')],
  noStars: [ko('끝까지 해냈어!'), ko('다음에는 별을 받을 수 있어.')],
} satisfies Record<string, Say[]>

export const PRAISE: Say[] = ['잘했어!', '맞았어!', '최고야!', '멋져!', '딩동댕!'].map(ko)

// 숫자를 고유어로 써야 "세 개"처럼 자연스럽게 읽는다. 한 번에 받는 별은 최대 8개(듣고 고르기 8문제).
const COUNT = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟']
export const MAX_STARS = COUNT.length - 1

export const starLine = (n: number): Say[] =>
  n > 0 ? [ko('잘했어!'), ko(`별을 ${COUNT[n] ?? n} 개 받았어.`)] : LINES.noStars
