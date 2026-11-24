// 기기 확인 화면 — 0단계 검증 항목을 부모 메뉴에서 다시 확인한다
import { useState } from 'react'
import EnvCheck from './EnvCheck'
import TtsCheck from './TtsCheck'
import DrawCheck from './DrawCheck'
import StorageCheck from './StorageCheck'
import { reportText } from './report'

export default function CheckScreen({ onBack }: { onBack: () => void }) {
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
      <button onClick={onBack}>⬅️ 부모 메뉴로</button>
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
