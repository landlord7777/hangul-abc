// 더빙 대본에 넣을 모든 문구를 언어별로 겹치지 않게 모은다 (앱이 읽는 글자와 똑같아야 짝이 맞는다)
import { EN_PHRASES } from './en'
import { KO_PHRASES } from './ko'
import { LINES, MAX_STARS, PRAISE, starLine } from './lines'
import { EN_SENTENCES, EN_WORDS, KO_SENTENCES, KO_TEENIEPING, KO_WORDS } from './trace'
import type { Lang, Say } from './types'

export function scriptPhrases(): Record<Lang, string[]> {
  const says: Say[] = [
    ...Object.values(LINES).flat(),
    ...PRAISE,
    ...Array.from({ length: MAX_STARS }, (_, k) => starLine(k + 1)).flat(),
  ]
  const out: Record<Lang, string[]> = { ko: [], en: [] }
  const add = (lang: Lang, text: string) => {
    if (!out[lang].includes(text)) out[lang].push(text)
  }
  for (const s of says) add(s.lang, s.text)
  for (const t of KO_PHRASES) add('ko', t)
  for (const [t] of [...KO_WORDS, ...KO_SENTENCES, ...KO_TEENIEPING]) add('ko', t)
  for (const t of EN_PHRASES) add('en', t)
  for (const [t] of [...EN_WORDS, ...EN_SENTENCES]) add('en', t)
  return out
}
