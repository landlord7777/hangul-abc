// 학습 결과 화면 — 받은 별을 보여주고 칭찬한다
import { useEffect } from 'react'
import Fairy from '../components/Fairy'
import { ko } from '../content/types'
import { speak } from '../lib/speech'

// 숫자를 고유어로 읽혀야 "세 개"처럼 자연스럽다.
const COUNT = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열']

export default function Result({ stars, onAgain, onBack }: { stars: number; onAgain: () => void; onBack: () => void }) {
  const line = stars > 0 ? `잘했어! 별을 ${COUNT[stars] ?? stars} 개 받았어.` : '끝까지 해냈어! 다음에는 별을 받을 수 있어.'
  useEffect(() => speak([ko(line)]), [line])

  return (
    <div className="screen center">
      <Fairy pose="cheer" size={320} onClick={() => speak([ko(line)])} />
      <div className="result-stars">{stars > 0 ? '⭐'.repeat(stars) : '💖'}</div>
      <div className="row-btns">
        <button onClick={onAgain}>🔁 다시 하기</button>
        <button onClick={onBack}>⬅️ 돌아가기</button>
      </div>
    </div>
  )
}
