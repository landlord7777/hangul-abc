// 영어 레벨 1~3(알파벳, 파닉스 글자 소리·대표 단어, CVC 낱말) 데이터와 문제 생성기 (소리 합치기, 낱말 퀴즈 포함)
import { pick, sample, shuffle } from '../lib/random'
import { LINES } from './lines'
import { BUILD_COUNT, CARD_COUNT, QUIZ_COUNT, en, type Level, type Question } from './types'

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')

// 글자별 대표 단어 [단어, 그림]. x는 첫소리 단어가 없어 fox로 끝소리를 보여준다.
const PHONICS: Record<string, [string, string]> = {
  a: ['apple', '🍎'], b: ['ball', '⚽'], c: ['cat', '🐱'], d: ['dog', '🐶'], e: ['egg', '🥚'],
  f: ['fish', '🐟'], g: ['goat', '🐐'], h: ['hat', '🎩'], i: ['insect', '🐞'], j: ['juice', '🧃'],
  k: ['kite', '🪁'], l: ['lion', '🦁'], m: ['moon', '🌙'], n: ['nest', '🪺'], o: ['octopus', '🐙'],
  p: ['pig', '🐷'], q: ['queen', '👸'], r: ['rabbit', '🐰'], s: ['sun', '☀️'], t: ['tiger', '🐯'],
  u: ['umbrella', '☂️'], v: ['van', '🚐'], w: ['web', '🕸️'], x: ['fox', '🦊'], y: ['yo-yo', '🪀'],
  z: ['zebra', '🦓'],
}

// 글자 소리 (파닉스). 더빙 목소리가 낱소리를 내도록 소리 나는 대로 적은 글이다. 모음은 짧은 소리(apple의 a).
// 더빙할 때 이상하게 들리면 Vrew에서 그 줄 글만 바꿔 본다 (이 글은 음성 파일을 찾는 키라 그대로 둔다).
export const SOUND: Record<string, string> = {
  a: 'aah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fff', g: 'guh', h: 'huh', i: 'ih', j: 'juh',
  k: 'kuh', l: 'lll', m: 'mmm', n: 'nnn', o: 'ah', p: 'puh', q: 'kwuh', r: 'rrr', s: 'sss', t: 'tuh',
  u: 'uh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz',
}
const VOWELS = ['a', 'e', 'i', 'o', 'u']

