// 활동 A1 — 카드를 넘기며 글자와 그림을 보고 소리를 듣는다
import { useCallback, useEffect, useState } from 'react'
import Fairy from '../components/Fairy'
import LessonBar from '../components/LessonBar'
import { speak } from '../lib/speech'
import { fontClass, type LessonProps } from './lesson'

export default function CardLesson({ subject, level, onExit, onFinish }: LessonProps) {
  const [cards] = useState(level.cards)
  const [i, setI] = useState(0)
  // 지금 읽는 문구 번호. 글자 하나씩 읽는 카드(spell)와 소리 합치기 카드(blend)는 이 번호로 글자를 반짝인다.
  const [lit, setLit] = useState(-1)
  const card = cards[i]

  const play = useCallback(() => {
    setLit(-1)
    speak(card.say, setLit)
  }, [card])

  useEffect(play, [play])

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
              : <span className={card.blend && lit === 2 ? 'lit' : ''}>{card.big}</span>}
          </div>
          {card.blend ? (
            <div className="card-sub">
              <span className={lit === 0 ? 'lit' : ''}>{card.blend[0]}</span> +{' '}
              <span className={lit === 1 ? 'lit' : ''}>{card.blend[1]}</span>
            </div>
          ) : (
            card.sub && <div className="card-sub">{card.sub}</div>
          )}
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
