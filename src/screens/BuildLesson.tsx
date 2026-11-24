// 활동 A3 — 블록을 눌러 보기와 같은 글자나 낱말을 만든다
import { useEffect, useRef, useState } from 'react'
import Fairy from '../components/Fairy'
import LessonBar from '../components/LessonBar'
import { ko } from '../content/types'
import { compose } from '../lib/hangul'
import { speak } from '../lib/speech'
import { NEXT_DELAY, fontClass, praise, type LessonProps } from './lesson'

const RETRY_DELAY = 900

export default function BuildLesson({ subject, level, onExit, onFinish }: LessonProps) {
  const [tasks] = useState(() => level.build!())
  const [i, setI] = useState(0)
  const [used, setUsed] = useState<number[]>([]) // 빈칸에 들어간 블록 번호 (순서대로)
  const [state, setState] = useState<'ask' | 'wrong' | 'right'>('ask')
  const firstTry = useRef(true)
  const correct = useRef(0)
  const timer = useRef<number | undefined>(undefined)
  const t = tasks[i]
  const placed = used.map((k) => t.blocks[k])

  useEffect(() => {
    speak(i === 0 ? [ko('블록을 눌러서 똑같이 만들어 봐.'), ...t.say] : t.say)
  }, [i, t])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const tap = (k: number) => {
    if (state !== 'ask' || used.includes(k)) return
    const next = [...used, k]
    setUsed(next)
    if (next.length < t.pieces.length) return

    if (next.map((x) => t.blocks[x]).join('') === t.pieces.join('')) {
      if (firstTry.current) correct.current++
      setState('right')
      speak([ko(praise()), ...t.say])
      timer.current = window.setTimeout(() => {
        if (i + 1 < tasks.length) {
          setI(i + 1)
          setUsed([])
          setState('ask')
          firstTry.current = true
        } else onFinish(correct.current, tasks.length)
      }, NEXT_DELAY)
    } else {
      firstTry.current = false
      setState('wrong')
      speak([ko('다시 해볼까?')])
      timer.current = window.setTimeout(() => {
        setUsed([])
        setState('ask')
      }, RETRY_DELAY)
    }
  }

  const font = fontClass(subject)
  const preview = t.hangul && placed.length === 2 ? (compose(placed[0], placed[1]) ?? '?') : null

  return (
    <div className="screen">
      <LessonBar step={i} total={tasks.length} onExit={onExit} onReplay={() => speak(t.say)} />
      <div className="stage">
        <div className="prompt-row">
          <Fairy pose={state === 'wrong' ? 'think' : state === 'right' ? 'cheer' : 'fight'} size={170} />
          <button className={`prompt small ${font}`} onClick={() => speak(t.say)}>
            {t.emoji && <span className="emoji">{t.emoji}</span>}
            {t.show}
          </button>
        </div>
        <div className={`slots ${font} ${state}`}>
          {t.pieces.map((_, k) => (
            <span key={k} className={`slot${placed[k] ? ' filled' : ''}`}>
              {placed[k] ?? ''}
            </span>
          ))}
          {t.hangul && (
            <>
              <span className="equals">=</span>
              <span className="slot result">{preview ?? ''}</span>
            </>
          )}
          <button
            className="icon-btn"
            aria-label="하나 지우기"
            disabled={state !== 'ask' || used.length === 0}
            onClick={() => setUsed(used.slice(0, -1))}
          >
            ↩️
          </button>
        </div>
        <div className="blocks">
          {t.blocks.map((b, k) => (
            <button key={k} className={`block ${font}`} disabled={used.includes(k)} onClick={() => tap(k)}>
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
