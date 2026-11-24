// 학습 콘텐츠(레벨, 카드, 문제, 만들기 과제)의 타입과 음성 문구 도우미
export type Lang = 'ko' | 'en'
export type Say = { text: string; lang: Lang }
export type Subject = 'ko' | 'en'
export type ActivityId = 'A1' | 'A2' | 'A3' | 'A5'

export const ko = (text: string): Say => ({ text, lang: 'ko' })
export const en = (text: string): Say => ({ text, lang: 'en' })

/** A1 카드 */
export type Card = {
  big: string // 크게 보여줄 글자
  sub?: string // 아래 작은 설명 (기역, ㄱ + ㅏ)
  emoji?: string
  word?: string // 그림 옆 낱말
  mark?: number // word에서 강조할 글자 위치 (파닉스)
  spell?: boolean // big의 글자를 하나씩 반짝인 뒤 읽는다
  say: Say[]
}

/** A2 듣고 고르기 문제 */
export type Question = {
  show?: string // 문제에 함께 보여줄 것 (대문자, 그림). 없으면 소리만
  say: Say[]
  answer: string
  options: string[]
  reveal?: string // 맞힌 뒤 보여줄 그림
}

/** A3 글자 만들기 과제 */
export type BuildTask = {
  show: string // 만들 글자·낱말
  emoji?: string
  say: Say[]
  pieces: string[] // 정답 블록 순서
  blocks: string[] // 고를 블록
  hangul?: boolean // 자모를 음절로 합쳐 보여준다
}

export type Level = {
  no: number
  icon: string
  title: string
  acts: ActivityId[]
  cards: () => Card[]
  quiz: () => Question[]
  build?: () => BuildTask[]
}

/** A5 따라 쓰기 한 개 */
export type TraceItem = { text: string; emoji: string; say: Say[] }

/** A5 따라 쓰기 묶음 (낱말 / 문장) */
export type TraceSet = { no: number; icon: string; title: string; items: () => TraceItem[] }

export const CARD_COUNT = 6
export const QUIZ_COUNT = 8
export const BUILD_COUNT = 5
export const TRACE_COUNT = 5
