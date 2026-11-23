// 웹앱 실행 환경(홈 화면 실행, 오프라인 준비, 화면 크기)을 보여주는 확인 카드
import { useEffect, useState } from 'react'
import { setReport } from './report'

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export default function EnvCheck() {
  const [online, setOnline] = useState(navigator.onLine)
  const [swReady, setSwReady] = useState(false)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    navigator.serviceWorker?.ready.then(() => setSwReady(true))
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  const standalone = isStandalone()
  const controlled = !!navigator.serviceWorker?.controller
  const screenInfo = `${window.innerWidth}×${window.innerHeight} (배율 ${window.devicePixelRatio})`

  setReport('빌드', __BUILD_TIME__)
  setReport('브라우저', navigator.userAgent)
  setReport('홈 화면 앱으로 실행', String(standalone))
  setReport('오프라인 준비(서비스 워커)', `ready=${swReady}, controlled=${controlled}`)
  setReport('화면', screenInfo)

  return (
    <section>
      <h2>1. 실행 환경</h2>
      <table>
        <tbody>
          <tr>
            <td>홈 화면 앱으로 실행</td>
            <td className={standalone ? 'ok' : 'bad'}>{standalone ? '예' : '아니요 (Safari에서 열림)'}</td>
          </tr>
          <tr>
            <td>오프라인 준비</td>
            <td className={controlled ? 'ok' : 'bad'}>
              {controlled ? '완료' : swReady ? '설치됨 — 앱을 한 번 닫았다 다시 열어 주세요' : '준비 중'}
            </td>
          </tr>
          <tr>
            <td>인터넷</td>
            <td>{online ? '연결됨' : '끊김 (오프라인)'}</td>
          </tr>
          <tr>
            <td>화면</td>
            <td>{screenInfo}</td>
          </tr>
          <tr>
            <td>빌드 시각</td>
            <td>{new Date(__BUILD_TIME__).toLocaleString('ko-KR')}</td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
