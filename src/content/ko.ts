// 한글 레벨 1~3(자모, 받침 없는 글자, 받침 없는 낱말) 데이터와 문제 생성기 (소리 합치기, 헷갈리는 글자, 낱말 퀴즈 포함)
import { compose, consonantSound, decompose } from '../lib/hangul'
import { pick, sample, shuffle } from '../lib/random'
import { LINES } from './lines'
import { BUILD_COUNT, CARD_COUNT, QUIZ_COUNT, ko, type Level, type Question } from './types'

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
// 레벨 2는 "텨", "쵸"처럼 낯선 글자를 피하려고 기본 모음 6개만 쓴다.
const V = ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ']
const PAIRS = C.flatMap((c) => V.map((v) => [c, v] as const))
const syl = (c: string, v: string) => compose(c, v)!
const others = <T,>(list: readonly T[], not: T) => list.filter((x) => x !== not)
const vowelSound = (v: string) => syl('ㅇ', v)
const nameOf = (j: string) => JAMO.find((m) => m.j === j)!.name

// 모양이 비슷해 헷갈리기 쉬운 자모 (소중한글처럼 비슷한 것끼리 견주어 구별한다)
const LOOK_GROUPS = [
  ['ㄱ', 'ㅋ', 'ㄴ'], ['ㄷ', 'ㅌ', 'ㄹ'], ['ㅂ', 'ㅍ', 'ㅁ'], ['ㅈ', 'ㅊ', 'ㅅ'], ['ㅇ', 'ㅎ', 'ㅁ'],
  ['ㅏ', 'ㅑ', 'ㅓ'], ['ㅓ', 'ㅕ', 'ㅏ'], ['ㅗ', 'ㅛ', 'ㅜ'], ['ㅜ', 'ㅠ', 'ㅗ'], ['ㅡ', 'ㅣ', 'ㅜ'],
]
// 글자 안에서 바꿔 넣을 비슷한 자음·모음 (모음은 레벨 2의 기본 모음 6개 안에서)
const LOOK_C: Record<string, string[]> = {
  ㄱ: ['ㅋ', 'ㄴ'], ㅋ: ['ㄱ'], ㄴ: ['ㄷ', 'ㄱ'], ㄷ: ['ㅌ', 'ㄹ'], ㅌ: ['ㄷ'], ㄹ: ['ㄷ'], ㅁ: ['ㅂ', 'ㅇ'],
  ㅂ: ['ㅍ', 'ㅁ'], ㅍ: ['ㅂ'], ㅅ: ['ㅈ'], ㅈ: ['ㅊ', 'ㅅ'], ㅊ: ['ㅈ'], ㅇ: ['ㅎ', 'ㅁ'], ㅎ: ['ㅇ'],
}
const LOOK_V: Record<string, string[]> = { ㅏ: ['ㅓ', 'ㅣ'], ㅓ: ['ㅏ'], ㅗ: ['ㅜ'], ㅜ: ['ㅗ', 'ㅡ'], ㅡ: ['ㅜ'], ㅣ: ['ㅏ'] }

/** 정답 글자와 자음 또는 모음 하나만 다른 비슷한 글자 둘 (bad에 든 글자는 뺀다) */
function lookAlikes(s: string, bad: (x: string) => boolean = () => false) {
  const [c, v] = decompose(s)!
  const near = [...(LOOK_C[c] ?? []).map((x) => syl(x, v)), ...(LOOK_V[v] ?? []).map((x) => syl(c, x))]
  const far = [...others(C, c).map((x) => syl(x, v)), ...others(V, v).map((x) => syl(c, x))]
  const ok = (x: string) => x !== s && !bad(x)
  const pickFrom = shuffle(near.filter(ok))
  return [...new Set([...pickFrom, ...shuffle(far.filter(ok))])].slice(0, 2)
}

// 레벨 3 낱말 퀴즈: 그림 보고 낱말 고르기와 빈칸 글자 채우기를 번갈아 낸다.
function wordQuiz(): Question[] {
  const names = WORDS.map(([w]) => w)
  return sample(WORDS, QUIZ_COUNT).map(([w, emoji], k) => {
    if (k % 2 === 0) {
      const same = others(names, w).filter((x) => x.length === w.length)
      const pool = same.length >= 2 ? same : others(names, w)
      return { show: emoji, say: LINES.pictureQ, answer: w, options: shuffle([w, ...sample(pool, 2)]), after: [ko(w)] }
    }
    const at = Math.floor(Math.random() * w.length)
    const fill = (x: string) => w.slice(0, at) + x + w.slice(at + 1)
    // 바꿔 넣었을 때 다른 낱말이 되는 글자는 보기에서 뺀다 (나무의 □에 비 → 나비).
    const wrong = lookAlikes(w[at], (x) => names.includes(fill(x)))
    return { show: emoji, text: fill('□'), say: LINES.blankQ, answer: w[at], options: shuffle([w[at], ...wrong]), after: [ko(w)] }
  })
}

/** 레벨 1~3에서 읽어 주는 모든 한국어 문구 (더빙 대본용) */
export const KO_PHRASES = [
  ...JAMO.map((m) => m.name),
  ...JAMO.map((m) => m.sound),
  ...JAMO.map((m) => m.word).filter(Boolean),
  ...PAIRS.map(([c, v]) => syl(c, v)),
  ...WORDS.map(([w]) => w),
]

export const KO_LEVELS: Level[] = [
  {
    no: 1,
    icon: 'ㄱㅏ',
    title: '자음과 모음',
    acts: ['A1', 'A2', 'A9'],
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
    extra: {
      // 비슷한 모양 셋 중에서 이름을 듣고 고른다 (ㄱ / ㅋ / ㄴ).
      A9: () =>
        sample(LOOK_GROUPS, QUIZ_COUNT).map((g) => {
          const j = pick(g)
          return { say: [ko(nameOf(j))], answer: j, options: shuffle(g) }
        }),
    },
  },
  {
    no: 2,
    icon: '가',
    title: '글자 만들기',
    acts: ['A1', 'A2', 'A3', 'A8', 'A9'],
    // 자음 소리(느)와 모음 소리(아)를 차례로 들려준 뒤 합친 소리(나)를 읽는다.
    cards: () =>
      sample(PAIRS, CARD_COUNT).map(([c, v]) => ({
        big: syl(c, v),
        blend: [c, v] as [string, string],
        say: [ko(consonantSound(c)), ko(vowelSound(v)), ko(syl(c, v))],
      })),
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
    extra: {
      // ㄴ 소리 + ㅏ 소리를 듣고 합쳐진 글자를 고른다.
      A8: () =>
        sample(PAIRS, QUIZ_COUNT).map(([c, v]) => {
          const a = syl(c, v)
          return {
            show: `${c}+${v}`,
            say: [ko(consonantSound(c)), ko(vowelSound(v))],
            answer: a,
            options: shuffle([a, syl(c, pick(others(V, v))), syl(pick(others(C, c)), v)]),
            after: [ko(a)],
          }
        }),
      // 글자를 듣고, 자음이나 모음 하나만 비슷하게 다른 글자 사이에서 고른다 (거 / 고 / 커).
      A9: () =>
        sample(PAIRS, QUIZ_COUNT).map(([c, v]) => {
          const a = syl(c, v)
          return { say: [ko(a)], answer: a, options: shuffle([a, ...lookAlikes(a)]) }
        }),
    },
  },
  {
    no: 3,
    icon: '🌳',
    title: '낱말 읽기',
    acts: ['A1', 'A2', 'A3', 'A7'],
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
    extra: { A7: wordQuiz },
  },
]
