// 스티커북 — 받은 스티커를 눌러 붙이고, 권을 넘겨 보고, 5장을 골라 큰 스티커로 바꾼다
import { useEffect, useState } from 'react'
import Fairy from '../components/Fairy'
import { LINES } from '../content/lines'
import { speak } from '../lib/speech'
import { BIG, STICKERS, TRADE, count, isFull, place, starsToNext, trade, waiting, type Album } from '../lib/stickers'

type View = number | 'big' // 권 번호, 또는 큰 스티커 장

export default function StickerBook({ stars, album, onChange, onBack }: {
  stars: number
  album: Album
  onChange: (a: Album) => void
  onBack: () => void
}) {
  const left = waiting(stars, album)
  const last = album.books.length - 1
  // 붙일 스티커가 있으면 빈칸이 있는 첫 권을, 없으면 마지막 권을 펼친다.
  const [view, setView] = useState<View>(() => (left > 0 ? album.books.findIndex((b) => !isFull(b)) : last))
  const [picked, setPicked] = useState<number[] | null>(null) // 큰 스티커로 바꿀 칸 (고르는 중이 아니면 null)
  const [justPlaced, setJustPlaced] = useState(-1)
  const [justBig, setJustBig] = useState(-1)

  const book = view === 'big' ? null : album.books[view]
  const full = book !== null && isFull(book)

  const greet = () =>
    speak(
      view === 'big'
        ? justBig >= 0
          ? LINES.bigNew
          : LINES.stickerMore
        : left > 0 && !full
          ? [...LINES.stickerNew, ...LINES.stickerTap]
          : full
            ? LINES.stickerAll
            : LINES.stickerMore,
    )

  // 처음 열 때만 안내한다. 붙일 때마다 다시 읽지 않는다.
  useEffect(greet, [])

  const go = (v: View) => {
    setView(v)
    setPicked(null)
    setJustPlaced(-1)
    setJustBig(-1)
  }

  const stick = (b: number) => {
    const r = place(album, b)
    onChange(r.album)
    setJustPlaced(r.slot)
    if (isFull(r.album.books[b]))
      speak([...LINES.stickerPlaced, ...LINES.stickerAll, ...(r.album.books.length > album.books.length ? LINES.stickerBook : [])])
    else speak(left > 1 ? LINES.stickerPlaced : [...LINES.stickerPlaced, ...LINES.stickerMore])
  }

  const toggle = (b: number, slot: number) => {
    if (!picked) return
    const next = picked.includes(slot) ? picked.filter((s) => s !== slot) : [...picked, slot]
    if (next.length < TRADE) return setPicked(next)
    onChange(trade(album, b, next))
    go('big')
    setJustBig(album.big.length)
    speak(LINES.bigNew)
  }

  const startPick = () => {
    setPicked([])
    setJustPlaced(-1)
    speak(LINES.tradePick)
  }

  const msg =
    view === 'big'
      ? album.big.length
        ? `💎 큰 스티커 ${album.big.length}장`
        : `💎 스티커 ${TRADE}장을 큰 스티커로 바꿀 수 있어`
      : picked
        ? `💎 바꿀 스티커를 골라 봐 (${picked.length}/${TRADE})`
        : left > 0 && !full
          ? `🎁 새 스티커 ${left}장! 반짝이는 칸을 눌러 봐`
          : left > 0
            ? `🎁 새 스티커 ${left}장! ${album.books.findIndex((b) => !isFull(b)) > (view as number) ? '▶' : '◀'} 넘겨서 붙여 봐`
            : full
              ? view === last
                ? '🎉 스티커를 모두 모았어!'
                : '🎉 스티커를 모두 모았어! ▶ 넘겨 봐'
              : `⭐ 별 ${starsToNext(stars)}개 더 모으면 새 스티커`

  // 큰 스티커 장은 마지막 권 다음 장이다.
  const prev: View | null = view === 'big' ? last : view > 0 ? view - 1 : null
  const next: View | null = view === 'big' ? null : view < last ? view + 1 : 'big'

  return (
    <div className="screen">
      <header className="bar">
        <button className="icon-btn" aria-label="처음으로" onClick={onBack}>
          ⬅️
        </button>
        <div className="book-nav">
          <button className="icon-btn" aria-label="앞 장" disabled={prev === null} onClick={() => prev !== null && go(prev)}>
            ◀
          </button>
          <h2>{view === 'big' ? '💎 큰 스티커' : `📒 스티커북 ${view + 1}권`}</h2>
          <button className="icon-btn" aria-label="다음 장" disabled={next === null} onClick={() => next !== null && go(next)}>
            ▶
          </button>
        </div>
        <div className="stars inline">⭐ {stars}</div>
      </header>
      <div className="sticker-top">
        <Fairy pose={left > 0 || justBig >= 0 ? 'cheer' : 'welcome'} size={120} onClick={greet} />
        <p className="sticker-msg">{msg}</p>
        {book && !picked && count(book) >= TRADE && (
          <button className="sticker-btn" onClick={startPick}>
            💎 큰 스티커로 바꾸기
          </button>
        )}
        {picked && (
          <button className="sticker-btn" onClick={() => setPicked(null)}>
            그만하기
          </button>
        )}
      </div>
      {view === 'big' ? (
        <div className="sticker-grid big-grid">
          {/* 받은 큰 스티커 뒤로 빈칸을 두어 4칸씩 줄을 맞춘다 (적어도 두 줄) */}
          {Array.from({ length: Math.max(8, Math.ceil((album.big.length + 1) / 4) * 4) }, (_, k) =>
            k < album.big.length ? (
              <span key={k} className={`sticker big${k === justBig ? ' new' : ''}`}>
                <span>{BIG[album.big[k]]}</span>
              </span>
            ) : (
              <span key={k} className="sticker empty" />
            ),
          )}
        </div>
      ) : (
        <div className="sticker-grid">
          {book!.map((id, k) => {
            const b = view as number
            if (id >= 0)
              return picked ? (
                <button
                  key={k}
                  className={`sticker pick${picked.includes(k) ? ' picked' : ''}`}
                  aria-label="이 스티커 고르기"
                  onClick={() => toggle(b, k)}
                >
                  {STICKERS[id]}
                </button>
              ) : (
                <span key={k} className={`sticker${k === justPlaced ? ' new' : ''}`}>
                  {STICKERS[id]}
                </span>
              )
            if (!picked && left > 0 && k === book!.indexOf(-1))
              return (
                <button key={k} className="sticker gift" aria-label="스티커 붙이기" onClick={() => stick(b)}>
                  🎁
                </button>
              )
            return <span key={k} className="sticker empty" />
          })}
        </div>
      )}
    </div>
  )
}
