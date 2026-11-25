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

const GAP_MS = 400 // 문구 사이 쉼 (더빙 클립은 앞뒤가 짧게 잘려 있어 그냥 이으면 붙어 들린다)

/** 기기 음성으로 문구 하나를 읽고, 끝나면 done을 부른다. */
function tts(part: Say, done: () => void) {
  if (!hasTts) return done()
  const u = new SpeechSynthesisUtterance(part.text)
  u.lang = LOCALE[part.lang]
  u.rate = load<number>(RATE_KEY, DEFAULT_RATE)
  const v = chooseVoice(part.lang)
  if (v) u.voice = v
  u.onend = done
  speechSynthesis.speak(u)
}

type OnPart = (index: number) => void

async function playFrom(parts: Say[], i: number, my: number, onPart?: OnPart) {
  if (i >= parts.length || my !== run) return
  const next = () => {
    if (i + 1 < parts.length) window.setTimeout(() => void playFrom(parts, i + 1, my, onPart), GAP_MS)
  }
  const file = dubbedFile(parts[i])
  onPart?.(i)
  if (!file) return tts(parts[i], next)
  try {
    const buf = await buffer(file)
    if (my !== run) return
    const src = audio().createBufferSource()
    src.buffer = buf
    src.connect(audio().destination)
    src.onended = next
    playing = src
    src.start()
  } catch {
    // 파일을 못 읽으면 이 문구만 기기 음성으로 읽는다.
    tts(parts[i], next)
  }
}

/** 앞서 읽던 것을 멈추고 문구들을 차례로 읽는다. 문구 사이에는 잠깐 쉰다. onPart는 각 문구를 읽기 시작할 때 불린다. */
export function speak(parts: Say[], onPart?: OnPart) {
  const my = ++run
  stop()
  void playFrom(parts, 0, my, onPart)
}
