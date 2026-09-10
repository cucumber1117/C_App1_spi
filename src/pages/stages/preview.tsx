import { StrictMode, useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import StageMap, { type StageGroupView, type Track } from './StageMap'
import SampleExercise from './SampleExercise'

type PreviewState = { track: Track; selectedStage: string | null; completed: Record<string, number>; starts: Record<Track, number> }
const previewKey = 'spi-ui-sample-map-v1'
function restorePreview(): PreviewState {
  const fallback: PreviewState = { track: 'nonverbal', selectedStage: null, completed: {}, starts: { verbal: 1, nonverbal: 6 } }
  try {
    const value = JSON.parse(localStorage.getItem(previewKey) || 'null') as PreviewState
    const validId = (id: string) => /^(nonverbal|verbal)-(stage|check)-[1-9][0-9]*$/.test(id)
    if (value && (value.track === 'verbal' || value.track === 'nonverbal') && (value.selectedStage === null || typeof value.selectedStage === 'string' && validId(value.selectedStage) && value.selectedStage.startsWith(`${value.track}-`))
      && value.completed && Object.entries(value.completed).every(([id, score]) => validId(id) && Number.isInteger(score) && score >= 0 && score <= 10)
      && value.starts && [value.starts.verbal, value.starts.nonverbal].every(n => Number.isInteger(n) && n >= 1 && n <= 1001 && (n - 1) % 5 === 0)) return value
  } catch { /* A broken sample snapshot starts the preview again. */ }
  return fallback
}

function fixture(track: Track, start: number, past = false): StageGroupView {
  return { id: `${track}-${start}`, label: `${String(start).padStart(2, '0')} – ${String(start + 4).padStart(2, '0')}`,
    stages: Array.from({ length: 5 }, (_, i) => ({ id: `${track}-stage-${start + i}`, label: String(start + i).padStart(2, '0'),
      unlocked: past || i < (start === (track === 'verbal' ? 1 : 6) ? 3 : 1), played: past || (start === (track === 'verbal' ? 1 : 6) && i < 2), award: start === (track === 'verbal' ? 1 : 6) && i === 0 ? 'perfect' : start === (track === 'verbal' ? 1 : 6) && i === 1 ? 'clear' : undefined })),
    check: { id: `${track}-check-${start}`, label: 'CHECK', unlocked: past, played: past } }
}
export default function Preview() {
  const [initial] = useState(restorePreview)
  const [track, setTrack] = useState<Track>(initial.track)
  const [seen, setSeen] = useState<string[]>([])
  const [checkReady, setCheckReady] = useState(false)
  const [selectedStage, setSelectedStage] = useState<string | null>(initial.selectedStage)
  const [completed, setCompleted] = useState<Record<string, number>>(initial.completed)
  const [starts, setStarts] = useState<Record<Track, number>>(initial.starts)
  const [saveError, setSaveError] = useState(false)
  // The storage result is external state that must be surfaced to the user.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => { try { localStorage.setItem(previewKey, JSON.stringify({ track, selectedStage, completed, starts })); setSaveError(false) } catch { setSaveError(true) } }, [track, selectedStage, completed, starts])
  const [newIds, setNewIds] = useState<string[]>([])
  const onSeen = useCallback((id: string) => setSeen(previous => previous.includes(id) ? previous : [...previous, id]), [])
  const start = starts[track]
  const decorate = (group: StageGroupView): StageGroupView => {
    const stages = group.stages.map((stage, i) => {
      const score = completed[stage.id]
      return { ...stage, played: stage.played || score !== undefined, unlocked: stage.unlocked || score !== undefined || (i > 0 && completed[group.stages[i - 1].id] !== undefined),
        award: score === undefined ? stage.award : score === 10 ? 'perfect' as const : score >= 6 ? 'clear' as const : undefined,
        isNew: newIds.includes(stage.id) && !seen.includes(stage.id) }
    })
    const score = completed[group.check.id]
    return { ...group, stages, check: { ...group.check, unlocked: group.check.unlocked || stages.every(s => s.played), played: group.check.played || score !== undefined,
      award: score === undefined ? undefined : score === 10 ? 'perfect' : score >= 6 ? 'clear' : undefined, isNew: newIds.includes(group.check.id) && !seen.includes(group.check.id) } }
  }
  const active = decorate(fixture(track, start))
  if (checkReady) { active.stages = active.stages.map(s => ({ ...s, unlocked: true, played: true })); active.check.unlocked = true }
  const current = active.stages.find(stage => stage.unlocked && !stage.played)?.id ?? active.check.id
  const past = Array.from({ length: (start - 1) / 5 }, (_, i) => decorate(fixture(track, i * 5 + 1, true)))
  return <><aside style={{ padding: '12px 20px', background: '#fff', textAlign: 'center', font: '12px/1.7 system-ui', color: '#52655b' }}>
    <strong>操作確認用サンプル</strong> · 固定の10問です。演習とサンプル進捗はこの端末に保存します。<br />復習は表示確認のみです。本番の問題生成とは接続していません。
    {saveError && <p role="alert">サンプル進捗を保存できませんでした。再読み込みで進行が戻る場合があります。</p>}
    {!selectedStage && <label style={{ display: 'block', padding: 6 }}><input type="checkbox" checked={checkReady} onChange={event => setCheckReady(event.target.checked)} /> CHECK解放時を確認</label>}
  </aside>{selectedStage ? <SampleExercise key={selectedStage} stageId={selectedStage} track={track} onExit={() => setSelectedStage(null)} onComplete={score => {
    setCompleted(previous => ({ ...previous, [selectedStage]: Math.max(previous[selectedStage] ?? 0, score) }))
    if (selectedStage === active.check.id) {
      setStarts(previous => ({ ...previous, [track]: start + 5 }))
      setNewIds(previous => [...previous, `${track}-stage-${start + 5}`])
      setCheckReady(false)
    } else {
      const position = active.stages.findIndex(stage => stage.id === selectedStage)
      const next = position >= 0 ? active.stages[position + 1] ?? active.check : undefined
      if (next && !next.unlocked) setNewIds(previous => [...previous, next.id])
    }
    setSelectedStage(null)
  }} /> : <StageMap track={track} currentStageId={current} activeGroup={active} pastGroups={past} onTrackChange={value => { setTrack(value); setCheckReady(false) }} onNewSeen={onSeen}
    onHome={() => { window.location.href = '/' }} onSelectStage={setSelectedStage} />}</>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Preview /></StrictMode>)
