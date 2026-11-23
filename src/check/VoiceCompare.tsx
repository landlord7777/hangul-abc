// 오픈소스 TTS 엔진별로 미리 만든 샘플 음성을 들어보고 비교하는 카드
import { useEffect, useState } from 'react'

type Sample = { voice: string; lang: string; text: string; file: string }

const ENGINES = [
  { id: 'qwen', name: 'Qwen3-TTS' },
  { id: 'melo', name: 'MeloTTS' },
  { id: 'kokoro', name: 'Kokoro (영어 전용)' },
]
const BASE = import.meta.env.BASE_URL + 'voice-samples/'

export default function VoiceCompare() {
  const [samples, setSamples] = useState<Record<string, Sample[]>>({})

  useEffect(() => {
    for (const e of ENGINES) {
      fetch(BASE + e.id + '.json', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : []))
        .then((list: Sample[]) => setSamples((s) => ({ ...s, [e.id]: list })))
        .catch(() => setSamples((s) => ({ ...s, [e.id]: [] })))
    }
  }, [])

  const play = (file: string) => {
    speechSynthesis.cancel()
    void new Audio(BASE + file).play()
  }

  return (
    <section>
      <h2>6. AI 음성 비교</h2>
      <p>엔진마다 같은 낱말을 만들어 두었습니다. 위 2번의 기기 음성과 비교해 들어보세요.</p>
      {ENGINES.map((e) => {
        const list = samples[e.id] ?? []
        const voices = [...new Set(list.map((s) => `${s.lang}:${s.voice}`))]
        return (
          <div key={e.id}>
            <h3>{e.name}</h3>
            {list.length === 0 && <p>아직 샘플이 없습니다.</p>}
            {voices.map((v) => (
              <div key={v}>
                <b>{v.replace(':', ' · ')}</b>
                <div>
                  {list
                    .filter((s) => `${s.lang}:${s.voice}` === v)
                    .map((s) => (
                      <button key={s.file} onClick={() => play(s.file)}>
                        {s.text}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </section>
  )
}
