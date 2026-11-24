// 영어 레벨 1~3(알파벳, 파닉스 대표 단어, CVC 낱말) 데이터와 문제 생성기
import { pick, sample, shuffle } from '../lib/random'
import { BUILD_COUNT, CARD_COUNT, QUIZ_COUNT, en, type Level } from './types'

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
        return { big: l, emoji, word, mark: word.indexOf(l), say: [en(`${up(l)}, ${word}`)] }
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
    acts: ['A1', 'A2', 'A3'],
    cards: () => sample(CVC, CARD_COUNT).map(([w, emoji]) => ({ big: w, emoji, spell: true, say: [en(w)] })),
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
  },
]
