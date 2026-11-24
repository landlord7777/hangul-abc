// 하루 사용시간 계산(자정 초기화, 추가 시간, 제한 없음)의 테스트
import { expect, it } from 'vitest'
import { EMPTY_USAGE, addBonus, addSeconds, dayKey, remainingSeconds } from './usage'

const day1 = new Date(2026, 10, 24, 18, 0)
const day1Late = new Date(2026, 10, 24, 23, 59)
const day2 = new Date(2026, 10, 25, 0, 1)

it('기기 시간대 기준 날짜를 만든다', () => {
  expect(dayKey(day1)).toBe('2026-11-24')
  expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
})

it('쓴 만큼 남은 시간이 줄고 0 아래로 내려가지 않는다', () => {
  let u = addSeconds(EMPTY_USAGE, day1, 60)
  expect(remainingSeconds(u, day1, 20)).toBe(19 * 60)
  u = addSeconds(u, day1Late, 30 * 60)
  expect(remainingSeconds(u, day1Late, 20)).toBe(0)
})

it('추가 시간을 더한다', () => {
  let u = addSeconds(EMPTY_USAGE, day1, 20 * 60)
  u = addBonus(u, day1, 10)
  expect(remainingSeconds(u, day1, 20)).toBe(10 * 60)
})

it('자정이 지나면 사용시간과 추가 시간이 모두 초기화된다', () => {
  let u = addSeconds(EMPTY_USAGE, day1, 25 * 60)
  u = addBonus(u, day1, 10)
  expect(remainingSeconds(u, day2, 20)).toBe(20 * 60)
  u = addSeconds(u, day2, 5)
  expect(u).toEqual({ date: '2026-11-25', seconds: 5, bonusMin: 0 })
})

it('제한이 0분이면 제한 없음', () => {
  const u = addSeconds(EMPTY_USAGE, day1, 999 * 60)
  expect(remainingSeconds(u, day1, 0)).toBe(Infinity)
})
