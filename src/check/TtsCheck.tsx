// 한국어·영어 음성 합성(TTS)이 아이패드에서 어떻게 들리는지 확인하는 카드
import { useEffect, useState } from 'react'
import { setReport } from './report'

const KO_SAMPLES = ['그', '느', '끄', '아', '와', '윽', '은', '기역', '니은', '나무', '고양이가 잠을 자요.']
const EN_SAMPLES = ['B', 'B, ball', 'A, apple', 'a', 'cat', 'c, a, t, cat', 'the', 'I see a red cat.']

function voicesFor(all: SpeechSynthesisVoice[], prefix: string) {
  return all.filter((v) => v.lang.toLowerCase().startsWith(prefix))
}

// 고음질(향상됨/프리미엄) 음성이 있으면 먼저 고른다.
function pickDefault(list: SpeechSynthesisVoice[]) {
  return list.find((v) => /enhanced|premium|향상|고품질/i.test(v.name)) ?? list[0]
}

function VoicePanel({ title, lang, samples, voices }: {
  title: string
  lang: string
  samples: string[]
  voices: SpeechSynthesisVoice[]
}) {
  const [voiceName, setVoiceName] = useState('')
  const [rate, setRate] = useState(0.85)

  useEffect(() => {
    if (!voiceName && voices.length) setVoiceName(pickDefault(voices).name)
  }, [voices, voiceName])

  const speak = (text: string) => {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.rate = rate
    const v = voices.find((x) => x.name === voiceName)
    if (v) u.voice = v
    speechSynthesis.speak(u)
  }

  return (
    <div>
      <h3>{title} — 음성 {voices.length}개</h3>
      {voices.length > 0 ? (
        <select value={voiceName} onChange={(e) => setVoiceName(e.target.value)}>
          {voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      ) : (
        <p className="bad">이 언어의 음성이 없습니다.</p>
      )}
      <label>
        {' '}속도 {rate.toFixed(2)}{' '}
        <input type="range" min={0.5} max={1.2} step={0.05} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
      </label>
      <div>
        {samples.map((s) => (
          <button key={s} onClick={() => speak(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function TtsCheck() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const supported = 'speechSynthesis' in window

  useEffect(() => {
    if (!supported) return
    const load = () => setVoices(speechSynthesis.getVoices())
    load()
    speechSynthesis.addEventListener('voiceschanged', load)
    return () => speechSynthesis.removeEventListener('voiceschanged', load)
  }, [supported])

  const ko = voicesFor(voices, 'ko')
  const en = voicesFor(voices, 'en')
  setReport('TTS 지원', String(supported))
  setReport('한국어 음성', ko.map((v) => v.name).join(', ') || '(없음)')
  setReport('영어 음성', en.map((v) => `${v.name}[${v.lang}]`).join(', ') || '(없음)')

  return (
    <section>
      <h2>2. 소리 (음성 합성)</h2>
      {!supported && <p className="bad">이 브라우저는 음성 합성을 지원하지 않습니다.</p>}
      <p>버튼을 눌러 들어보세요. 무음 스위치나 볼륨도 확인해 주세요.</p>
      <VoicePanel title="한국어" lang="ko-KR" samples={KO_SAMPLES} voices={ko} />
      <VoicePanel title="영어" lang="en-US" samples={EN_SAMPLES} voices={en} />
    </section>
  )
}
