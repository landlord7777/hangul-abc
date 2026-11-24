// 학습 화면 위쪽 막대 — 나가기, 진행 점, 다시 듣기
export default function LessonBar({ step, total, onExit, onReplay }: {
  step: number
  total: number
  onExit: () => void
  onReplay: () => void
}) {
  return (
    <header className="bar">
      <button className="icon-btn" aria-label="나가기" onClick={onExit}>
        ✖️
      </button>
      <div className="dots">
        {Array.from({ length: total }, (_, k) => (
          <span key={k} className={k < step ? 'dot done' : k === step ? 'dot now' : 'dot'} />
        ))}
      </div>
      <button className="icon-btn" aria-label="다시 듣기" onClick={onReplay}>
        🔊
      </button>
    </header>
  )
}
