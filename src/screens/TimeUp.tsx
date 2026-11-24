// 하루 사용시간이 다 됐을 때 보여주는 "오늘 공부 끝" 화면
import { LINES } from '../content/lines'
import { useEffect } from 'react'
import Fairy from '../components/Fairy'
import ParentButton from '../components/ParentButton'
import { speak } from '../lib/speech'

const LINE = LINES.timeUp

export default function TimeUp({ onParent }: { onParent: () => void }) {
  useEffect(() => speak(LINE), [])
  return (
    <div className="screen center">
      <ParentButton onEnter={onParent} />
      <Fairy pose="wave" size={360} onClick={() => speak(LINE)} />
      <h1 className="title">오늘 공부 끝!</h1>
      <p className="big-text">내일 또 만나요 👋</p>
    </div>
  )
}
