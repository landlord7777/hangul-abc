// 보기 셋 중에서 맞는 것을 고르는 문제 화면 — A2 듣고 고르기, A7 낱말 퀴즈, A8 소리 합치기, A9 헷갈리는 글자
import { LINES } from '../content/lines'
import { useEffect, useRef, useState } from 'react'
import Fairy from '../components/Fairy'
import LessonBar from '../components/LessonBar'
import { speak } from '../lib/speech'
import type { Level, QuizAct, Say } from '../content/types'
import { NEXT_DELAY, fontClass, praise, type LessonProps } from './lesson'

// 첫 문제 앞에 읽는 안내 말. 낱말 퀴즈는 문제마다 종류가 달라 문제의 say에 안내 말이 들어 있다.
const INTRO: Record<QuizAct, Say[]> = { A2: LINES.quizIntro, A7: [], A8: LINES.blendIntro, A9: LINES.lookAlikeIntro }

const questions = (level: Level, act: QuizAct) => (act === 'A2' ? level.quiz() : level.extra![act]!())

export default function QuizLesson({ subject, level, act, onExit, onFinish }: LessonProps) {
  const quizAct = act as QuizAct
  const [qs] = useState(() => questions(level, quizAct))
  const [i, setI] = useState(0)
  const [state, setState] = useState<'ask' | 'wrong' | 'right'>('ask')
  const [wrong, setWrong] = useState<string[]>([])
  const correct = useRef(0)
  const timer = useRef<number | undefined>(undefined)
  const q = qs[i]

  useEffect(() => {
    speak(i === 0 ? [...INTRO[quizAct], ...q.say] : q.say)
  }, [i, q, quizAct])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const choose = (opt: string) => {
    if (state === 'right') return
    if (opt !== q.answer) {
      // 틀리면 정답을 반짝이고 다시 들려준다. 정답을 눌러야 넘어간다.
      setState('wrong')
      setWrong((w) => [...w, opt])
      speak([...LINES.retry, ...q.say])
      return
    }
    if (state === 'ask') correct.current++
    setState('right')
    speak([praise(), ...(q.after ?? [])])
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
          <button className={`prompt ${font}${q.text ? ' with-text' : ''}`} onClick={() => speak(q.say)}>
            {state === 'right' && q.reveal ? q.reveal : (q.show ?? '🔊')}
            {q.text && (
              <span className="prompt-text">
                {[...(state === 'right' ? q.text.replace('□', q.answer) : q.text)].map((ch, k) =>
                  ch === '□' ? (
                    <span key={k} className="blank">
                      {' '}
                    </span>
                  ) : (
                    ch
                  ),
                )}
              </span>
            )}
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
