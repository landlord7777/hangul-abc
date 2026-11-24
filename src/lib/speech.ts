// 기기 음성(Web Speech API)으로 한국어·영어 문구를 차례로 읽어 주는 모듈
import type { Lang, Say } from '../content/types'
import { load } from './storage'

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
const LOCALE: Record<Lang, string> = { ko: 'ko-KR', en: 'en-US' }

export const voiceKey = (lang: Lang) => `settings.voice.${lang}`
export const RATE_KEY = 'settings.rate'
export const DEFAULT_RATE = 0.85

export function voicesFor(lang: Lang) {
  if (!supported) return []
  return speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang))
}

/** 부모가 고른 음성 → 고음질(향상됨·프리미엄) → 기본 지역 음성 순으로 고른다. */
export function chooseVoice(lang: Lang) {
  const list = voicesFor(lang)
  const saved = load<string>(voiceKey(lang), '')
  const local = list.filter((v) => v.lang.replace('_', '-') === LOCALE[lang])
  return (
    list.find((v) => v.name === saved) ??
    local.find((v) => /enhanced|premium|향상|고품질/i.test(v.name)) ??
    local[0] ??
    list[0]
  )
}

/** 앞서 읽던 것을 멈추고 문구들을 차례로 읽는다. */
export function speak(parts: Say[]) {
  if (!supported) return
  speechSynthesis.cancel()
  const rate = load<number>(RATE_KEY, DEFAULT_RATE)
  for (const p of parts) {
    const u = new SpeechSynthesisUtterance(p.text)
    u.lang = LOCALE[p.lang]
    u.rate = rate
    const v = chooseVoice(p.lang)
    if (v) u.voice = v
    speechSynthesis.speak(u)
  }
}
