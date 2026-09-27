import './stages.css'

type StageView = {
  id: string
  label: string
  category: string
  played: boolean
  award?: 'clear'
}

type StageGroupView = {
  id: string
  label: string
  stages: StageView[]
}

type StageMapProps = {
  groups: StageGroupView[]
  currentStageId: string
  onSelectStage: (stageId: string) => void
  onHome: () => void
}

function StageNode({ stage, current, onSelect }: {
  stage: StageView
  current: boolean
  onSelect: (id: string) => void
}) {
  const status = stage.award === 'clear' ? 'CLEAR' : stage.played ? 'プレイ済み' : current ? 'ここから' : ''
  return <button type="button" className={`stage-node ${current ? 'stage-current' : ''}`}
    aria-label={`${stage.category} ${status}`.trim()}
    aria-current={current ? 'step' : undefined} onClick={() => onSelect(stage.id)}>
    <span className="stage-number">{stage.label}</span>
    <span className="stage-category">{stage.category}</span>
    {status && <span className="stage-status">{stage.award === 'clear' ? '✓ ' : ''}{status}</span>}
  </button>
}

export default function StageMap({ groups, currentStageId, onSelectStage, onHome }: StageMapProps) {
  return <section className="stage-screen" aria-label="学習MAP">
    <header className="stage-header"><button type="button" onClick={onHome} aria-label="ホームへ戻る">←</button><span>SPI</span><span aria-hidden="true">✦</span></header>
    <nav className="stage-tracks" aria-label="問題の区分">
      <button type="button" disabled aria-pressed={false}>言語<small>（準備中）</small></button>
      <button type="button" aria-pressed={true}>非言語</button>
    </nav>
    <div className="stage-heading"><p>挑戦したい分野から、ひとつずつ。</p><h1>分野を選ぼう</h1></div>
    {groups.map(group => <section key={group.id} className="stage-map" aria-label={group.label}><div className="stage-path" aria-hidden="true" />
      <ol>{group.stages.map((stage, index) => <li key={stage.id} className={`stage-position-${index}`}>
        <StageNode stage={stage} current={stage.id === currentStageId} onSelect={onSelectStage} />
      </li>)}</ol>
    </section>)}
    <p className="stage-footnote">自分のペースで、進もう。</p>
  </section>
}
