import { useEffect, useRef, useState } from 'react'
import './ink.css'

type Point = { x: number; y: number }
export type Ink = { width: number; height: number; strokes: Point[][] }
// oxlint-disable-next-line react/only-export-components
export function isInk(value: unknown): value is Ink {
  const ink = value as Ink | null
  return !!ink && Number.isFinite(ink.width) && ink.width > 0 && Number.isFinite(ink.height) && ink.height > 0 && Array.isArray(ink.strokes) && ink.strokes.every(s => Array.isArray(s) && s.every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y)))
}
export function InkPreview({ ink }: { ink: Ink }) {
  return <svg className="ink-preview" viewBox={`0 0 ${ink.width} ${ink.height}`} role="img" aria-label="この問題の手書きメモ"><InkLines strokes={ink.strokes} /></svg>
}
function InkLines({ strokes }: { strokes: Point[][] }) {
  return <g fill="none" stroke="#315789" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{strokes.map((stroke, i) => <polyline key={i} points={stroke.map(p => `${p.x},${p.y}`).join(' ')} />)}</g>
}
export default function InkMemo({ ink, onChange }: { ink?: Ink; onChange: (ink: Ink) => void }) {
  const launcher = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const pointer = useRef<number | null>(null)
  const points = useRef<Point[]>([])
  const [draft, setDraft] = useState<Point[]>([])
  const [bounds, setBounds] = useState<DOMRect | null>(null)
  const width = ink?.width ?? bounds?.width ?? 1
  const height = ink?.height ?? bounds?.height ?? 1
  useEffect(() => {
    if (!bounds) return
    const modal = dialog.current!
    const trigger = launcher.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    modal.showModal()
    return () => { modal.close(); document.body.style.overflow = overflow; trigger?.focus({ preventScroll: true }) }
  }, [bounds])
  const finish = () => {
    if (pointer.current === null) return
    onChange({ width, height, strokes: [...(ink?.strokes ?? []), points.current] })
    pointer.current = null
    points.current = []
    setDraft([])
  }
  const point = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: (event.clientX - rect.left) / rect.width * width, y: (event.clientY - rect.top) / rect.height * height }
  }
  return <>
    <button className="ink-launch" aria-label="手書きメモを開く" title="手書きメモ" ref={launcher} type="button" onClick={() => setBounds(launcher.current!.closest('main')!.getBoundingClientRect())}><span aria-hidden="true">✎</span></button>
    {!bounds && ink && <svg className="ink-ghost" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true"><InkLines strokes={ink.strokes} /></svg>}
    {bounds && <dialog ref={dialog} className="ink-dialog" aria-label="手書きメモ" onCancel={() => { finish(); setBounds(null) }}>
      <svg className="ink-canvas" role="img" aria-label="問題の上に書く領域" style={{ left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height }} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"
        onPointerDown={event => { if (pointer.current !== null || event.button !== 0) return; event.preventDefault(); pointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); const p = point(event); points.current = [p, { x: p.x + 0.01, y: p.y + 0.01 }]; setDraft(points.current) }}
        onPointerMove={event => { if (pointer.current !== event.pointerId) return; points.current = [...points.current, point(event)]; setDraft(points.current) }}
        onPointerUp={event => { if (pointer.current === event.pointerId) finish() }} onPointerCancel={finish} onLostPointerCapture={finish}>
        <InkLines strokes={[...(ink?.strokes ?? []), ...(draft.length ? [draft] : [])]} />
      </svg>
      <div className="ink-toolbar"><p>画面に書けます · スクロールは一時停止</p><div>
        <button type="button" disabled={!ink?.strokes.length} onClick={() => onChange({ width, height, strokes: ink!.strokes.slice(0, -1) })}>ひとつ戻す</button>
        <button type="button" disabled={!ink?.strokes.length} onClick={() => onChange({ width, height, strokes: [] })}>全消去</button>
        <button type="button" className="ink-done" autoFocus onClick={() => { finish(); setBounds(null) }}>回答に戻る</button>
      </div></div>
    </dialog>}
  </>
}
