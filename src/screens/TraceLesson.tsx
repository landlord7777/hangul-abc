// 활동 A5 — 흐린 낱말·문장 위에 펜슬이나 손가락으로 따라 쓴다 (펜 색, 지우개, 모두 지우기, 펜슬/손가락 모드)
import { LINES } from '../content/lines'
import { useCallback, useEffect, useRef, useState } from 'react'
import Fairy from '../components/Fairy'
import LessonBar from '../components/LessonBar'
import type { Subject, TraceSet } from '../content/types'
import { acceptPointer, loadMode, saveMode, type DrawMode } from '../lib/drawMode'
import { speak } from '../lib/speech'
import { load, save } from '../lib/storage'
import { NEXT_DELAY, praise } from './lesson'

const COLORS = ['#ff4fa0', '#a35cff', '#ff3b30', '#ff9500', '#2fb350', '#1e88ff', '#4a2b3f']
const COLOR_KEY = 'settings.penColor'
const PASS_COVER = 0.3 // 흐린 글자 중 이만큼을 덮으면 별
const SAMPLE_STEP = 3 // 덮은 정도를 잴 때 몇 px마다 볼지 (CSS px)

type Point = { x: number; y: number }
type State = 'write' | 'nudge' | 'right' | 'pass'

const guideFont = (subject: Subject, size: number) =>
  subject === 'en' ? `${size}px Andika, sans-serif` : `600 ${size}px 'Apple SD Gothic Neo', sans-serif`

