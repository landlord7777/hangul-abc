// 첫 화면 — 한글·영어 중 공부할 과목을 고른다
import Fairy from '../components/Fairy'
import ParentButton from '../components/ParentButton'
import { en, ko, type Subject } from '../content/types'
import { speak } from '../lib/speech'

export default function Home({ stars, onPick, onParent }: {
  stars: number
  onPick: (s: Subject) => void
  onParent: () => void
}) {
  return (
    <div className="screen center">
      <ParentButton onEnter={onParent} />
      <div className="stars">⭐ {stars}</div>
      <Fairy pose="welcome" size={300} onClick={() => speak([ko('안녕! 오늘은 무엇을 공부할까?')])} />
      <h1 className="title">✨ 반짝 한글 ABC ✨</h1>
      <div className="subject-btns">
        <button
          className="big-btn ko"
          onClick={() => {
            speak([ko('한글 공부')])
            onPick('ko')
          }}
        >
          <span className="glyph">가</span>한글
        </button>
        <button
          className="big-btn en"
          onClick={() => {
            speak([en('English')])
            onPick('en')
          }}
        >
          <span className="glyph en-font">ABC</span>영어
        </button>
      </div>
    </div>
  )
}
