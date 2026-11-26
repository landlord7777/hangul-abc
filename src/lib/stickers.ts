// 모은 별로 받는 스티커 — 별 10개마다 한 장, 받은 스티커는 아이가 눌러서 붙인다
export const STAR_PER_STICKER = 10

// 공주·하트 요정 테마 이모지 (plan.md 9장: 그림 작업과 저작권 걱정이 없도록 기기 이모지를 쓴다)
export const STICKERS = [
  '👑', '💖', '🦄', '🎀', '🌸', '🧚', '🌈', '🦋', '💎', '🍓',
  '🧁', '🐰', '🌷', '🏰', '🍭', '🐱', '🍰', '🌟', '🎠', '🦢',
  '🍒', '🐣', '💐', '🌙', '🪄', '🐻', '🍩', '🫧', '🦩', '💝',
]

/** 지금까지 받은 스티커 수 (모두 받으면 더 늘지 않는다) */
export const earned = (stars: number) => Math.min(STICKERS.length, Math.floor(stars / STAR_PER_STICKER))

/** 받았지만 아직 붙이지 않은 스티커 수 */
export const waiting = (stars: number, placed: number) => Math.max(0, earned(stars) - placed)

/** 다음 스티커까지 남은 별 수 (모두 받았으면 0) */
export const starsToNext = (stars: number) =>
  earned(stars) >= STICKERS.length ? 0 : STAR_PER_STICKER - (stars % STAR_PER_STICKER)
