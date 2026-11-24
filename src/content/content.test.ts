// 생성된 카드·문제·만들기 과제가 규칙에 맞는지 검사하는 테스트
import { describe, expect, it } from 'vitest'
import { decompose } from '../lib/hangul'
import { WORDS } from './ko'
import { BUILD_COUNT, CARD_COUNT, QUIZ_COUNT } from './types'
import { LEVELS } from '.'

const BASIC_VOWELS = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ']
const RUNS = 30

for (const [subject, levels] of Object.entries(LEVELS)) {
  describe(subject, () => {
    for (const lv of levels) {
      it(`레벨 ${lv.no} 카드`, () => {
        for (let r = 0; r < RUNS; r++) {
          const cards = lv.cards()
          expect(cards).toHaveLength(CARD_COUNT)
          expect(new Set(cards.map((c) => c.big)).size).toBe(CARD_COUNT)
          for (const c of cards) {
            expect(c.say.length).toBeGreaterThan(0)
            if (c.mark !== undefined) expect(c.mark).toBeGreaterThanOrEqual(0)
          }
        }
      })

      it(`레벨 ${lv.no} 듣고 고르기 — 정답이 보기에 있고 보기가 겹치지 않는다`, () => {
        for (let r = 0; r < RUNS; r++) {
          const qs = lv.quiz()
          expect(qs).toHaveLength(QUIZ_COUNT)
          expect(new Set(qs.map((q) => q.answer)).size).toBe(QUIZ_COUNT)
          for (const q of qs) {
            expect(q.options).toHaveLength(3)
            expect(new Set(q.options).size).toBe(3)
            expect(q.options).toContain(q.answer)
          }
        }
      })

      if (lv.build) {
        it(`레벨 ${lv.no} 만들기 — 블록에 정답 조각이 모두 있다`, () => {
          for (let r = 0; r < RUNS; r++) {
            const tasks = lv.build!()
            expect(tasks).toHaveLength(BUILD_COUNT)
            for (const t of tasks) {
              const rest = [...t.blocks]
              for (const p of t.pieces) {
                const k = rest.indexOf(p)
                expect(k).toBeGreaterThanOrEqual(0)
                rest.splice(k, 1)
              }
              expect(rest.length).toBeGreaterThan(0)
              expect(rest.some((b) => t.pieces.includes(b))).toBe(false)
            }
          }
        })
      }

      it(`레벨 ${lv.no}의 활동 목록이 생성기와 맞다`, () => {
        expect(lv.acts.includes('A3')).toBe(Boolean(lv.build))
      })
    }
  })
}

it('한글 레벨 3 낱말은 받침이 없고 기본 모음만 쓴다', () => {
  for (const [w] of WORDS) {
    for (const s of w) {
      const [, v, jong] = decompose(s)!
      expect(jong, `${w}의 ${s}`).toBe('')
      expect(BASIC_VOWELS, `${w}의 ${s}`).toContain(v)
    }
  }
})
