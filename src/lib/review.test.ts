// 틀린 문제 목록에 넣고 빼는 규칙의 테스트
import { expect, it } from 'vitest'
import { ko, type Question } from '../content/types'
import { EMPTY_REVIEW, REVIEW_COUNT, REVIEW_MAX, mark, reviewQuestions } from './review'

const q = (answer: string, options = [answer, 'x', 'y']): Question => ({ say: [ko(answer)], answer, options })

it('첫 시도에 틀린 문제를 맨 앞에 넣고, 같은 문제는 한 번만 둔다', () => {
  let r = mark(EMPTY_REVIEW, 'ko', q('가'), false)
  r = mark(r, 'ko', q('나'), false)
  r = mark(r, 'ko', q('가', ['x', '가', 'y']), false) // 보기 순서만 다른 같은 문제
  expect(r.ko.map((x) => x.answer)).toEqual(['가', '나'])
  expect(r.en).toEqual([])
})

it('첫 시도에 맞히면 목록에서 뺀다', () => {
  let r = mark(EMPTY_REVIEW, 'en', q('b'), false)
  r = mark(r, 'en', q('c'), false)
  r = mark(r, 'en', q('b'), true)
  expect(r.en.map((x) => x.answer)).toEqual(['c'])
})

it('읽는 말이나 빈칸 글이 다르면 다른 문제로 본다', () => {
  let r = mark(EMPTY_REVIEW, 'ko', { ...q('고'), text: '□기' }, false)
  r = mark(r, 'ko', { ...q('고'), text: '□구마' }, false)
  r = mark(r, 'ko', q('고'), false)
  expect(r.ko).toHaveLength(3)
})

it(`최근 ${REVIEW_MAX}개까지만 둔다`, () => {
  let r = EMPTY_REVIEW
  for (let k = 0; k < REVIEW_MAX + 5; k++) r = mark(r, 'ko', q(String(k)), false)
  expect(r.ko).toHaveLength(REVIEW_MAX)
  expect(r.ko[0].answer).toBe(String(REVIEW_MAX + 4))
})

it(`다시 할 문제는 ${REVIEW_COUNT}개까지, 보기는 그대로(순서만 섞음)`, () => {
  const list = Array.from({ length: 12 }, (_, k) => q(String(k)))
  const picked = reviewQuestions(list)
  expect(picked).toHaveLength(REVIEW_COUNT)
  for (const p of picked) expect([...p.options].sort()).toEqual([p.answer, 'x', 'y'].sort())
  expect(reviewQuestions(list.slice(0, 3))).toHaveLength(3)
})
