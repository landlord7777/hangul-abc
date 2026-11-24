// 0단계 기술 검증 화면 — 아이패드에서 웹앱 동작을 항목별로 확인한다
import { useState } from 'react'
import EnvCheck from './check/EnvCheck'
import TtsCheck from './check/TtsCheck'
import DrawCheck from './check/DrawCheck'
import StorageCheck from './check/StorageCheck'
import { reportText } from './check/report'

export default function App() {
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)

  const makeReport = async () => {
    const t = reportText()
    setText(t)
    try {
      await navigator.clipboard.writeText(t)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <main>
      <h1>🧚 반짝 한글 ABC — 기기 확인</h1>
      <EnvCheck />
      <TtsCheck />
      <DrawCheck />
      <StorageCheck />
      <section>
        <h2>5. 결과 보내기</h2>
        <p>모든 확인이 끝나면 아래 버튼을 눌러 결과를 복사해서 전달해 주세요.</p>
        <button onClick={makeReport}>결과 복사</button>
        {copied && <span className="ok"> 복사했습니다</span>}
        {text && <textarea readOnly value={text} />}
      </section>
    </main>
  )
}
