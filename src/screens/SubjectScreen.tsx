// 과목 화면 — 레벨과 활동, 틀린 문제 다시 하기를 고르고 최고 기록을 보여준다 (모든 레벨이 늘 열려 있다)
import { LEVELS } from '../content'
import { TRACE } from '../content/trace'
import type { ActivityId, Subject } from '../content/types'
import { PASS, actKey, type Progress } from '../lib/progress'
import { fontClass } from './lesson'

const ACTS: Record<ActivityId, { icon: string; label: string }> = {
  A1: { icon: '👀', label: '보기' },
  A2: { icon: '👂', label: '듣고 고르기' },
  A3: { icon: '🧩', label: '만들기' },
  A5: { icon: '✏️', label: '따라 쓰기' },
  A7: { icon: '📝', label: '낱말 퀴즈' },
  A8: { icon: '🔗', label: '소리 합치기' },
  A9: { icon: '🔍', label: '헷갈리는 글자' },
}

const bestMark = (act: ActivityId, best: number) => (act === 'A1' ? '✔️' : best >= PASS ? '⭐' : `${Math.round(best * 100)}%`)

export default function SubjectScreen({ subject, progress, reviewCount, onBack, onStart, onReview }: {
  subject: Subject
  progress: Progress
  reviewCount: number // 틀린 문제 목록에 남은 수
  onBack: () => void
  onStart: (level: number, act: ActivityId) => void
  onReview: () => void
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
        {reviewCount > 0 && (
          <div className="level-card review-card">
            <div className="acts">
              <button className="act-btn" onClick={onReview}>
                <span className="act-icon">🔁</span>
                틀린 문제 다시 하기
                <span className="best">{reviewCount}개</span>
              </button>
            </div>
          </div>
        )}
        <div className="level-card trace-card">
          <div className="level-head">
            <span className="level-no">{ACTS.A5.icon}</span>
            <span className="level-title">{ACTS.A5.label}</span>
          </div>
          <div className="acts">
            {TRACE[subject].map((s) => {
              const best = progress.best[actKey(subject, s.no, 'A5')]
              return (
                <button key={s.no} className="act-btn" onClick={() => onStart(s.no, 'A5')}>
                  <span className="act-icon">{s.icon}</span>
                  {s.title}
                  {best !== undefined && <span className="best">{bestMark('A5', best)}</span>}
                </button>
              )
            })}
          </div>
        </div>
        {levels.map((lv) => {
          return (
            <div key={lv.no} className="level-card">
              <div className="level-head">
                <span className="level-no">{lv.no}</span>
                <span className={`level-icon ${fontClass(subject)}`}>{lv.icon}</span>
                <span className="level-title">{lv.title}</span>
              </div>
              <div className="acts">
                {lv.acts.map((a) => {
                  const best = progress.best[actKey(subject, lv.no, a)]
                  return (
                    <button key={a} className="act-btn" onClick={() => onStart(lv.no, a)}>
                      <span className="act-icon">{ACTS[a].icon}</span>
                      {ACTS[a].label}
                      {best !== undefined && (
                        <span className="best">{bestMark(a, best)}</span>
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
