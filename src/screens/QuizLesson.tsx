// 활동 A2 — 소리를 듣고 보기 셋 중에서 맞는 글자를 고른다
import { useEffect, useRef, useState } from 'react'
import Fairy from '../components/Fairy'
import LessonBar from '../components/LessonBar'
import { ko } from '../content/types'
import { speak } from '../lib/speech'
import { NEXT_DELAY, fontClass, praise, type LessonProps } from './lesson'

export default function QuizLesson({ subject, level, onExit, onFinish }: LessonProps) {
  const [qs] = useState(level.quiz)
  const [i, setI] = useState(0)
  const [state, setState] = useState<'ask' | 'wrong' | 'right'>('ask')
  const [wrong, setWrong] = useState<string[]>([])
  const correct = useRef(0)
  const timer = useRef<number | undefined>(undefined)
  const q = qs[i]

  useEffect(() => {
    speak(i === 0 ? [ko('잘 듣고 맞는 것을 골라 봐.'), ...q.say] : q.say)
  }, [i, q])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const choose = (opt: string) => {
    if (state === 'right') return
    if (opt !== q.answer) {
      // 틀리면 정답을 반짝이고 다시 들려준다. 정답을 눌러야 넘어간다.
      setState('wrong')
      setWrong((w) => [...w, opt])
      speak([ko('다시 해볼까?'), ...q.say])
      return
    }
    if (state === 'ask') correct.current++
    setState('right')
    speak([ko(praise())])
    timer.current = window.setTimeout(() => {
      if (i + 1 < qs.length) {
        setI(i + 1)
        setState('ask')
        setWrong([])
      } else onFinish(correct.current, qs.length)
    }, NEXT_DELAY)
  }

  const font = fontClass(subject)
  const long = q.answer.length > 1

  return (
    <div className="screen">
      <LessonBar step={i} total={qs.length} onExit={onExit} onReplay={() => speak(q.say)} />
      <div className="stage">
        <div className="prompt-row">
          <Fairy pose={state === 'wrong' ? 'think' : state === 'right' ? 'cheer' : 'fight'} size={190} />
          <button className={`prompt ${font}`} onClick={() => speak(q.say)}>
            {state === 'right' && q.reveal ? q.reveal : (q.show ?? '🔊')}
          </button>
        </div>
        <div className="options">
          {q.options.map((opt) => {
            const cls =
              opt === q.answer && state === 'right'
                ? ' right'
                : opt === q.answer && state === 'wrong'
                  ? ' hint'
                  : wrong.includes(opt)
                    ? ' dim'
                    : ''
            return (
              <button key={opt} className={`opt ${font}${long ? ' long' : ''}${cls}`} onClick={() => choose(opt)}>
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
