// 첫 시도에 틀린 문제를 과목별로 모아 두었다가 다시 내는 목록 (틀린 문제 다시 하기)
import type { Question, Subject } from '../content/types'
import { sample, shuffle } from './random'

export type Review = Record<Subject, Question[]>

export const EMPTY_REVIEW: Review = { ko: [], en: [] }
export const REVIEW_MAX = 30
export const REVIEW_COUNT = 8

/** 같은 문제인지 가리는 열쇠 (보기 순서와 상관없이 읽는 말·글·정답이 같으면 같은 문제) */
const keyOf = (q: Question) => [q.say.map((s) => s.text).join('/'), q.text ?? '', q.answer].join('|')

/** 첫 시도에 틀리면 넣고(맨 앞으로), 첫 시도에 맞히면 뺀다. */
export function mark(r: Review, subject: Subject, q: Question, firstTry: boolean): Review {
  const rest = r[subject].filter((x) => keyOf(x) !== keyOf(q))
  return { ...r, [subject]: firstTry ? rest : [q, ...rest].slice(0, REVIEW_MAX) }
}

/** 다시 할 문제를 최대 8개 고르고 보기 순서를 다시 섞는다. */
export const reviewQuestions = (list: Question[]) =>
  sample(list, REVIEW_COUNT).map((q) => ({ ...q, options: shuffle(q.options) }))
