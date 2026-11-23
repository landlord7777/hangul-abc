// 손가락·펜슬로 글자를 따라 쓸 수 있는지, 손바닥 터치를 걸러내는지 확인하는 카드
import { useEffect, useRef, useState } from 'react'
import { setReport } from './report'

export default function DrawCheck() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeId = useRef<number | null>(null)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [types, setTypes] = useState<string[]>([])
  const [ignored, setIgnored] = useState(0)

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
    // 이미 그리는 중이면 두 번째 터치(손바닥 등)는 무시한다.
    if (activeId.current !== null) {
      setIgnored((n) => n + 1)
      return
    }
    activeId.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    last.current = pos(e)
    setTypes((t) => (t.includes(e.pointerType) ? t : [...t, e.pointerType]))
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
    last.current = null
  }

  setReport('그리기 입력 종류', types.join(', ') || '(아직 안 그림)')
  setReport('무시한 추가 터치', String(ignored))

  return (
    <section>
      <h2>3. 따라 쓰기 (손가락·펜슬)</h2>
      <p>펜슬로 흐린 글자를 따라 써 보세요. 손이 화면에 닿아도 선이 생기지 않는지 확인해 주세요.</p>
      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      <p>
        입력 종류: <b>{types.join(', ') || '-'}</b> · 무시한 추가 터치: <b>{ignored}</b>
      </p>
      <button onClick={reset}>지우기</button>
    </section>
  )
}
