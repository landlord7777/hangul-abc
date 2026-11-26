// 학습 결과 화면 — 받은 별을 보여주고 칭찬한다. 붙일 스티커가 있으면 알려 준다
import { useEffect } from 'react'
import Fairy from '../components/Fairy'
import { LINES, starLine } from '../content/lines'
import { speak } from '../lib/speech'

export default function Result({ stars, gifts, onAgain, onBack, onStickers }: {
  stars: number
  gifts: number // 받았지만 아직 안 붙인 스티커 수
  onAgain: () => void
  onBack: () => void
  onStickers: () => void
}) {
  const say = () => speak([...starLine(stars), ...(gifts > 0 ? LINES.stickerNew : [])])
  useEffect(say, [stars, gifts])

  return (
    <div className="screen center">
      <Fairy pose="cheer" size={320} onClick={say} />
      <div className="result-stars">{stars > 0 ? '⭐'.repeat(stars) : '💖'}</div>
      <div className="row-btns">
        <button onClick={onAgain}>🔁 다시 하기</button>
        <button onClick={onBack}>⬅️ 돌아가기</button>
      </div>
      {gifts > 0 && (
        <button className="sticker-btn" onClick={onStickers}>
          🎁 새 스티커 붙이러 가기<span className="badge">{gifts}</span>
        </button>
      )}
    </div>
  )
}
