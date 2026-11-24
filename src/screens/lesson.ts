// 세 가지 활동 화면이 함께 쓰는 props 타입과 칭찬 문구
import type { Level, Subject } from '../content/types'
import { pick } from '../lib/random'

export type LessonProps = {
  subject: Subject
  level: Level
  onExit: () => void
  onFinish: (correct: number, total: number) => void
}

export const praise = () => pick(['잘했어!', '맞았어!', '최고야!', '멋져!', '딩동댕!'])
export const fontClass = (subject: Subject) => (subject === 'en' ? 'en-font' : '')
export const NEXT_DELAY = 1500
