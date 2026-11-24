// 문구를 차례로 읽어 주는 모듈 — 더빙 파일(voices.json)이 있으면 그 파일을, 없으면 기기 음성(Web Speech API)을 쓴다
import type { Lang, Say } from '../content/types'
import VOICE_FILES from '../content/voices.json'
import { load } from './storage'

const hasTts = typeof window !== 'undefined' && 'speechSynthesis' in window
const LOCALE: Record<Lang, string> = { ko: 'ko-KR', en: 'en-US' }
const FILES: Record<string, string> = VOICE_FILES

export const voiceKey = (lang: Lang) => `settings.voice.${lang}`
export const RATE_KEY = 'settings.rate'
export const DEFAULT_RATE = 0.85

export function voicesFor(lang: Lang) {
  if (!hasTts) return []
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

/** 더빙 파일이 있는 문장인지 */
export const dubbedFile = (s: Say) => FILES[`${s.lang}:${s.text}`]

// --- 더빙 파일 재생 (Web Audio) ---
// iPad Safari는 터치 없이 새 오디오를 틀지 못하므로, 터치할 때마다 오디오 장치를 깨워 둔다.
let ctx: AudioContext | null = null
const buffers = new Map<string, Promise<AudioBuffer>>()
let playing: AudioBufferSourceNode | null = null
let run = 0 // speak를 새로 부를 때마다 늘려서 이전 재생 순서를 멈춘다

function audio() {
  if (!ctx) {
    ctx = new AudioContext()
    // iPad의 무음 모드에서도 들리게 한다 (지원하는 Safari에서만).
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (session) session.type = 'playback'
  }
  return ctx
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => void audio().resume(), true)
}

function buffer(file: string) {
  let b = buffers.get(file)
  if (!b) {
    b = fetch(import.meta.env.BASE_URL + file)
      .then((r) => r.arrayBuffer())
      .then((data) => audio().decodeAudioData(data))
    b.catch(() => buffers.delete(file))
    buffers.set(file, b)
  }
  return b
}

function stop() {
  if (hasTts) speechSynthesis.cancel()
  try {
    playing?.stop()
  } catch {
    // 이미 끝난 소리
  }
  playing = null
}

/** 기기 음성으로 여러 문구를 한꺼번에 줄 세우고, 마지막이 끝나면 done을 부른다. */
function tts(parts: Say[], done: () => void) {
  if (!hasTts) return done()
  const rate = load<number>(RATE_KEY, DEFAULT_RATE)
  parts.forEach((p, k) => {
    const u = new SpeechSynthesisUtterance(p.text)
    u.lang = LOCALE[p.lang]
    u.rate = rate
    const v = chooseVoice(p.lang)
    if (v) u.voice = v
    if (k === parts.length - 1) u.onend = done
    speechSynthesis.speak(u)
  })
}

async function playFrom(parts: Say[], i: number, my: number) {
  if (i >= parts.length || my !== run) return
  const file = dubbedFile(parts[i])
  if (!file) {
    // 이어지는 기기 음성 문구는 한 번에 넘긴다.
    let j = i
    while (j < parts.length && !dubbedFile(parts[j])) j++
    tts(parts.slice(i, j), () => void playFrom(parts, j, my))
    return
  }
  try {
    const buf = await buffer(file)
    if (my !== run) return
    const src = audio().createBufferSource()
    src.buffer = buf
    src.connect(audio().destination)
    src.onended = () => void playFrom(parts, i + 1, my)
    playing = src
    src.start()
  } catch {
    // 파일을 못 읽으면 이 문구만 기기 음성으로 읽는다.
    tts([parts[i]], () => void playFrom(parts, i + 1, my))
  }
}

/** 앞서 읽던 것을 멈추고 문구들을 차례로 읽는다. */
export function speak(parts: Say[]) {
  const my = ++run
  stop()
  void playFrom(parts, 0, my)
}
