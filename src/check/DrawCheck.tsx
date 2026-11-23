// 손가락·펜슬로 글자를 따라 쓸 수 있는지 확인하는 카드 (펜슬 모드 / 손가락 모드 선택)
import { useEffect, useRef, useState } from 'react'
import { setReport } from './report'

// pen: 펜슬로만 쓰기(손바닥 무시), finger: 펜슬과 손가락 모두 쓰기
type DrawMode = 'pen' | 'finger'
const MODE_KEY = 'settings.drawMode'

function loadMode(): DrawMode {
  try {
    return localStorage.getItem(MODE_KEY) === 'finger' ? 'finger' : 'pen'
  } catch {
    return 'pen'
  }
}

export default function DrawCheck() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeId = useRef<number | null>(null)
  const activeType = useRef<string | null>(null)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [types, setTypes] = useState<string[]>([])
  const [ignored, setIgnored] = useState(0)
  const [mode, setMode] = useState<DrawMode>(loadMode)

  const chooseMode = (m: DrawMode) => {
    setMode(m)
    try {
      localStorage.setItem(MODE_KEY, m)
    } catch {
      // 저장 실패 시 이번 실행 동안만 적용된다.
    }
  }

  const reset = () => {
    const canvas = canvasRef.current!
    const ratio = window.devicePixelRatio
    canvas.width = canvas.clientWidth * ratio
    canvas.height = canvas.clientHeight * ratio
    const ctx = canvas.getContext('2d')!
    ctx.scale(ratio, ratio)
    // 따라 쓸 흐린 글자
    ctx.fillStyle = '#f3d3e4'
    ctx.font = `${canvas.clientHeight * 0.8}px 'Apple SD Gothic Neo', sans-serif`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText('가 a', canvas.clientWidth / 2, canvas.clientHeight / 2)
    ctx.strokeStyle = '#d94f97'
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }

  useEffect(reset, [])

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setTypes((t) => (t.includes(e.pointerType) ? t : [...t, e.pointerType]))
    // 펜슬 모드에서는 펜슬이 아닌 입력(손가락·손바닥)을 무시한다.
    // 손가락 모드에서도 손 터치로 그리는 중에 펜슬이 오면 펜슬로 넘긴다.
    const takeOver = e.pointerType === 'pen' && activeType.current !== 'pen'
    if ((mode === 'pen' && e.pointerType !== 'pen') || (activeId.current !== null && !takeOver)) {
      setIgnored((n) => n + 1)
      return
    }
    activeId.current = e.pointerId
    activeType.current = e.pointerType
    e.currentTarget.setPointerCapture(e.pointerId)
    last.current = pos(e)
  }

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerId !== activeId.current || !last.current) return
    const ctx = e.currentTarget.getContext('2d')!
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerId !== activeId.current) return
    activeId.current = null
    activeType.current = null
    last.current = null
  }

  setReport('쓰기 모드', mode)
  setReport('그리기 입력 종류', types.join(', ') || '(아직 안 그림)')
  setReport('무시한 터치', String(ignored))

  return (
    <section>
      <h2>3. 따라 쓰기 (손가락·펜슬)</h2>
      <div>
        <button className={mode === 'pen' ? 'selected' : undefined} onClick={() => chooseMode('pen')}>
          ✏️ 펜슬 모드
        </button>
        <button className={mode === 'finger' ? 'selected' : undefined} onClick={() => chooseMode('finger')}>
          👆 손가락 모드
        </button>
      </div>
      <p>
        {mode === 'pen'
          ? '펜슬로만 써져요. 손이 화면에 닿아도 선이 생기지 않아요.'
          : '펜슬과 손가락 모두 써져요. 손바닥이 닿으면 선이 생길 수 있어요.'}
      </p>
      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      <p>
        입력 종류: <b>{types.join(', ') || '-'}</b> · 무시한 터치: <b>{ignored}</b>
      </p>
      <button onClick={reset}>지우기</button>
    </section>
  )
}
