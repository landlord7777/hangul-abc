// 부모 모드 — 하루 사용시간, 오늘 시간 더 주기, 음성·속도 선택, 기기 확인 화면
import { useEffect, useState } from 'react'
import type { Lang } from '../content/types'
import { save, load } from '../lib/storage'
import { DEFAULT_RATE, RATE_KEY, chooseVoice, speak, voiceKey, voicesFor } from '../lib/speech'
import { remainingSeconds, today, type Usage } from '../lib/usage'

const LIMITS = [10, 20, 30, 45, 60, 0]
const RATES: [number, string][] = [
  [0.7, '느리게'],
  [DEFAULT_RATE, '보통'],
  [1, '빠르게'],
]
const SAMPLE: Record<Lang, string> = { ko: '안녕! 나는 하트 요정이야. 나무, 고양이가 잠을 자요.', en: 'B, ball. I see a red cat.' }

function VoicePick({ lang, label }: { lang: Lang; label: string }) {
  const list = voicesFor(lang)
  // 음성 목록이 늦게 도착할 수 있어서, 고르기 전에는 매번 실제로 쓰일 음성을 보여준다.
  const [picked, setPicked] = useState<string | null>(null)
  const name = picked ?? chooseVoice(lang)?.name ?? ''
  return (
    <div className="voice-row">
      <b>{label}</b>
      {list.length === 0 ? (
        <span className="bad"> 이 기기에 음성이 없습니다.</span>
      ) : (
        <select
          value={name}
          onChange={(e) => {
            setPicked(e.target.value)
            save(voiceKey(lang), e.target.value)
          }}
        >
          {list.map((v) => (
            <option key={v.voiceURI} value={v.name}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      )}
      <button onClick={() => speak([{ text: SAMPLE[lang], lang }])}>🔊</button>
    </div>
  )
}

export default function Parent({ limitMin, usage, onLimit, onBonus, onCheck, onClose }: {
  limitMin: number
  usage: Usage
  onLimit: (min: number) => void
  onBonus: (min: number) => void
  onCheck: () => void
  onClose: () => void
}) {
  const [rate, setRate] = useState(() => load(RATE_KEY, DEFAULT_RATE))
  const [, setVoicesReady] = useState(0)

  // Safari는 음성 목록을 늦게 알려 주므로 도착하면 다시 그린다.
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const refresh = () => setVoicesReady((n) => n + 1)
    speechSynthesis.addEventListener('voiceschanged', refresh)
    return () => speechSynthesis.removeEventListener('voiceschanged', refresh)
  }, [])

  const now = new Date()
  const usedMin = Math.floor(today(usage, now).seconds / 60)
  const left = remainingSeconds(usage, now, limitMin)

  return (
    <main>
      <h1>⚙️ 부모 메뉴</h1>
      <button onClick={onClose}>⬅️ 아이 화면으로</button>

      <section>
        <h2>하루 사용 시간</h2>
        <div>
          {LIMITS.map((m) => (
            <button key={m} className={m === limitMin ? 'selected' : ''} onClick={() => onLimit(m)}>
              {m === 0 ? '제한 없음' : `${m}분`}
            </button>
          ))}
        </div>
        <p>
          오늘 {usedMin}분 사용 · {left === Infinity ? '제한 없음' : `남은 시간 ${Math.ceil(left / 60)}분`}
          {today(usage, now).bonusMin > 0 && ` (오늘 추가 ${today(usage, now).bonusMin}분 포함)`}
        </p>
        <button onClick={() => onBonus(10)}>➕ 오늘 10분 더 주기</button>
        <p>앱이 화면에 떠 있는 시간만 셉니다. 매일 자정에 다시 채워집니다.</p>
      </section>

      <section>
        <h2>목소리</h2>
        <p>아이패드 설정 → 손쉬운 사용 → 읽기 및 말하기 → 음성에서 "향상됨" 음성을 내려받으면 여기에 나타납니다.</p>
        <VoicePick lang="ko" label="한국어" />
        <VoicePick lang="en" label="영어" />
        <div>
          <b>속도</b>
          {RATES.map(([r, label]) => (
            <button
              key={r}
              className={r === rate ? 'selected' : ''}
              onClick={() => {
                setRate(r)
                save(RATE_KEY, r)
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>기기 확인</h2>
        <p>오프라인, 저장, 펜슬 모드 등을 확인하는 화면입니다.</p>
        <button onClick={onCheck}>기기 확인 화면 열기</button>
      </section>
    </main>
  )
}
