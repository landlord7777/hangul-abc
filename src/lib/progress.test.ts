// 진도 기록 규칙의 테스트
import { expect, it } from 'vitest'
import { EMPTY_PROGRESS, record } from './progress'

it('별을 더하고 최고 정답률만 남긴다', () => {
  let p = record(EMPTY_PROGRESS, 'ko-1-A2', 0.5, 4)
  p = record(p, 'ko-1-A2', 0.9, 7)
  p = record(p, 'ko-1-A2', 0.6, 5)
  expect(p.stars).toBe(16)
  expect(p.best['ko-1-A2']).toBe(0.9)
})

