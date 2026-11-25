// 진도 기록과 레벨 해금 규칙의 테스트
import { expect, it } from 'vitest'
import { EMPTY_PROGRESS, actKey, isUnlocked, record } from './progress'

it('별을 더하고 최고 정답률만 남긴다', () => {
  let p = record(EMPTY_PROGRESS, 'ko-1-A2', 0.5, 4)
  p = record(p, 'ko-1-A2', 0.9, 7)
  p = record(p, 'ko-1-A2', 0.6, 5)
  expect(p.stars).toBe(16)
  expect(p.best['ko-1-A2']).toBe(0.9)
})

it('레벨 1은 늘 열려 있다', () => {
  expect(isUnlocked(EMPTY_PROGRESS, 'ko', 1, [])).toBe(true)
})

it('앞 레벨의 퀴즈 활동이 모두 80% 이상이어야 열린다 (A1은 보지 않음)', () => {
  const acts = ['A1', 'A2', 'A3'] as const
  let p = record(EMPTY_PROGRESS, actKey('ko', 2, 'A2'), 0.8, 0)
  expect(isUnlocked(p, 'ko', 3, [...acts])).toBe(false)
  p = record(p, actKey('ko', 2, 'A3'), 0.79, 0)
  expect(isUnlocked(p, 'ko', 3, [...acts])).toBe(false)
  p = record(p, actKey('ko', 2, 'A3'), 1, 0)
  expect(isUnlocked(p, 'ko', 3, [...acts])).toBe(true)
  expect(isUnlocked(p, 'en', 3, [...acts])).toBe(false)
})

it('나중에 더한 활동(A7~A9)은 잠금 조건에 넣지 않는다 (이미 연 레벨이 다시 잠기지 않게)', () => {
  let p = record(EMPTY_PROGRESS, actKey('ko', 1, 'A2'), 1, 0)
  expect(isUnlocked(p, 'ko', 2, ['A1', 'A2', 'A9'])).toBe(true)
  p = record(p, actKey('ko', 2, 'A2'), 1, 0)
  p = record(p, actKey('ko', 2, 'A3'), 1, 0)
  expect(isUnlocked(p, 'ko', 3, ['A1', 'A2', 'A3', 'A8', 'A9'])).toBe(true)
})
