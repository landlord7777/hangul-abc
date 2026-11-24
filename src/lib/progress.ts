// 별 수와 활동별 최고 정답률을 기록하고 레벨 해금을 판단하는 함수
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

/** 레벨 1은 늘 열려 있고, 그 위 레벨은 앞 레벨의 퀴즈 활동(A2, A3)을 모두 80% 이상 했을 때 열린다. */
export function isUnlocked(p: Progress, subject: Subject, level: number, prevActs: ActivityId[]) {
  if (level <= 1) return true
  return prevActs
    .filter((a) => a !== 'A1')
    .every((a) => (p.best[actKey(subject, level - 1, a)] ?? 0) >= PASS)
}
