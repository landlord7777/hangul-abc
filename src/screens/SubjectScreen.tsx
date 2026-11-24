// 과목 화면 — 레벨과 활동을 고르고, 잠긴 레벨과 최고 기록을 보여준다
import { LEVELS } from '../content'
import { ko, type ActivityId, type Subject } from '../content/types'
import { PASS, actKey, isUnlocked, type Progress } from '../lib/progress'
import { speak } from '../lib/speech'
import { fontClass } from './lesson'

const ACTS: Record<ActivityId, { icon: string; label: string }> = {
  A1: { icon: '👀', label: '보기' },
  A2: { icon: '👂', label: '듣고 고르기' },
  A3: { icon: '🧩', label: '만들기' },
}

export default function SubjectScreen({ subject, progress, onBack, onStart }: {
  subject: Subject
  progress: Progress
  onBack: () => void
  onStart: (level: number, act: ActivityId) => void
}) {
  const levels = LEVELS[subject]
  return (
    <div className="screen">
      <header className="bar">
        <button className="icon-btn" aria-label="처음으로" onClick={onBack}>
          ⬅️
        </button>
        <h2>{subject === 'ko' ? '한글' : '영어'}</h2>
        <div className="stars inline">⭐ {progress.stars}</div>
      </header>
      <div className="levels">
        {levels.map((lv, i) => {
          const open = isUnlocked(progress, subject, lv.no, levels[i - 1]?.acts ?? [])
          return (
            <div
              key={lv.no}
              className={`level-card${open ? '' : ' locked'}`}
              onClick={open ? undefined : () => speak([ko('앞 레벨을 먼저 해 보자!')])}
            >
              <div className="level-head">
                <span className="level-no">{open ? lv.no : '🔒'}</span>
                <span className={`level-icon ${fontClass(subject)}`}>{lv.icon}</span>
                <span className="level-title">{lv.title}</span>
              </div>
              <div className="acts">
                {lv.acts.map((a) => {
                  const best = progress.best[actKey(subject, lv.no, a)]
                  return (
                    <button key={a} className="act-btn" disabled={!open} onClick={() => onStart(lv.no, a)}>
                      <span className="act-icon">{ACTS[a].icon}</span>
                      {ACTS[a].label}
                      {best !== undefined && (
                        <span className="best">{a === 'A1' ? '✔️' : best >= PASS ? '⭐' : `${Math.round(best * 100)}%`}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
