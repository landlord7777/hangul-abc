// 앱을 껐다 켜도 기록이 남는지 확인하는 카드
import { useEffect, useState } from 'react'
import { setReport } from './report'

const KEY = 'check.launches'

// StrictMode에서 두 번 실행돼도 한 번만 세도록 모듈 로드 시점에 센다.
const launches = (() => {
  try {
    const n = Number(localStorage.getItem(KEY) ?? '0') + 1
    localStorage.setItem(KEY, String(n))
    return n
  } catch {
    return -1
  }
})()

export default function StorageCheck() {
  const [persisted, setPersisted] = useState<string>('확인 중')

  useEffect(() => {
    if (!navigator.storage?.persisted) {
      setPersisted('지원 안 함')
      return
    }
    navigator.storage
      .persisted()
      .then((p) => (p ? true : navigator.storage.persist()))
      .then((p) => setPersisted(p ? '예' : '아니요'))
  }, [])

  setReport('실행 횟수', String(launches))
  setReport('저장소 영구 보존', persisted)

  return (
    <section>
      <h2>4. 기록 저장</h2>
      <table>
        <tbody>
          <tr>
            <td>이 앱을 연 횟수</td>
            <td className={launches > 0 ? 'ok' : 'bad'}>{launches > 0 ? `${launches}번째` : '저장 불가'}</td>
          </tr>
          <tr>
            <td>저장소 영구 보존</td>
            <td>{persisted}</td>
          </tr>
        </tbody>
      </table>
      <p>앱을 완전히 닫았다가(위로 밀어 종료) 다시 열었을 때 숫자가 1씩 늘면 기록이 잘 남는 것입니다.</p>
    </section>
  )
}
