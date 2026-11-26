// 스티커북 — 별로 받은 스티커를 아이가 반짝이는 칸을 눌러 하나씩 붙인다
import { useEffect, useState } from 'react'
import Fairy from '../components/Fairy'
import { LINES } from '../content/lines'
import { speak } from '../lib/speech'
import { STICKERS, earned, starsToNext, waiting } from '../lib/stickers'

export default function StickerBook({ stars, placed, onPlace, onBack }: {
  stars: number
  placed: number
  onPlace: () => void
  onBack: () => void
}) {
  const left = waiting(stars, placed)
  const all = earned(stars) >= STICKERS.length && left === 0
  const [justPlaced, setJustPlaced] = useState(-1)
  const greet = () => speak(left > 0 ? [...LINES.stickerNew, ...LINES.stickerTap] : all ? LINES.stickerAll : LINES.stickerMore)

  // 처음 열 때만 안내한다. 붙일 때마다 다시 읽지 않는다.
  useEffect(greet, [])

  const place = () => {
    setJustPlaced(placed)
    onPlace()
    speak(left > 1 ? LINES.stickerPlaced : [...LINES.stickerPlaced, ...(placed + 1 >= STICKERS.length ? LINES.stickerAll : LINES.stickerMore)])
  }

  return (
    <div className="screen">
      <header className="bar">
        <button className="icon-btn" aria-label="처음으로" onClick={onBack}>
          ⬅️
        </button>
        <h2>📒 스티커북</h2>
        <div className="stars inline">⭐ {stars}</div>
      </header>
      <div className="sticker-top">
        <Fairy pose={left > 0 ? 'cheer' : 'welcome'} size={120} onClick={greet} />
        <p className="sticker-msg">
          {left > 0
            ? `🎁 새 스티커 ${left}장! 반짝이는 칸을 눌러 봐`
            : all
              ? '🎉 스티커를 모두 모았어!'
              : `⭐ 별 ${starsToNext(stars)}개 더 모으면 새 스티커`}
        </p>
      </div>
      <div className="sticker-grid">
        {STICKERS.map((s, k) =>
          k < placed ? (
            <span key={k} className={`sticker${k === justPlaced ? ' new' : ''}`}>
              {s}
            </span>
          ) : k === placed && left > 0 ? (
            <button key={k} className="sticker gift" aria-label="스티커 붙이기" onClick={place}>
              🎁
            </button>
          ) : (
            <span key={k} className="sticker empty" />
          ),
        )}
      </div>
    </div>
  )
}
