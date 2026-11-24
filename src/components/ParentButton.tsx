// 2초 길게 누르기와 두 자리 덧셈으로 부모만 들어가게 하는 잠금 버튼
import { useRef, useState } from 'react'
import { shuffle } from '../lib/random'

const HOLD_MS = 2000

function makeProblem() {
  const a = 11 + Math.floor(Math.random() * 29)
  const b = 11 + Math.floor(Math.random() * 29)
  const answer = a + b
  return { a, b, answer, options: shuffle([answer, answer + 1, answer - 10, answer + 10]) }
}

export default function ParentButton({ onEnter }: { onEnter: () => void }) {
  const timer = useRef<number | undefined>(undefined)
  const [holding, setHolding] = useState(false)
  const [problem, setProblem] = useState<ReturnType<typeof makeProblem> | null>(null)

  const start = () => {
    setHolding(true)
    timer.current = window.setTimeout(() => {
      setHolding(false)
      setProblem(makeProblem())
    }, HOLD_MS)
  }
  const stop = () => {
    setHolding(false)
    window.clearTimeout(timer.current)
  }

  return (
    <>
      <button
        className={`parent-btn${holding ? ' holding' : ''}`}
        aria-label="부모 메뉴 (길게 누르기)"
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onContextMenu={(e) => e.preventDefault()}
      >
        ⚙️
      </button>
      {problem && (
        <div className="modal" onClick={() => setProblem(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <p>부모 확인</p>
            <p className="problem">
              {problem.a} + {problem.b} = ?
            </p>
            <div>
              {problem.options.map((n) => (
                <button
                  key={n}
                  className="answer-btn"
                  onClick={() => {
                    setProblem(null)
                    if (n === problem.answer) onEnter()
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
