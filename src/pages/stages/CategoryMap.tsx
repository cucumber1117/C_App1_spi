import type { LearningState } from '../../features/stages/learning'
import { awardFor, isUnlocked, nextStage } from '../../features/stages/learning'
import { STAGES, type StageDefinition } from '../../features/stages/catalog'
import StageMap, { type StageGroupView, type StageView } from './StageMap'

type Props = { state: LearningState; onSelectStage: (id: string) => void; onSeen: (id: string) => void; onHome: () => void }
export default function CategoryMap({ state, onSelectStage, onSeen, onHome }: Props) {
  const stages = STAGES.filter(s => s.track === state.track)
  const next = nextStage(state)
  const activeGroup = next?.group ?? stages[stages.length - 1].group
  const node = (stage: StageDefinition): StageView => ({
    id: stage.stageId, label: stage.label, unlocked: isUnlocked(state, stage.stageId),
    played: Boolean(state.progress[stage.stageId]),
    award: state.progress[stage.stageId] ? awardFor(state.progress[stage.stageId].bestScore) : undefined,
    isNew: state.newIds.includes(stage.stageId),
  })
  const group = (index: number): StageGroupView => ({
    id: `${state.track}-${index}`, label: `${String(index * 5 + 1).padStart(2, '0')} – ${String(index * 5 + 5).padStart(2, '0')}`,
    stages: stages.filter(s => s.group === index && s.kind === 'stage').map(node),
    check: node(stages.find(s => s.group === index && s.kind === 'check')!),
  })
  return <StageMap track={state.track} currentStageId={next?.stageId ?? ''}
    activeGroup={group(activeGroup)} pastGroups={Array.from({ length: activeGroup }, (_, i) => group(i))}
    onTrackChange={() => {}} onSelectStage={onSelectStage} onNewSeen={onSeen} onHome={onHome} completed={!next} />
}