// 자음-모음-자음 3글자 낱말 [낱말, 그림]
export const CVC: [string, string][] = [
  ['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['pig', '🐷'], ['hat', '🎩'], ['bus', '🚌'],
  ['bed', '🛏️'], ['cup', '☕'], ['fox', '🦊'], ['box', '📦'], ['bat', '🦇'], ['hen', '🐔'],
  ['net', '🥅'], ['pen', '🖊️'], ['map', '🗺️'], ['fan', '🪭'], ['bag', '👜'], ['log', '🪵'],
  ['web', '🕸️'], ['bug', '🐛'], ['van', '🚐'],
]

const up = (l: string) => l.toUpperCase()
const others = <T,>(list: readonly T[], not: T) => list.filter((x) => x !== not)
const FIRST_SOUND = LETTERS.filter((l) => PHONICS[l][0].startsWith(l))
const sounds = (w: string) => [...w].map((l) => en(SOUND[l]))
const WORD_LIST = CVC.map(([w]) => w)

/** 레벨 1~3에서 읽어 주는 모든 영어 문구 (더빙 대본용) */
export const EN_PHRASES = [
  ...LETTERS.map(up),
  ...LETTERS.map((l) => PHONICS[l][0]),
  ...CVC.map(([w]) => w),
  ...LETTERS.map((l) => SOUND[l]),
]

// 레벨 3 낱말 퀴즈: 그림 보고 낱말 고르기와 가운데 모음 채우기(c□t)를 번갈아 낸다.
function wordQuiz(): Question[] {
  return sample(CVC, QUIZ_COUNT).map(([w, emoji], k) => {
    if (k % 2 === 0)
      return { show: emoji, say: LINES.pictureQ, answer: w, options: shuffle([w, ...sample(others(WORD_LIST, w), 2)]), after: [en(w)] }
    const fill = (x: string) => w[0] + x + w[2]
    // 바꿔 넣었을 때 목록의 다른 낱말이 되는 모음은 보기에서 뺀다 (bug의 □에 a → bag).
    const wrong = sample(VOWELS.filter((x) => x !== w[1] && !WORD_LIST.includes(fill(x))), 2)
    return { show: emoji, text: fill('□'), say: LINES.blankQ, answer: w[1], options: shuffle([w[1], ...wrong]), after: [en(w)] }
  })
}

// 레벨 3 소리 합치기: c-a-t 소리를 듣고 낱말을 고른다. 오답은 되도록 글자 두 개가 같은 낱말.
function blendQuiz(): Question[] {
  return sample(CVC, QUIZ_COUNT).map(([w, emoji]) => {
    const near = others(WORD_LIST, w).filter((x) => [...x].filter((l, k) => l === w[k]).length >= 1)
    const wrong = sample(near.length >= 2 ? near : others(WORD_LIST, w), 2)
    return { say: sounds(w), answer: w, options: shuffle([w, ...wrong]), reveal: emoji, after: [en(w)] }
  })
}

export const EN_LEVELS: Level[] = [
  {
    no: 1,
    icon: 'Aa',
    title: '알파벳 대문자와 소문자',
    acts: ['A1', 'A2'],
    cards: () => sample(LETTERS, CARD_COUNT).map((l) => ({ big: `${up(l)} ${l}`, say: [en(up(l))] })),
    // 아이가 아는 대문자를 보여주고 짝이 되는 소문자를 고른다.
    quiz: () =>
      sample(LETTERS, QUIZ_COUNT).map((l) => ({
        show: up(l),
        say: [en(up(l))],
        answer: l,
        options: shuffle([l, ...sample(others(LETTERS, l), 2)]),
      })),
  },
  {
    no: 2,
    icon: 'b',
    title: '글자 소리',
    acts: ['A1', 'A2'],
    cards: () =>
      sample(LETTERS, CARD_COUNT).map((l) => {
        const [word, emoji] = PHONICS[l]
        // 글자 이름(B) → 글자 소리(buh) → 대표 단어(ball) 순서로 읽는다 (더빙 대본은 한 줄에 하나씩).
        return { big: l, emoji, word, mark: word.indexOf(l), say: [en(up(l)), en(SOUND[l]), en(word)] }
      }),
    // 그림과 낱말 소리를 듣고 첫 글자를 고른다.
    quiz: () =>
      sample(FIRST_SOUND, QUIZ_COUNT).map((l) => {
        const [word, emoji] = PHONICS[l]
        return { show: emoji, say: [en(word)], answer: l, options: shuffle([l, ...sample(others(LETTERS, l), 2)]) }
      }),
  },
  {
    no: 3,
    icon: 'cat',
    title: '낱말 읽기',
    acts: ['A1', 'A2', 'A3', 'A8', 'A7'],
    // 글자 소리를 하나씩 읽으며 그 글자를 반짝이고, 마지막에 낱말 전체를 읽는다 (c-a-t → cat).
    cards: () => sample(CVC, CARD_COUNT).map(([w, emoji]) => ({ big: w, emoji, spell: true, say: [...sounds(w), en(w)] })),
    quiz: () =>
      sample(CVC, QUIZ_COUNT).map(([w, emoji]) => ({
        say: [en(w)],
        answer: w,
        options: shuffle([w, ...sample(others(CVC.map((x) => x[0]), w), 2)]),
        reveal: emoji,
      })),
    build: () =>
      sample(CVC, BUILD_COUNT).map(([w, emoji]) => {
        const pieces = [...w]
        const extra = pick(LETTERS.filter((l) => !pieces.includes(l)))
        return { show: w, emoji, say: [en(w)], pieces, blocks: shuffle([...pieces, extra]) }
      }),
    extra: { A7: wordQuiz, A8: blendQuiz },
  },
]
