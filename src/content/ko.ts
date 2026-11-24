// 한글 레벨 1~3(자모, 받침 없는 글자, 받침 없는 낱말) 데이터와 문제 생성기
import { compose, consonantSound } from '../lib/hangul'
import { pick, sample, shuffle } from '../lib/random'
import { BUILD_COUNT, CARD_COUNT, QUIZ_COUNT, ko, type Level } from './types'

// [자음, 이름, 그림, 낱말]
const CONSONANTS: [string, string, string, string][] = [
  ['ㄱ', '기역', '🦒', '기린'],
  ['ㄴ', '니은', '🦋', '나비'],
  ['ㄷ', '디귿', '🐿️', '다람쥐'],
  ['ㄹ', '리을', '📻', '라디오'],
  ['ㅁ', '미음', '🧢', '모자'],
  ['ㅂ', '비읍', '🍌', '바나나'],
  ['ㅅ', '시옷', '🦁', '사자'],
  ['ㅇ', '이응', '🦆', '오리'],
  ['ㅈ', '지읒', '🚲', '자전거'],
  ['ㅊ', '치읓', '🧀', '치즈'],
  ['ㅋ', '키읔', '🐘', '코끼리'],
  ['ㅌ', '티읕', '🍅', '토마토'],
  ['ㅍ', '피읖', '🍇', '포도'],
  ['ㅎ', '히읗', '🐯', '호랑이'],
]

// [모음, 그림, 낱말] — ㅡ는 아이가 아는 낱말이 마땅치 않아 비워 둔다.
const VOWELS: [string, string, string][] = [
  ['ㅏ', '👶', '아기'],
  ['ㅑ', '⚾', '야구'],
  ['ㅓ', '🍢', '어묵'],
  ['ㅕ', '🦊', '여우'],
  ['ㅗ', '🥒', '오이'],
  ['ㅛ', '🪀', '요요'],
  ['ㅜ', '🥛', '우유'],
  ['ㅠ', '🦄', '유니콘'],
  ['ㅡ', '', ''],
  ['ㅣ', '🦷', '이'],
]

// 받침 없고 기본 모음만 쓰는 낱말 [낱말, 그림]
export const WORDS: [string, string][] = [
  ['나무', '🌳'], ['바다', '🌊'], ['오리', '🦆'], ['우유', '🥛'], ['나비', '🦋'],
  ['사자', '🦁'], ['기차', '🚂'], ['모자', '🧢'], ['포도', '🍇'], ['토마토', '🍅'],
  ['바나나', '🍌'], ['오이', '🥒'], ['하마', '🦛'], ['여우', '🦊'], ['아기', '👶'],
  ['피자', '🍕'], ['치마', '👗'], ['가지', '🍆'], ['고기', '🍖'], ['고구마', '🍠'],
  ['거미', '🕷️'], ['지구', '🌍'],
]

type Jamo = { j: string; name: string; sound: string; emoji: string; word: string; consonant: boolean }

const JAMO: Jamo[] = [
  ...CONSONANTS.map(([j, name, emoji, word]) => ({ j, name, sound: consonantSound(j), emoji, word, consonant: true })),
  ...VOWELS.map(([j, emoji, word]) => {
    const s = compose('ㅇ', j)!
    return { j, name: s, sound: s, emoji, word, consonant: false }
  }),
]

const C = CONSONANTS.map((c) => c[0])
const V = VOWELS.map((v) => v[0])
const PAIRS = C.flatMap((c) => V.map((v) => [c, v] as const))
const syl = (c: string, v: string) => compose(c, v)!
const others = <T,>(list: readonly T[], not: T) => list.filter((x) => x !== not)

export const KO_LEVELS: Level[] = [
  {
    no: 1,
    icon: 'ㄱㅏ',
    title: '자음과 모음',
    acts: ['A1', 'A2'],
    cards: () =>
      sample(JAMO, CARD_COUNT).map((m) => ({
        big: m.j,
        sub: m.consonant ? m.name : undefined,
        emoji: m.emoji || undefined,
        word: m.word || undefined,
        say: [ko(m.name), ...(m.consonant ? [ko(m.sound)] : []), ...(m.word ? [ko(m.word)] : [])],
      })),
    quiz: () =>
      sample(JAMO, QUIZ_COUNT).map((m) => {
        const group = JAMO.filter((x) => x.consonant === m.consonant && x.j !== m.j)
        return { say: [ko(m.name)], answer: m.j, options: shuffle([m.j, ...sample(group, 2).map((x) => x.j)]) }
      }),
  },
  {
    no: 2,
    icon: '가',
    title: '글자 만들기',
    acts: ['A1', 'A2', 'A3'],
    cards: () => sample(PAIRS, CARD_COUNT).map(([c, v]) => ({ big: syl(c, v), sub: `${c} + ${v}`, say: [ko(syl(c, v))] })),
    quiz: () =>
      sample(PAIRS, QUIZ_COUNT).map(([c, v]) => {
        const a = syl(c, v)
        // 오답 하나는 자음이 같고, 하나는 모음이 같다.
        return { say: [ko(a)], answer: a, options: shuffle([a, syl(c, pick(others(V, v))), syl(pick(others(C, c)), v)]) }
      }),
    build: () =>
      sample(PAIRS, BUILD_COUNT).map(([c, v]) => ({
        show: syl(c, v),
        say: [ko(syl(c, v))],
        pieces: [c, v],
        blocks: [...shuffle([c, ...sample(others(C, c), 2)]), ...shuffle([v, ...sample(others(V, v), 2)])],
        hangul: true,
      })),
  },
  {
    no: 3,
    icon: '🌳',
    title: '낱말 읽기',
    acts: ['A1', 'A2', 'A3'],
    cards: () => sample(WORDS, CARD_COUNT).map(([w, emoji]) => ({ big: w, emoji, say: [ko(w)] })),
    quiz: () =>
      sample(WORDS, QUIZ_COUNT).map(([w, emoji]) => ({
        say: [ko(w)],
        answer: w,
        options: shuffle([w, ...sample(others(WORDS.map((x) => x[0]), w), 2)]),
        reveal: emoji,
      })),
    build: () =>
      sample(WORDS, BUILD_COUNT).map(([w, emoji]) => {
        const pieces = [...w]
        const extra = pick(WORDS.flatMap(([x]) => [...x]).filter((s) => !pieces.includes(s)))
        return { show: w, emoji, say: [ko(w)], pieces, blocks: shuffle([...pieces, extra]) }
      }),
  },
]
