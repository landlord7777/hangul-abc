// 더빙 음성 파일을 하나씩 눌러 들어보는 카드 (기기 음성과 비교용)
import VOICE_FILES from '../content/voices.json'
import type { Lang } from '../content/types'
import { speak } from '../lib/speech'

const ENTRIES = Object.keys(VOICE_FILES).map((key) => {
  const [lang, ...rest] = key.split(':')
  return { lang: lang as Lang, text: rest.join(':') }
})

export default function DubCheck() {
  return (
    <section>
      <h2>6. 더빙 음성</h2>
      <p>더빙 파일이 있는 문장입니다. 학습 화면에서도 이 문장은 더빙 음성으로 나옵니다. 오른쪽 🤖는 같은 문장을 기기 음성으로 읽습니다.</p>
      {ENTRIES.length === 0 && <p>아직 더빙 파일이 없습니다.</p>}
      {ENTRIES.map((e) => (
        <div key={`${e.lang}:${e.text}`}>
          <button onClick={() => speak([e])}>{e.text}</button>
          <button
            onClick={() => {
              // 더빙 목록에 없는 문구로 만들어 기기 음성으로 읽게 한다 (앞뒤 공백은 소리에 영향 없음).
              speak([{ lang: e.lang, text: ` ${e.text}` }])
            }}
          >
            🤖
          </button>
        </div>
      ))}
    </section>
  )
}
