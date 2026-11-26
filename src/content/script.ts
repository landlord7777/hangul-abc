// 더빙 대본에 넣을 모든 문구를 언어별로 겹치지 않게 모은다 (앱이 읽는 글자와 똑같아야 짝이 맞는다)
import { EN_PHRASES } from './en'
import { KO_PHRASES } from './ko'
import { LINES, MAX_STARS, PRAISE, starLine } from './lines'
import { EN_SENTENCES, EN_WORDS, KO_SENTENCES, KO_TEENIEPING, KO_WORDS } from './trace'
import type { Lang, Say } from './types'

// Vrew에서 속도를 다르게 더빙하므로 나눈다.
// short: 자모·글자·낱말·이름·알파벳·글자 소리 / long: 요정 대사와 따라 쓰기 문장
export type Kind = 'short' | 'long'

export function scriptPhrases(): Record<Lang, Record<Kind, string[]>> {
  const says: Say[] = [
    ...Object.values(LINES).flat(),
    ...PRAISE,
    ...Array.from({ length: MAX_STARS }, (_, k) => starLine(k + 1)).flat(),
  ]
  const out: Record<Lang, Record<Kind, string[]>> = { ko: { short: [], long: [] }, en: { short: [], long: [] } }
  const add = (lang: Lang, kind: Kind, text: string) => {
    if (!out[lang].short.includes(text) && !out[lang].long.includes(text)) out[lang][kind].push(text)
  }
  for (const s of says) add(s.lang, 'long', s.text)
  for (const [t] of KO_SENTENCES) add('ko', 'long', t)
  for (const [t] of EN_SENTENCES) add('en', 'long', t)
  for (const t of KO_PHRASES) add('ko', 'short', t)
  for (const [t] of [...KO_WORDS, ...KO_TEENIEPING]) add('ko', 'short', t)
  for (const t of EN_PHRASES) add('en', 'short', t)
  for (const [t] of EN_WORDS) add('en', 'short', t)
  return out
}
