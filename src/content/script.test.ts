// 더빙 대본이 앱이 읽는 모든 문구를 빠짐없이 담고, 한 줄에 한 문장인지 검사하는 테스트
import { expect, it } from 'vitest'
import { LEVELS } from '.'
import { LINES, MAX_STARS, PRAISE, starLine } from './lines'
import { scriptPhrases } from './script'
import { TRACE } from './trace'
import type { Say } from './types'

const RUNS = 300 // 문제는 무작위로 뽑히므로 여러 번 만들어 모든 문구가 나오게 한다

function everySay(): Say[] {
  const says: Say[] = [...Object.values(LINES).flat(), ...PRAISE]
  for (let n = 0; n <= MAX_STARS; n++) says.push(...starLine(n))
  for (let r = 0; r < RUNS; r++) {
    for (const levels of Object.values(LEVELS))
      for (const lv of levels) {
        for (const c of lv.cards()) says.push(...c.say)
        const quizzes = [lv.quiz, ...Object.values(lv.extra ?? {})]
        for (const make of quizzes) for (const q of make()) says.push(...q.say, ...(q.after ?? []))
        for (const t of lv.build?.() ?? []) says.push(...t.say)
      }
    for (const sets of Object.values(TRACE)) for (const s of sets) for (const i of s.items()) says.push(...i.say)
  }
  return says
}

it('앱이 읽는 모든 문구가 대본에 있다', () => {
  const script = scriptPhrases()
  const has = (s: Say) => script[s.lang].short.includes(s.text) || script[s.lang].long.includes(s.text)
  const missing = new Set(everySay().filter((s) => !has(s)).map((s) => `${s.lang}:${s.text}`))
  expect([...missing]).toEqual([])
})

it('대본은 한 줄에 한 문장이다 (줄 안에서 쉬면 자르기가 틀어진다)', () => {
  for (const kinds of Object.values(scriptPhrases()))
    for (const line of [...kinds.short, ...kinds.long]) {
      expect(line, line).not.toMatch(/[.!?,]\s*\S/)
      expect(line.trim(), line).toBe(line)
    }
})
