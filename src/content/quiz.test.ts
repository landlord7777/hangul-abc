// 새 문제 활동(A7 낱말 퀴즈, A8 소리 합치기, A9 헷갈리는 글자)의 문제가 규칙에 맞는지 검사하는 테스트
import { expect, it } from 'vitest'
import { LEVELS } from '.'
import { decompose } from '../lib/hangul'
import { CVC } from './en'
import { WORDS } from './ko'
import { QUIZ_COUNT } from './types'

const RUNS = 200
const level = (s: 'ko' | 'en', no: number) => LEVELS[s].find((l) => l.no === no)!

it('활동 목록에 있는 A7~A9는 문제 생성기가 있다', () => {
  for (const levels of Object.values(LEVELS))
    for (const lv of levels)
      for (const a of lv.acts) if (a === 'A7' || a === 'A8' || a === 'A9') expect(lv.extra?.[a], `${lv.no} ${a}`).toBeTypeOf('function')
})

it('모든 문제는 서로 다른 보기 셋 중에 정답이 하나 있다', () => {
  for (let r = 0; r < RUNS; r++)
    for (const levels of Object.values(LEVELS))
      for (const lv of levels)
        for (const make of Object.values(lv.extra ?? {})) {
          const qs = make()
          expect(qs).toHaveLength(QUIZ_COUNT)
          for (const q of qs) {
            expect(new Set(q.options).size, JSON.stringify(q)).toBe(3)
            expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
          }
        }
})

it('낱말 퀴즈 빈칸은 정답을 넣으면 원래 낱말이 되고, 다른 보기를 넣으면 목록의 낱말이 되지 않는다', () => {
  const lists = { ko: WORDS.map(([w]) => w), en: CVC.map(([w]) => w) }
  for (const s of ['ko', 'en'] as const)
    for (let r = 0; r < RUNS; r++)
      for (const q of level(s, 3).extra!.A7!()) {
        const word = q.after![0].text
        expect(lists[s]).toContain(word)
        if (!q.text) {
          expect(q.answer).toBe(word)
          continue
        }
        expect(q.text.replace('□', q.answer)).toBe(word)
        for (const o of q.options) if (o !== q.answer) expect(lists[s]).not.toContain(q.text.replace('□', o))
      }
})

it('한글 헷갈리는 글자는 정답과 자음이나 모음 하나만 다르다 (레벨 2)', () => {
  for (let r = 0; r < RUNS; r++)
    for (const q of level('ko', 2).extra!.A9!()) {
      const [c, v] = decompose(q.answer)!
      for (const o of q.options) {
        if (o === q.answer) continue
        const [oc, ov] = decompose(o)!
        expect((oc === c ? 0 : 1) + (ov === v ? 0 : 1), `${q.answer} ${o}`).toBe(1)
      }
    }
})

it('소리 합치기는 조각 소리를 읽고, 맞힌 뒤 정답을 읽는다', () => {
  for (const q of level('ko', 2).extra!.A8!()) {
    expect(q.say).toHaveLength(2)
    expect(q.after![0].text).toBe(q.answer)
  }
  for (const q of level('en', 3).extra!.A8!()) {
    expect(q.say).toHaveLength(3)
    expect(q.after![0].text).toBe(q.answer)
  }
})
