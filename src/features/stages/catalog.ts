import { PROBLEM_PATTERNS, generateProblemByPattern, type Difficulty, type ProblemCategory, type SpiProblem } from '../problems/problemGenerator'

export type Track = 'verbal' | 'nonverbal'
export type Slot = { category: ProblemCategory; difficulty: Difficulty; patternIds: string[] }
export type StagePlan = { stageId: string; track: Track; revision: number; kind: 'stage' | 'check'; label: string; slots: Slot[] }
export type StageDefinition = StagePlan & { group: number; number: number }
export type StageProblem = SpiProblem & { stageId: string; track: Track; conditionRevision: number }

// 暫定カリキュラム。画面側には単元との対応を持たせない。
const ranges: ProblemCategory[][] = [
  ['割合'], ['損益算'], ['速度算'], ['集合'], ['場合の数', '確率'],
  ['確率'], ['推論'], ['表の読み取り'], ['割合', '損益算', '速度算'], ['集合', '場合の数', '確率', '推論', '表の読み取り'],
]
const levels: Difficulty[] = ['easy', 'easy', 'easy', 'normal', 'normal', 'normal', 'normal', 'normal', 'hard', 'hard']
const normalStages: StageDefinition[] = ranges.map((categories, index) => ({
  stageId: `nonverbal-stage-${index + 1}`, track: 'nonverbal', revision: 1, kind: 'stage',
  label: String(index + 1).padStart(2, '0'), number: index + 1, group: Math.floor(index / 5),
  slots: levels.map((difficulty, slotIndex) => {
    const category = categories[slotIndex % categories.length]
    return { category, difficulty, patternIds: PROBLEM_PATTERNS.filter(p => p.category === category && p.difficulty === difficulty).map(p => p.id) }
  }),
}))

export const STAGES: StageDefinition[] = [0, 1].flatMap(group => {
  const stages = normalStages.slice(group * 5, group * 5 + 5)
  // CHECKの配分は暫定。各ステージ2問、合計では基礎3・標準5・応用2。
  const check: StageDefinition = {
    stageId: `nonverbal-check-${group + 1}`, track: 'nonverbal', revision: 1,
    kind: 'check', label: 'CHECK', number: group + 1, group,
    slots: stages.flatMap((stage, index) => stage.slots.slice(index * 2, index * 2 + 2)),
  }
  return [...stages, check]
})
export const findStage = (id: string) => STAGES.find(stage => stage.stageId === id)
export const stageTitle = (plan: StagePlan) => plan.kind === 'check' ? 'CHECK' : `STAGE ${plan.label}`
export const fingerprint = (problem: SpiProblem) => JSON.stringify([problem.patternId, problem.question, problem.tables ?? []])

export class GenerationError extends Error {
  constructor(message: string) { super(message); this.name = 'GenerationError' }
}

export function generateStageSet(plan: StagePlan, recent: string[] = []): StageProblem[] {
  if (plan.slots.length !== 10) throw new GenerationError('出題条件を確認できませんでした。')
  const used = new Set<string>()
  return plan.slots.map(slot => {
    const candidates = PROBLEM_PATTERNS.filter(p => slot.patternIds.includes(p.id) && p.category === slot.category && p.difficulty === slot.difficulty)
    if (!candidates.length) throw new GenerationError('このステージの出題条件は現在利用できません。')
    for (let attempt = 0; attempt < 80; attempt++) {
      const pattern = candidates[Math.floor(Math.random() * candidates.length)]
      const problem = generateProblemByPattern(pattern.id)
      const key = fingerprint(problem)
      // セット内は必ず重複を除外。有限パターンでは直近履歴だけ40回後に緩和。
      if (used.has(key) || (attempt < 40 && recent.includes(key))) continue
      used.add(key)
      return { ...problem, stageId: plan.stageId, track: plan.track, conditionRevision: plan.revision }
    }
    throw new GenerationError('重複しない問題を準備できませんでした。もう一度お試しください。')
  })
}
