// 세 가지 활동 화면이 함께 쓰는 props 타입과 칭찬 문구
import { PRAISE } from '../content/lines'
import type { ActivityId, Level, Question, Subject } from '../content/types'
import { pick } from '../lib/random'

export type LessonProps = {
  subject: Subject
  level: Level
  act: ActivityId
  onExit: () => void
  onFinish: (correct: number, total: number) => void
  onAnswer?: (q: Question, firstTry: boolean) => void // 보기 고르는 문제만 알린다 (틀린 문제 다시 하기)
}

export const praise = () => pick(PRAISE)
export const fontClass = (subject: Subject) => (subject === 'en' ? 'en-font' : '')
export const NEXT_DELAY = 1500
