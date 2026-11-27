// 모은 별로 받는 스티커 — 별 10개마다 한 장을 무작위로 뽑아 붙이고, 5장을 큰 스티커로 바꾸며, 한 권이 차면 새 권이 생긴다
export const STAR_PER_STICKER = 10
export const BOOK_SIZE = 30 // 한 권의 칸 수 (6×5)
export const TRADE = 5 // 큰 스티커 한 장으로 바꾸는 작은 스티커 수

// 작은 스티커 — 공주·하트 요정 테마 이모지 (plan.md 9장: 그림 작업과 저작권 걱정이 없도록 기기 이모지를 쓴다)
// 저장값은 이 목록의 번호이므로 순서를 바꾸지 말고 뒤에만 붙인다. 앞 30장은 처음 스티커북의 순서다.
export const STICKERS = [
  '👑', '💖', '🦄', '🎀', '🌸', '🧚', '🌈', '🦋', '💎', '🍓',
  '🧁', '🐰', '🌷', '🏰', '🍭', '🐱', '🍰', '🌟', '🎠', '🦢',
  '🍒', '🐣', '💐', '🌙', '🪄', '🐻', '🍩', '🫧', '🦩', '💝',
  '🐶', '🐼', '🐨', '🐯', '🦁', '🐹', '🐭', '🐸', '🐧', '🐥',
  '🦊', '🐷', '🐮', '🐵', '🦔', '🐢', '🐬', '🐠', '🦭', '🐞',
  '🐝', '🦚', '🦜', '🦒', '🍦', '🍪', '🍫', '🍬', '🍉', '🍑',
  '🍎', '🍋', '🍇', '🥝', '🍌', '🧃', '🥞', '🍡', '🍿', '🧇',
  '🌻', '🌼', '🌹', '🍀', '🍄', '🌺', '🌵', '🍁', '🐙', '🌞',
  '🎈', '🎨', '🎵', '🪁', '🧸', '🪀', '👗', '👠', '👛', '💄',
  '🔮', '💌', '🪞', '🎤', '🛼', '👒',
]

// 큰 스티커 — 작은 스티커와 겹치지 않는 특별한 그림 (번호로 저장하므로 뒤에만 붙인다)
export const BIG = [
  '👸', '🧜‍♀️', '🎂', '💍', '🎡', '🎢', '🎆', '🌠', '🪐',
  '🐉', '🦖', '🦕', '🐳', '🏆', '🎻', '🚀', '🛸', '🎪',
]

/** books[권][칸] = 작은 스티커 번호(-1은 빈칸), big = 받은 큰 스티커 번호, taken = 지금까지 받아서 붙인 작은 스티커 수 */
export type Album = { books: number[][]; big: number[]; taken: number }

const emptyBook = () => Array<number>(BOOK_SIZE).fill(-1)
const range = (n: number) => Array.from({ length: n }, (_, k) => k)
const pick = (list: number[], rand: () => number) => list[Math.floor(rand() * list.length)]

export const isFull = (book: number[]) => !book.includes(-1)
export const count = (book: number[]) => book.filter((v) => v >= 0).length

// 모든 권이 꽉 차면 빈 새 권을 붙인다.
const withRoom = (books: number[][]) => (books.every(isFull) ? [...books, emptyBook()] : books)

export const EMPTY_ALBUM: Album = { books: [emptyBook()], big: [], taken: 0 }

/** 예전 저장값(붙인 수)을 앨범으로 옮긴다. 1권 앞칸부터 예전 순서대로 채워 그림이 그대로 남는다. */
export function fromPlaced(placed: number): Album {
  const n = Math.min(placed, BOOK_SIZE)
  return { books: withRoom([emptyBook().map((_, k) => (k < n ? k : -1))]), big: [], taken: n }
}

/** 지금까지 받은 작은 스티커 수 */
export const earned = (stars: number) => Math.floor(stars / STAR_PER_STICKER)

/** 받았지만 아직 붙이지 않은 스티커 수 */
export const waiting = (stars: number, album: Album) => Math.max(0, earned(stars) - album.taken)

/** 다음 스티커까지 남은 별 수 */
export const starsToNext = (stars: number) => STAR_PER_STICKER - (stars % STAR_PER_STICKER)

/** book권의 첫 빈칸에 그 권에 없는 작은 스티커를 무작위로 붙인다. 붙인 칸 번호도 돌려준다. */
export function place(album: Album, book: number, rand = Math.random) {
  const b = album.books[book]
  const slot = b.indexOf(-1)
  const id = pick(range(STICKERS.length).filter((k) => !b.includes(k)), rand)
  const books = album.books.map((x, i) => (i === book ? x.map((v, j) => (j === slot ? id : v)) : x))
  return { album: { ...album, books: withRoom(books), taken: album.taken + 1 }, slot }
}

/** book권에서 고른 칸의 스티커를 떼어 내고 큰 스티커 한 장을 받는다. 아직 없는 것부터 무작위로 준다. */
export function trade(album: Album, book: number, slots: number[], rand = Math.random): Album {
  const fresh = range(BIG.length).filter((k) => !album.big.includes(k))
  const id = pick(fresh.length ? fresh : range(BIG.length), rand)
  const books = album.books.map((x, i) => (i === book ? x.map((v, j) => (slots.includes(j) ? -1 : v)) : x))
  return { ...album, books, big: [...album.big, id] }
}
