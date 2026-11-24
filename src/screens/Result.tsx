// 학습 결과 화면 — 받은 별을 보여주고 칭찬한다
import { useEffect } from 'react'
import Fairy from '../components/Fairy'
import { starLine } from '../content/lines'
import { speak } from '../lib/speech'

export default function Result({ stars, onAgain, onBack }: { stars: number; onAgain: () => void; onBack: () => void }) {
  useEffect(() => speak(starLine(stars)), [stars])

  return (
    <div className="screen center">
      <Fairy pose="cheer" size={320} onClick={() => speak(starLine(stars))} />
      <div className="result-stars">{stars > 0 ? '⭐'.repeat(stars) : '💖'}</div>
      <div className="row-btns">
        <button onClick={onAgain}>🔁 다시 하기</button>
        <button onClick={onBack}>⬅️ 돌아가기</button>
      </div>
    </div>
  )
}
