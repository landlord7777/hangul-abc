// 따라 쓰기 낱말·문장 데이터가 규칙에 맞는지 검사하는 테스트
import { expect, it } from 'vitest'
import { EN_SENTENCES, EN_WORDS, KO_SENTENCES, KO_WORDS, TRACE } from './trace'
import { TRACE_COUNT } from './types'

it('글이 겹치지 않고 한 묶음을 채울 만큼 있다', () => {
  for (const list of [KO_WORDS, KO_SENTENCES, EN_WORDS, EN_SENTENCES]) {
    expect(new Set(list.map(([t]) => t)).size).toBe(list.length)
    expect(list.length).toBeGreaterThanOrEqual(TRACE_COUNT * 2)
  }
})

it('화면에 한 줄로 들어가도록 짧다 (한글 8자, 영어 12자 이하)', () => {
  for (const [t] of [...KO_WORDS, ...KO_SENTENCES]) expect(t.length, t).toBeLessThanOrEqual(8)
  for (const [t] of [...EN_WORDS, ...EN_SENTENCES]) expect(t.length, t).toBeLessThanOrEqual(12)
})

it('한 번에 서로 다른 5개를 내고, 읽어 줄 문구가 글과 같다', () => {
  for (const sets of Object.values(TRACE)) {
    for (const s of sets) {
      const items = s.items()
      expect(items).toHaveLength(TRACE_COUNT)
      expect(new Set(items.map((i) => i.text)).size).toBe(TRACE_COUNT)
      for (const i of items) expect(i.say[0].text).toBe(i.text)
    }
  }
})
