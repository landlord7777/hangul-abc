// 스티커를 받고, 붙이고, 큰 스티커로 바꾸고, 새 권이 생기는 규칙의 테스트
import { expect, it } from 'vitest'
import {
  BIG, BOOK_SIZE, EMPTY_ALBUM, STAR_PER_STICKER, STICKERS, TRADE,
  count, earned, fromPlaced, isFull, place, starsToNext, trade, waiting, type Album,
} from './stickers'

it('작은 스티커와 큰 스티커는 모두 서로 다르고, 한 권보다 종류가 많다', () => {
  const all = [...STICKERS, ...BIG, '🎁']
  expect(new Set(all).size).toBe(all.length)
  expect(STICKERS.length).toBeGreaterThan(BOOK_SIZE * 2)
})

it(`별 ${STAR_PER_STICKER}개마다 한 장, 상한 없이 받는다`, () => {
  expect(earned(9)).toBe(0)
  expect(earned(10)).toBe(1)
  expect(earned(1000)).toBe(100)
  expect(waiting(25, { ...EMPTY_ALBUM, taken: 0 })).toBe(2)
  expect(waiting(25, { ...EMPTY_ALBUM, taken: 2 })).toBe(0)
  expect(starsToNext(0)).toBe(10)
  expect(starsToNext(23)).toBe(7)
})

it('예전 저장값(붙인 수)은 1권 앞칸에 예전 순서대로 옮기고, 꽉 찼으면 새 권을 붙인다', () => {
  const a = fromPlaced(3)
  expect(a.books).toHaveLength(1)
  expect(a.books[0].slice(0, 4)).toEqual([0, 1, 2, -1])
  expect(a.taken).toBe(3)
  const full = fromPlaced(30)
  expect(full.books).toHaveLength(2)
  expect(full.books[0]).toEqual(Array.from({ length: 30 }, (_, k) => k))
  expect(count(full.books[1])).toBe(0)
})

it('붙일 때는 첫 빈칸에, 그 권에 없는 스티커를 붙인다', () => {
  let a: Album = EMPTY_ALBUM
  for (let k = 0; k < BOOK_SIZE - 1; k++) a = place(a, 0).album
  expect(new Set(a.books[0].filter((v) => v >= 0)).size).toBe(BOOK_SIZE - 1)
  expect(a.books).toHaveLength(1)
  const last = place(a, 0, () => 0.999)
  expect(last.slot).toBe(BOOK_SIZE - 1)
  expect(isFull(last.album.books[0])).toBe(true)
  expect(last.album.books).toHaveLength(2) // 꽉 차면 새 권
  expect(last.album.taken).toBe(BOOK_SIZE)
})

it(`${TRADE}장을 떼어 내면 큰 스티커를 받고 그 칸은 빈다. 빈칸이 있으면 새 권을 더 만들지 않는다`, () => {
  const a = fromPlaced(30)
  const t = trade(a, 0, [0, 1, 2, 3, 4], () => 0)
  expect(t.books[0].slice(0, 6)).toEqual([-1, -1, -1, -1, -1, 5])
  expect(t.big).toEqual([0])
  expect(trade(t, 0, [5], () => 0).big).toEqual([0, 1]) // 없는 것부터
  const p = place(t, 0)
  expect(p.slot).toBe(0)
  expect(p.album.books).toHaveLength(2)
})

it('큰 스티커를 다 모으면 다시 아무거나 준다', () => {
  const a = { ...EMPTY_ALBUM, big: BIG.map((_, k) => k) }
  expect(trade(a, 0, [], () => 0).big).toHaveLength(BIG.length + 1)
})
