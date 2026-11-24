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
  ko: [set(1, '🌳', '낱말 쓰기', KO_WORDS, 'ko'), set(2, '💕', '문장 쓰기', KO_SENTENCES, 'ko')],
  en: [set(1, '🐱', '낱말 쓰기', EN_WORDS, 'en'), set(2, '💖', '문장 쓰기', EN_SENTENCES, 'en')],
}
