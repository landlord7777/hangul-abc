// 앱 최상위 — 화면 전환, 하루 사용시간 측정, 진도·틀린 문제·스티커 저장을 맡는다
import { useEffect, useState } from 'react'
import CheckScreen from './check/CheckScreen'
import { LEVELS } from './content'
import { TRACE } from './content/trace'
import { LINES } from './content/lines'
import type { ActivityId, Question, Subject } from './content/types'
import { EMPTY_PROGRESS, actKey, record, type Progress } from './lib/progress'
import { EMPTY_REVIEW, mark, reviewQuestions, type Review } from './lib/review'
import { waiting } from './lib/stickers'
import { load, save } from './lib/storage'
import { EMPTY_USAGE, addBonus, addSeconds, remainingSeconds, type Usage } from './lib/usage'
import BuildLesson from './screens/BuildLesson'
import CardLesson from './screens/CardLesson'
import Home from './screens/Home'
import Parent from './screens/Parent'
import QuizLesson, { Quiz } from './screens/QuizLesson'
import Result from './screens/Result'
import StickerBook from './screens/StickerBook'
import SubjectScreen from './screens/SubjectScreen'
import TimeUp from './screens/TimeUp'
import TraceLesson from './screens/TraceLesson'

type Lesson = { subject: Subject; level: number; act: ActivityId; run: number }
type Screen =
  | { name: 'home' }
  | { name: 'subject'; subject: Subject }
  | ({ name: 'lesson' } & Lesson)
  | { name: 'review'; subject: Subject; run: number; qs: Question[] }
  | { name: 'result'; subject: Subject; stars: number; lesson?: Lesson } // lesson이 없으면 틀린 문제 다시 하기
  | { name: 'stickers' }
  | { name: 'parent' }
  | { name: 'check' }

const LIMIT_KEY = 'settings.limitMin'
const DEFAULT_LIMIT = 20
const LESSONS = { A1: CardLesson, A2: QuizLesson, A3: BuildLesson, A7: QuizLesson, A8: QuizLesson, A9: QuizLesson }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [progress, setProgress] = useState<Progress>(() => load('progress', EMPTY_PROGRESS))
  const [usage, setUsage] = useState<Usage>(() => load('usage', EMPTY_USAGE))
  const [limitMin, setLimitMin] = useState(() => load(LIMIT_KEY, DEFAULT_LIMIT))
  const [review, setReview] = useState<Review>(() => load('review', EMPTY_REVIEW))
  const [placed, setPlaced] = useState(() => load('stickers.placed', 0)) // 붙인 스티커 수

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
    setScreen({ name: 'result', subject: l.subject, stars, lesson: l })
  }

  // 틀린 문제가 남아 있으면 다시 하기를, 없으면 과목 화면을 연다.
  const startReview = (subject: Subject) =>
    setScreen(
      review[subject].length
        ? { name: 'review', subject, run: Date.now(), qs: reviewQuestions(review[subject]) }
        : { name: 'subject', subject },
    )

  // 다시 하기의 별은 모으지만 활동별 최고 기록에는 넣지 않는다.
  const finishReview = (subject: Subject, correct: number) => {
    const next = { ...progress, stars: progress.stars + correct }
    setProgress(next)
    save('progress', next)
    setScreen({ name: 'result', subject, stars: correct })
  }

  const answered = (subject: Subject) => (q: Question, firstTry: boolean) =>
    setReview((r) => {
      const n = mark(r, subject, q, firstTry)
      save('review', n)
      return n
    })

  const gifts = waiting(progress.stars, placed)

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
  if (timeUp && screen.name !== 'lesson' && screen.name !== 'review' && screen.name !== 'result')
    return <TimeUp onParent={() => setScreen({ name: 'parent' })} />

  switch (screen.name) {
    case 'home':
      return (
        <Home
          stars={progress.stars}
          gifts={gifts}
          onPick={(subject) => setScreen({ name: 'subject', subject })}
          onStickers={() => setScreen({ name: 'stickers' })}
          onParent={() => setScreen({ name: 'parent' })}
        />
      )
    case 'subject':
      return (
        <SubjectScreen
          subject={screen.subject}
          progress={progress}
          reviewCount={review[screen.subject].length}
          onBack={() => setScreen({ name: 'home' })}
          onStart={(level, act) => startLesson(screen.subject, level, act)}
          onReview={() => startReview(screen.subject)}
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
        <Activity
          key={screen.run}
          subject={screen.subject}
          level={level}
          act={screen.act}
          onExit={onExit}
          onFinish={onFinish}
          onAnswer={answered(screen.subject)}
        />
      )
    }
    case 'review':
      return (
        <Quiz
          key={screen.run}
          subject={screen.subject}
          qs={screen.qs}
          intro={LINES.reviewIntro}
          onExit={() => setScreen({ name: 'subject', subject: screen.subject })}
          onFinish={(c) => finishReview(screen.subject, c)}
          onAnswer={answered(screen.subject)}
        />
      )
    case 'stickers':
      return (
        <StickerBook
          stars={progress.stars}
          placed={placed}
          onPlace={() => {
            setPlaced(placed + 1)
            save('stickers.placed', placed + 1)
          }}
          onBack={() => setScreen({ name: 'home' })}
        />
      )
    case 'result':
      return (
        <Result
          stars={screen.stars}
          gifts={gifts}
          onAgain={() => {
            const l = screen.lesson
            if (l) startLesson(l.subject, l.level, l.act)
            else startReview(screen.subject)
          }}
          onBack={() => setScreen({ name: 'subject', subject: screen.subject })}
          onStickers={() => setScreen({ name: 'stickers' })}
        />
      )
  }
}
