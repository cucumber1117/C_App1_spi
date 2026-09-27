import type { AnswerRecord } from '../../features/answers/checkAnswer'
import { categoryForStage, getCategoryStages } from '../../features/problems/categoryMap'
import type { ProblemCategory } from '../../features/problems/problemGenerator'
import StageMap from './StageMap'

type CategoryMapProps = {
  history: AnswerRecord[]
  onSelectCategory: (category: ProblemCategory) => void
  onHome: () => void
}

export default function CategoryMap({ history, onSelectCategory, onHome }: CategoryMapProps) {
  const stages = getCategoryStages(history)
  // 5ノード単位で配置し、全分野を常に表示する。
  const groups = Array.from({ length: Math.ceil(stages.length / 5) }, (_, index) => ({
    id: `categories-${index}`,
    label: `分野 ${index * 5 + 1}〜${Math.min((index + 1) * 5, stages.length)}`,
    stages: stages.slice(index * 5, (index + 1) * 5),
  }))

  return <StageMap groups={groups}
    currentStageId={stages.find(stage => !stage.played)?.id ?? ''}
    onHome={onHome}
    onSelectStage={stageId => {
      const category = categoryForStage(stageId)
      if (category) onSelectCategory(category)
    }} />
}
