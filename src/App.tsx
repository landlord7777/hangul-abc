// 앱 최상위 — 화면 전환, 하루 사용시간 측정, 진도 저장을 맡는다
import { useEffect, useState } from 'react'
import CheckScreen from './check/CheckScreen'
import { LEVELS } from './content'
import { TRACE } from './content/trace'
import type { ActivityId, Subject } from './content/types'
import { EMPTY_PROGRESS, actKey, record, type Progress } from './lib/progress'
import { load, save } from './lib/storage'
import { EMPTY_USAGE, addBonus, addSeconds, remainingSeconds, type Usage } from './lib/usage'
import BuildLesson from './screens/BuildLesson'
import CardLesson from './screens/CardLesson'
import Home from './screens/Home'
import Parent from './screens/Parent'
import QuizLesson from './screens/QuizLesson'
import Result from './screens/Result'
import SubjectScreen from './screens/SubjectScreen'
import TimeUp from './screens/TimeUp'
import TraceLesson from './screens/TraceLesson'

type Lesson = { subject: Subject; level: number; act: ActivityId; run: number }
type Screen =
  | { name: 'home' }
  | { name: 'subject'; subject: Subject }
  | ({ name: 'lesson' } & Lesson)
  | ({ name: 'result'; stars: number } & Lesson)
  | { name: 'parent' }
  | { name: 'check' }

const LIMIT_KEY = 'settings.limitMin'
const DEFAULT_LIMIT = 20
const LESSONS = { A1: CardLesson, A2: QuizLesson, A3: BuildLesson }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [progress, setProgress] = useState<Progress>(() => load('progress', EMPTY_PROGRESS))
  const [usage, setUsage] = useState<Usage>(() => load('usage', EMPTY_USAGE))
  const [limitMin, setLimitMin] = useState(() => load(LIMIT_KEY, DEFAULT_LIMIT))

  useEffect(() => {
    void navigator.storage?.persist?.()
  }, [])

  // 앱이 화면에 보이고 부모 화면이 아닐 때만 1초씩 센다.
  const counting = screen.name !== 'parent' && screen.name !== 'check'
  useEffect(() => {
    if (!counting) return
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      setUsage((u) => {
        const n = addSeconds(u, new Date(), 1)
        save('usage', n)
        return n
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [counting])

  const updateUsage = (n: Usage) => {
    setUsage(n)
    save('usage', n)
  }

  const startLesson = (subject: Subject, level: number, act: ActivityId) =>
    setScreen({ name: 'lesson', subject, level, act, run: Date.now() })

  const finish = (l: Lesson, correct: number, total: number) => {
    const stars = l.act === 'A1' ? 1 : correct
    const next = record(progress, actKey(l.subject, l.level, l.act), correct / total, stars)
    setProgress(next)
    save('progress', next)
    setScreen({ ...l, name: 'result', stars })
  }

  if (screen.name === 'check') return <CheckScreen onBack={() => setScreen({ name: 'parent' })} />
  if (screen.name === 'parent')
    return (
      <Parent
        limitMin={limitMin}
        usage={usage}
        onLimit={(m) => {
          setLimitMin(m)
          save(LIMIT_KEY, m)
        }}
        onBonus={(m) => updateUsage(addBonus(usage, new Date(), m))}
        onCheck={() => setScreen({ name: 'check' })}
        onClose={() => setScreen({ name: 'home' })}
      />
    )

  // 시간이 다 돼도 하던 학습과 결과 화면은 마저 보여주고, 그다음 화면부터 막는다.
  const timeUp = remainingSeconds(usage, new Date(), limitMin) <= 0
  if (timeUp && screen.name !== 'lesson' && screen.name !== 'result')
    return <TimeUp onParent={() => setScreen({ name: 'parent' })} />

  switch (screen.name) {
    case 'home':
      return (
        <Home
          stars={progress.stars}
          onPick={(subject) => setScreen({ name: 'subject', subject })}
          onParent={() => setScreen({ name: 'parent' })}
        />
      )
    case 'subject':
      return (
        <SubjectScreen
          subject={screen.subject}
          progress={progress}
          onBack={() => setScreen({ name: 'home' })}
          onStart={(level, act) => startLesson(screen.subject, level, act)}
        />
      )
    case 'lesson': {
      const onExit = () => setScreen({ name: 'subject', subject: screen.subject })
      const onFinish = (c: number, t: number) => finish(screen, c, t)
      // 따라 쓰기는 레벨 대신 낱말(1) / 문장(2) 묶음 번호를 쓴다.
      if (screen.act === 'A5') {
        const set = TRACE[screen.subject].find((s) => s.no === screen.level)!
        return <TraceLesson key={screen.run} subject={screen.subject} set={set} onExit={onExit} onFinish={onFinish} />
      }
      const Activity = LESSONS[screen.act]
      const level = LEVELS[screen.subject].find((lv) => lv.no === screen.level)!
      return (
        <Activity key={screen.run} subject={screen.subject} level={level} onExit={onExit} onFinish={onFinish} />
      )
    }
    case 'result':
      return (
        <Result
          stars={screen.stars}
          onAgain={() => startLesson(screen.subject, screen.level, screen.act)}
          onBack={() => setScreen({ name: 'subject', subject: screen.subject })}
        />
      )
  }
}
