// 하루 사용시간을 날짜별로 세고 남은 시간을 계산하는 함수
export type Usage = { date: string; seconds: number; bonusMin: number }

export const EMPTY_USAGE: Usage = { date: '', seconds: 0, bonusMin: 0 }

/** 기기 시간대 기준 날짜 (YYYY-MM-DD) */
export function dayKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** 날짜가 바뀌었으면 0부터 다시 시작한 기록을 돌려준다. */
export function today(u: Usage, now: Date): Usage {
  const date = dayKey(now)
  return u.date === date ? u : { date, seconds: 0, bonusMin: 0 }
}

export function addSeconds(u: Usage, now: Date, seconds: number): Usage {
  const t = today(u, now)
  return { ...t, seconds: t.seconds + seconds }
}

export function addBonus(u: Usage, now: Date, minutes: number): Usage {
  const t = today(u, now)
  return { ...t, bonusMin: t.bonusMin + minutes }
}

/** 남은 초. 제한이 0분이면 제한 없음(Infinity). */
export function remainingSeconds(u: Usage, now: Date, limitMin: number) {
  if (limitMin <= 0) return Infinity
  const t = today(u, now)
  return Math.max(0, (limitMin + t.bonusMin) * 60 - t.seconds)
}
