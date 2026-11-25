// A5 따라 쓰기용 한글·영어 낱말과 짧은 문장 데이터
import { sample } from '../lib/random'
import { TRACE_COUNT, en, ko, type Lang, type Subject, type TraceSet } from './types'

// [글, 그림]
export const KO_WORDS: [string, string][] = [
  ['나무', '🌳'], ['바다', '🌊'], ['사과', '🍎'], ['엄마', '👩'], ['아빠', '👨'],
  ['하늘', '🌤️'], ['구름', '☁️'], ['꽃', '🌸'], ['나비', '🦋'], ['토끼', '🐰'],
  ['고양이', '🐱'], ['강아지', '🐶'], ['딸기', '🍓'], ['우유', '🥛'], ['공주', '👸'],
  ['왕관', '👑'], ['하트', '💖'], ['별', '⭐'], ['무지개', '🌈'], ['친구', '👭'],
]

export const KO_SENTENCES: [string, string][] = [
  ['사랑해요.', '💕'], ['안녕하세요.', '👋'], ['고마워요.', '🙏'], ['나비가 날아요.', '🦋'],
  ['꽃이 예뻐요.', '🌸'], ['별이 반짝여요.', '✨'], ['엄마 사랑해요.', '💖'], ['아빠 최고!', '👍'],
  ['같이 놀자.', '🧸'], ['고양이가 자요.', '😺'], ['하늘이 파래요.', '🌤️'], ['딸기가 좋아요.', '🍓'],
]

// 캐치! 티니핑의 주인공·로열·레전드 티니핑 (나무위키 "티니핑" 문서에서 철자 확인, 2026-11-25).
// 그림은 이름 뜻에서 고른 것(레몬 → 🍋)이고, 뜻이 없는 이름은 💖로 둔다.
export const KO_TEENIEPING: [string, string][] = [
  ['하츄핑', '💖'], ['바로핑', '💖'], ['아자핑', '💖'], ['차차핑', '💖'], ['라라핑', '💖'],
  ['해핑', '☀️'], ['조아핑', '💖'], ['방글핑', '😊'], ['믿어핑', '💖'], ['꾸래핑', '💖'],
  ['나나핑', '💖'], ['솔찌핑', '💖'], ['포실핑', '💖'], ['말랑핑', '💖'], ['샤샤핑', '💖'],
  ['빛나핑', '✨'], ['초롱핑', '✨'], ['빤짝핑', '✨'], ['왕자핑', '🤴'], ['사뿐핑', '💖'],
  ['아름핑', '💖'], ['뽀니핑', '💖'], ['레몬핑', '🍋'], ['체리핑', '🍒'], ['라임핑', '💚'],
  ['새콤핑', '🍋'], ['달콤핑', '🍬'], ['오로라핑', '🌌'], ['이클립스핑', '🌑'], ['다이아나핑', '💎'],
  ['뮤즈핑', '🎵'], ['디바핑', '🎤'], ['다이아 하츄핑', '💎'], ['플로라 하츄핑', '🌸'], ['베리 하츄핑', '🍓'],
  ['스타 하츄핑', '⭐'], ['프린세스 하츄핑', '👑'],
]

export const EN_WORDS: [string, string][] = [
  ['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['pig', '🐷'], ['hat', '🎩'], ['bus', '🚌'],
  ['cup', '☕'], ['fox', '🦊'], ['red', '🔴'], ['mom', '👩'], ['dad', '👨'], ['love', '💖'],
  ['star', '⭐'], ['fish', '🐟'], ['book', '📖'], ['pink', '🎀'],
]

export const EN_SENTENCES: [string, string][] = [
  ['I love you.', '💖'], ['Hello!', '👋'], ['I see a cat.', '🐱'], ['I am happy.', '😊'],
  ['I like pink.', '🎀'], ['Good night.', '🌙'], ['I can run.', '🏃'], ['Thank you.', '🙏'],
  ['I love Mom.', '👩'], ['It is a dog.', '🐶'],
]

const set = (no: number, icon: string, title: string, list: [string, string][], lang: Lang): TraceSet => ({
  no,
  icon,
  title,
  items: () =>
    sample(list, TRACE_COUNT).map(([text, emoji]) => ({ text, emoji, say: [lang === 'ko' ? ko(text) : en(text)] })),
})

export const TRACE: Record<Subject, TraceSet[]> = {
  ko: [
    set(1, '🌳', '낱말 쓰기', KO_WORDS, 'ko'),
    set(2, '💕', '문장 쓰기', KO_SENTENCES, 'ko'),
    set(3, '💖', '티니핑 이름', KO_TEENIEPING, 'ko'),
  ],
  en: [set(1, '🐱', '낱말 쓰기', EN_WORDS, 'en'), set(2, '💖', '문장 쓰기', EN_SENTENCES, 'en')],
}