export default function TraceLesson({ subject, set, onExit, onFinish }: {
  subject: Subject
  set: TraceSet
  onExit: () => void
  onFinish: (correct: number, total: number) => void
}) {
  const [items] = useState(set.items)
  const [i, setI] = useState(0)
  const [color, setColor] = useState(() => load(COLOR_KEY, COLORS[0]))
  const [eraser, setEraser] = useState(false)
  const [mode, setMode] = useState<DrawMode>(loadMode)
  const [state, setState] = useState<State>('write')
  const boardRef = useRef<HTMLDivElement>(null)
  const guideRef = useRef<HTMLCanvasElement>(null)
  const inkRef = useRef<HTMLCanvasElement>(null)
  const lineWidth = useRef(12)
  const targets = useRef<number[]>([]) // 흐린 글자 위의 표본 픽셀 위치
  const active = useRef<{ id: number; type: string; last: Point } | null>(null)
  const correct = useRef(0)
  const timer = useRef<number | undefined>(undefined)
  const item = items[i]

  // 판 크기에 맞춰 흐린 글자를 그리고, 쓴 선은 비운다.
  const drawBoard = useCallback(() => {
    const board = boardRef.current
    const guide = guideRef.current
    const ink = inkRef.current
    if (!board || !guide || !ink) return
    const w = board.clientWidth
    const h = board.clientHeight
    const r = window.devicePixelRatio || 1
    for (const c of [guide, ink]) {
      c.width = Math.round(w * r)
      c.height = Math.round(h * r)
      c.getContext('2d')!.setTransform(r, 0, 0, r, 0, 0)
    }
    const g = guide.getContext('2d')!
    let size = h * 0.62
    g.font = guideFont(subject, size)
    const textW = g.measureText(item.text).width
    if (textW > w * 0.9) size *= (w * 0.9) / textW
    const font = guideFont(subject, size)
    lineWidth.current = Math.max(8, size * 0.09)

    // 공책처럼 가운데 점선
    g.strokeStyle = '#f8dcea'
    g.lineWidth = 2
    g.setLineDash([12, 10])
    g.beginPath()
    g.moveTo(16, h / 2)
    g.lineTo(w - 16, h / 2)
    g.stroke()
    // 흐린 글자: 연한 채움 + 점선 테두리
    g.font = font
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = '#f3dfea'
    g.fillText(item.text, w / 2, h / 2)
    g.setLineDash([5, 5])
    g.strokeStyle = '#d7a3c2'
    g.lineWidth = 1.5
    g.strokeText(item.text, w / 2, h / 2)

    // 덮은 정도를 잴 표본 픽셀을 미리 고른다 (가운데 줄은 빼고 글자만).
    const off = document.createElement('canvas')
    off.width = guide.width
    off.height = guide.height
    const o = off.getContext('2d')!
    o.setTransform(r, 0, 0, r, 0, 0)
    o.font = font
    o.textAlign = 'center'
    o.textBaseline = 'middle'
    o.fillText(item.text, w / 2, h / 2)
    const d = o.getImageData(0, 0, off.width, off.height).data
    const step = Math.max(1, Math.round(SAMPLE_STEP * r))
    const list: number[] = []
    for (let y = 0; y < off.height; y += step)
      for (let x = 0; x < off.width; x += step) if (d[(y * off.width + x) * 4 + 3] > 128) list.push(y * off.width + x)
    targets.current = list
  }, [item, subject])

  useEffect(() => {
    const board = boardRef.current!
    const ro = new ResizeObserver(() => drawBoard())
    ro.observe(board)
    // Andika 글꼴이 늦게 오면 받은 뒤 다시 그린다.
    void document.fonts?.load(guideFont(subject, 100), item.text).then(drawBoard)
    return () => ro.disconnect()
  }, [drawBoard, subject, item])

  useEffect(() => {
    speak(i === 0 ? [...LINES.traceIntro, ...item.say] : item.say)
  }, [i, item])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const stroke = (a: Point, b: Point) => {
    const c = inkRef.current!.getContext('2d')!
    c.globalCompositeOperation = eraser ? 'destination-out' : 'source-over'
    c.strokeStyle = color
    c.lineWidth = eraser ? lineWidth.current * 3 : lineWidth.current
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.beginPath()
    c.moveTo(a.x, a.y)
    c.lineTo(b.x + 0.01, b.y) // 점 하나만 찍어도 보이게 아주 조금 늘린다
    c.stroke()
  }

  const at = (ev: { clientX: number; clientY: number }): Point => {
    const r = inkRef.current!.getBoundingClientRect()
    return { x: ev.clientX - r.left, y: ev.clientY - r.top }
  }

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (state === 'right' || state === 'pass') return
    if (!acceptPointer(mode, e.pointerType, active.current?.type ?? null)) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = at(e)
    active.current = { id: e.pointerId, type: e.pointerType, last: p }
    stroke(p, p)
  }

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const a = active.current
    if (!a || e.pointerId !== a.id) return
    // 펜슬은 화면보다 자주 위치를 보내므로 모아 둔 점까지 그려 선을 매끄럽게 한다.
    const events = e.nativeEvent.getCoalescedEvents?.() ?? []
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const p = at(ev)
      stroke(a.last, p)
      a.last = p
    }
  }

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (active.current?.id === e.pointerId) active.current = null
  }

  const clearInk = () => {
    const ink = inkRef.current!
    const c = ink.getContext('2d')!
    c.save()
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.clearRect(0, 0, ink.width, ink.height)
    c.restore()
  }

  const coverage = () => {
    const ink = inkRef.current!
    const data = ink.getContext('2d')!.getImageData(0, 0, ink.width, ink.height).data
    const t = targets.current
    if (t.length === 0) return 1
    let hit = 0
    for (const k of t) if (data[k * 4 + 3] > 0) hit++
    return hit / t.length
  }

  const done = () => {
    if (state === 'right' || state === 'pass') return
    const ok = coverage() >= PASS_COVER
    if (!ok && state === 'write') {
      // 한 번은 더 써 보자고 하고, 그래도 다 썼다고 하면 별 없이 넘어간다.
      setState('nudge')
      speak(LINES.traceMore)
      return
    }
    if (ok) correct.current++
    setState(ok ? 'right' : 'pass')
    speak(ok ? [praise()] : LINES.traceSkip)
    timer.current = window.setTimeout(() => {
      if (i + 1 < items.length) {
        setI(i + 1)
        setState('write')
        setEraser(false)
      } else onFinish(correct.current, items.length)
    }, NEXT_DELAY)
  }

  const toggleMode = () => {
    const m = mode === 'pen' ? 'finger' : 'pen'
    setMode(m)
    saveMode(m)
    speak(m === 'pen' ? LINES.penOnly : LINES.fingerToo)
  }

  const pose = state === 'right' ? 'cheer' : state === 'nudge' ? 'think' : state === 'pass' ? 'wave' : 'fight'

  return (
    <div className="screen trace">
      <LessonBar step={i} total={items.length} onExit={onExit} onReplay={() => speak(item.say)} />
      <div className="trace-stage">
        <div className="trace-top">
          <Fairy pose={pose} size={110} />
          <button className="trace-hint" aria-label="다시 듣기" onClick={() => speak(item.say)}>
            {item.emoji}
          </button>
          <div className="trace-tools">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`swatch${!eraser && c === color ? ' on' : ''}`}
                style={{ background: c }}
                aria-label="펜 색"
                onClick={() => {
                  setColor(c)
                  save(COLOR_KEY, c)
                  setEraser(false)
                }}
              />
            ))}
            <button className={`tool${eraser ? ' on' : ''}`} onClick={() => setEraser(true)}>
              🧽 지우개
            </button>
            <button className="tool" onClick={clearInk}>
              🗑️ 모두
            </button>
            <button className="tool" onClick={toggleMode}>
              {mode === 'pen' ? '✏️ 펜슬만' : '👆 손가락도'}
            </button>
          </div>
        </div>
        <div className="trace-board" ref={boardRef}>
          <canvas ref={guideRef} />
          <canvas
            ref={inkRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
        </div>
        <button className={`trace-done${state === 'right' ? ' right' : ''}`} onClick={done}>
          ✔️ 다 썼어
        </button>
      </div>
    </div>
  )
}
