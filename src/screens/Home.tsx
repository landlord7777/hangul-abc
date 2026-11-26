// 첫 화면 — 한글·영어 중 공부할 과목을 고르고, 스티커북으로 간다
import { LINES } from '../content/lines'
import Fairy from '../components/Fairy'
import ParentButton from '../components/ParentButton'
import type { Subject } from '../content/types'
import { speak } from '../lib/speech'

export default function Home({ stars, gifts, onPick, onStickers, onParent }: {
  stars: number
  gifts: number // 받았지만 아직 안 붙인 스티커 수
  onPick: (s: Subject) => void
  onStickers: () => void
  onParent: () => void
}) {
  return (
    <div className="screen center">
      <ParentButton onEnter={onParent} />
      <div className="stars">⭐ {stars}</div>
      <Fairy pose="welcome" size={300} onClick={() => speak(LINES.hello)} />
      <h1 className="title">✨ 반짝 한글 ABC ✨</h1>
      <div className="subject-btns">
        <button
          className="big-btn ko"
          onClick={() => {
            speak(LINES.koStart)
            onPick('ko')
          }}
        >
          <span className="glyph">가</span>한글
        </button>
        <button
          className="big-btn en"
          onClick={() => {
            speak(LINES.enStart)
            onPick('en')
          }}
        >
          <span className="glyph en-font">ABC</span>영어
        </button>
      </div>
      <button className="sticker-btn" onClick={onStickers}>
        📒 스티커북
        {gifts > 0 && <span className="badge">{gifts}</span>}
      </button>
    </div>
  )
}
