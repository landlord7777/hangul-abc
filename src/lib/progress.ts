// 별 수와 활동별 최고 정답률을 기록하는 함수 (레벨 잠금은 없앴다, 2026-11-26)
import type { ActivityId, Subject } from '../content/types'

export type Progress = { stars: number; best: Record<string, number> }

export const PASS = 0.8
export const EMPTY_PROGRESS: Progress = { stars: 0, best: {} }

export const actKey = (subject: Subject, level: number, act: ActivityId) => `${subject}-${level}-${act}`

export function record(p: Progress, key: string, accuracy: number, stars: number): Progress {
  return {
    stars: p.stars + stars,
    best: { ...p.best, [key]: Math.max(p.best[key] ?? 0, accuracy) },
  }
}
