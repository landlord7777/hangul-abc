// 활동 A1 — 카드를 넘기며 글자와 그림을 보고 소리를 듣는다
import { useCallback, useEffect, useRef, useState } from 'react'
import Fairy from '../components/Fairy'
import LessonBar from '../components/LessonBar'
import { speak } from '../lib/speech'
import { fontClass, type LessonProps } from './lesson'

const SPELL_STEP = 500

export default function CardLesson({ subject, level, onExit, onFinish }: LessonProps) {
  const [cards] = useState(level.cards)
  const [i, setI] = useState(0)
  const [lit, setLit] = useState(-1) // 반짝이는 글자 위치, 글자 수와 같으면 전체
  const timers = useRef<number[]>([])
  const card = cards[i]

  const play = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setLit(-1)
    if (!card.spell) {
      speak(card.say)
      return
    }
    const n = card.big.length
    for (let k = 0; k < n; k++) timers.current.push(window.setTimeout(() => setLit(k), k * SPELL_STEP))
    timers.current.push(
      window.setTimeout(() => {
        setLit(n)
        speak(card.say)
      }, n * SPELL_STEP),
    )
  }, [card])

  useEffect(() => {
    play()
    return () => timers.current.forEach(clearTimeout)
  }, [play])

  const next = () => (i + 1 < cards.length ? setI(i + 1) : onFinish(1, 1))
  const font = fontClass(subject)

  return (
    <div className="screen">
      <LessonBar step={i} total={cards.length} onExit={onExit} onReplay={play} />
      <div className="stage">
        <div className="card" onClick={play}>
          <div className={`card-big ${font}`}>
            {card.spell
              ? [...card.big].map((ch, k) => (
                  <span key={k} className={k === lit || lit === card.big.length ? 'lit' : ''}>
                    {ch}
                  </span>
                ))
              : card.big}
          </div>
          {card.sub && <div className="card-sub">{card.sub}</div>}
          {card.emoji && (
            <div className="card-pic">
              <span className="emoji">{card.emoji}</span>
              {card.word && (
                <span className={font}>
                  {card.mark !== undefined ? (
                    <>
                      {card.word.slice(0, card.mark)}
                      <b className="mark">{card.word[card.mark]}</b>
                      {card.word.slice(card.mark + 1)}
                    </>
                  ) : (
                    card.word
                  )}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="nav">
          <button aria-label="이전" disabled={i === 0} onClick={() => setI(i - 1)}>
            ◀
          </button>
          <Fairy pose="wave" size={140} />
          <button className="next" aria-label="다음" onClick={next}>
            ▶
          </button>
        </div>
      </div>
    </div>
  )
}
