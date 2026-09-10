import { useEffect, useRef, useState } from 'react'

type HandwritingMemoProps = {
  memoData?: string
  onMemoChange: (memoData?: string) => void
}

function HandwritingMemo({ memoData, onMemoChange }: HandwritingMemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef({ x: 0, y: 0 })
  const [hasDrawing, setHasDrawing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const hasMemo = hasDrawing || Boolean(memoData)

  useEffect(() => {
    if (!isOpen) return
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.round(rect.width * ratio)
      canvas.height = Math.round(rect.height * ratio)
      const context = canvas.getContext('2d')
      context?.setTransform(ratio, 0, 0, ratio, 0, 0)

      if (memoData && context) {
        const image = new Image()
        image.onload = () => context.drawImage(image, 0, 0, rect.width, rect.height)
        image.src = memoData
      }
    }

    resizeCanvas()
    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [isOpen, memoData])

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    drawingRef.current = true
    lastPointRef.current = pointFromEvent(event)
  }

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const context = event.currentTarget.getContext('2d')
    if (!context) return

    const point = pointFromEvent(event)
    context.beginPath()
    context.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    context.lineTo(point.x, point.y)
    context.strokeStyle = '#18232d'
    context.lineWidth = event.pointerType === 'pen' ? Math.max(1.5, event.pressure * 4) : 2.5
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.stroke()
    lastPointRef.current = point
    setHasDrawing(true)
  }

  const stopDrawing = () => {
    if (drawingRef.current) {
      const canvas = canvasRef.current
      if (canvas) onMemoChange(canvas.toDataURL('image/png'))
    }
    drawingRef.current = false
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawing(false)
    onMemoChange(undefined)
  }

  return (
    <>
      <section className="memo-launch-card" aria-labelledby="memo-title">
        <div><p className="question-label">手書きメモ</p><h3 id="memo-title">問題を見ながら画面全体に書けます</h3><p>{hasMemo ? 'この問題のメモがあります。' : '指・マウス・ペンに対応しています。'}</p></div>
        <button className="secondary-button" onClick={() => setIsOpen(true)} type="button">{hasMemo ? 'メモを開く' : '画面にメモする'}</button>
      </section>

      {isOpen && <div className="screen-memo" role="dialog" aria-modal="true" aria-label="画面全体の手書きメモ">
        <canvas
          aria-label="手書き計算メモ"
          onPointerCancel={stopDrawing}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          ref={canvasRef}
        />
        {!hasMemo && <span className="screen-memo-placeholder">画面の好きな場所に書いてください</span>}
        <div className="screen-memo-toolbar">
          <div><strong>手書きメモ</strong><span>問題ごとに保持されます</span></div>
          <button className="memo-clear-button" disabled={!hasMemo} onClick={clearCanvas} type="button">すべて消す</button>
          <button className="memo-close-button" onClick={() => setIsOpen(false)} type="button">閉じる</button>
        </div>
      </div>}
    </>
  )
}

export default HandwritingMemo
