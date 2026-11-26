// 별 수로 받는 스티커 수를 계산하는 규칙의 테스트
import { expect, it } from 'vitest'
import { STAR_PER_STICKER, STICKERS, earned, starsToNext, waiting } from './stickers'

it('스티커는 서로 다르다', () => {
  expect(new Set(STICKERS).size).toBe(STICKERS.length)
})

it(`별 ${STAR_PER_STICKER}개마다 한 장을 받고, 다 받으면 더 늘지 않는다`, () => {
  expect(earned(0)).toBe(0)
  expect(earned(9)).toBe(0)
  expect(earned(10)).toBe(1)
  expect(earned(25)).toBe(2)
  expect(earned(100000)).toBe(STICKERS.length)
})

it('붙이지 않은 스티커 수와 다음 스티커까지 남은 별', () => {
  expect(waiting(25, 0)).toBe(2)
  expect(waiting(25, 2)).toBe(0)
  expect(waiting(5, 3)).toBe(0)
  expect(starsToNext(0)).toBe(10)
  expect(starsToNext(23)).toBe(7)
  expect(starsToNext(100000)).toBe(0)
})
