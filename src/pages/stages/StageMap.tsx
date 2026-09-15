import { useEffect, useRef } from 'react'
import './stages.css'

export type Track = 'verbal' | 'nonverbal'
export type StageView = {
  id: string
  label: string
  unlocked: boolean
  played: boolean
  award?: 'clear' | 'perfect'
  isNew?: boolean
}
export type StageGroupView = {
  id: string
  label: string
  stages: StageView[]
  check: StageView
}
export type StageMapProps = {
  track: Track
  currentStageId: string
  activeGroup: StageGroupView
  pastGroups: StageGroupView[]
  onTrackChange: (track: Track) => void
  onSelectStage: (stageId: string) => void
  onNewSeen: (stageId: string) => void
  onHome: () => void
}

function StageNode({ stage, current, onSelect, onSeen }: {
  stage: StageView
  current: boolean
  onSelect: (id: string) => void
  onSeen: (id: string) => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!stage.isNew || !stage.unlocked || !ref.current) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const observer = new IntersectionObserver(([entry]) => {
      clearTimeout(timer)
      if (entry.isIntersecting) timer = setTimeout(() => onSeen(stage.id), 2400)
    }, { threshold: 0.8 })
    observer.observe(ref.current)
    return () => { clearTimeout(timer); observer.disconnect() }
  }, [stage.id, stage.isNew, stage.unlocked, onSeen])
  const status = stage.award === 'perfect' ? 'PERFECT' : stage.award === 'clear' ? 'CLEAR' : stage.played ? 'プレイ済み' : current ? 'ここから' : ''
  return <button ref={ref} type="button" disabled={!stage.unlocked}
    className={`stage-node ${current ? 'stage-current' : ''} ${stage.isNew ? 'stage-new' : ''} ${stage.award === 'perfect' ? 'stage-perfect' : ''}`}
    aria-label={stage.unlocked ? `${stage.label === 'CHECK' ? 'CHECK' : `STAGE ${stage.label}`} ${status}` : '未解放のステージ'}
    aria-current={current ? 'step' : undefined} onClick={() => onSelect(stage.id)}>
    {stage.unlocked ? <><span className="stage-number">{stage.label}</span>
      {status && <span className="stage-status">{stage.award === 'clear' ? '✓ ' : ''}{status}</span>}
      {stage.isNew && <span className="stage-new-label">NEW</span>}</> : <span className="stage-diamond" aria-hidden="true">◇</span>}
  </button>
}

export default function StageMap(props: StageMapProps) {
  const renderNode = (stage: StageView) => <StageNode key={stage.id} stage={stage} current={stage.id === props.currentStageId}
    onSelect={props.onSelectStage} onSeen={props.onNewSeen} />
  return <main className="stage-screen">
    <header className="stage-header"><button type="button" onClick={props.onHome} aria-label="ホームへ戻る">←</button><span>SPI</span><span aria-hidden="true">✦</span></header>
    <nav className="stage-tracks" aria-label="問題の区分">
      <button type="button" aria-pressed={props.track === 'verbal'} onClick={() => props.onTrackChange('verbal')}>言語</button>
      <button type="button" aria-pressed={props.track === 'nonverbal'} onClick={() => props.onTrackChange('nonverbal')}>非言語</button>
    </nav>
    {props.pastGroups.length > 0 && <details className="stage-history"><summary>これまで <span aria-hidden="true">＋</span></summary>
      {props.pastGroups.map(group => <details key={group.id}><summary>{group.label}</summary><div className="stage-history-grid">{group.stages.map(renderNode)}{renderNode(group.check)}</div></details>)}
    </details>}
    <div className="stage-heading"><p>ひとつずつ、先へ。</p><h1>次のステージへ</h1></div>
    <section className="stage-map" aria-label="ステージ選択"><div className="stage-path" aria-hidden="true" />
      <ol>{props.activeGroup.stages.map((stage, index) => <li key={stage.id} className={`stage-position-${index}`}>{renderNode(stage)}</li>)}</ol>
      <div className="stage-check">{renderNode(props.activeGroup.check)}</div>
    </section>
    <p className="stage-footnote">自分のペースで、進もう。</p>
  </main>
}
