import { checkAnswer, createAnswerRecord, type AnswerRecord } from '../answers/checkAnswer'
import { STAGES, findStage, fingerprint, generateStageSet, type StagePlan, type StageProblem, type Track } from './catalog'
import type { Ink } from './ink'

export type Mode = 'practice' | 'review'
export type Page = 'home' | 'map' | 'exercise' | 'review' | 'performance' | 'legacyReview'
export type Session = {
  id: string; key: string; mode: Mode; plan: StagePlan; questions: StageProblem[]
  answers: (string | null)[]; selected: string | null; index: number
  phase: 'question' | 'feedback' | 'result'; feedbackOpen: boolean
  notes: string[]; ink: (Ink | null)[]; updatedAt: string; completed: boolean
}
export type Progress = { bestScore: number; lastScore: number; completedAt: string }
export type ReviewEntry = { plan: StagePlan; addedAt: string }
export type LearningState = {
  version: 1; page: Page; track: Track; activeKey: string | null; lastKey: string | null
  sessions: Record<string, Session>; progress: Record<string, Progress>; reviews: Record<string, ReviewEntry>
  newIds: string[]; recent: string[]; history: AnswerRecord[]
}
export const emptyState = (history: AnswerRecord[] = []): LearningState => ({
  version: 1, page: 'home', track: 'nonverbal', activeKey: null, lastKey: null,
  sessions: {}, progress: {}, reviews: {}, newIds: [], recent: [], history,
})
export const sessionScore = (session: Session) => session.questions.reduce((score, q, i) => score + Number(session.answers[i] === q.answer), 0)
export const awardFor = (score: number) => score === 10 ? 'perfect' as const : score >= 6 ? 'clear' as const : undefined
export function isUnlocked(state: LearningState, id: string) {
  const stage = findStage(id)
  if (!stage) return false
  const trackStages = STAGES.filter(s => s.track === stage.track)
  const index = trackStages.findIndex(s => s.stageId === id)
  return index === 0 || Boolean(state.progress[trackStages[index - 1].stageId])
}
export const nextStage = (state: LearningState, track: Track = state.track) => STAGES.find(s => s.track === track && !state.progress[s.stageId] && isUnlocked(state, s.stageId))
export function resumable(state: LearningState): Session | undefined {
  const last = state.lastKey && state.sessions[state.lastKey]
  if (last && last.phase !== 'result') return last
  return Object.values(state.sessions).filter(s => s.phase !== 'result').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
}
export function startSession(state: LearningState, stageId: string, mode: Mode, now = new Date().toISOString()): LearningState {
  const key = `${mode}:${stageId}`
  const previous = state.sessions[key]
  if (previous && previous.phase !== 'result') return { ...state, page: 'exercise', activeKey: key, lastKey: key, track: previous.plan.track, newIds: state.newIds.filter(id => id !== stageId) }
  const plan = mode === 'review' ? state.reviews[stageId]?.plan : findStage(stageId)
  if (!plan || (mode === 'practice' && !isUnlocked(state, stageId))) throw new Error('このステージはまだ選べません。')
  // 生成がすべて成功してから状態を置き換える。失敗時には途中データを保持する。
  const questions = generateStageSet(plan, state.recent)
  const session: Session = {
    id: crypto.randomUUID(), key, mode, plan: structuredClone(plan), questions,
    answers: Array(10).fill(null), selected: null, index: 0, phase: 'question', feedbackOpen: false,
    notes: Array(10).fill(''), ink: Array(10).fill(null), updatedAt: now, completed: false,
  }
  return { ...state, page: 'exercise', activeKey: key, lastKey: key, track: plan.track,
    sessions: { ...state.sessions, [key]: session }, recent: [...state.recent, ...questions.map(fingerprint)].slice(-40), newIds: state.newIds.filter(id => id !== stageId) }
}
export function editSession(state: LearningState, edit: (session: Session) => Session): LearningState {
  const session = state.activeKey && state.sessions[state.activeKey]
  if (!session) return state
  const updated = edit(session)
  return { ...state, sessions: { ...state.sessions, [session.key]: { ...updated, updatedAt: new Date().toISOString() } } }
}
export function selectAnswer(state: LearningState, answer: string) {
  return editSession(state, s => s.phase === 'question' && s.questions[s.index].choices.includes(answer) ? { ...s, selected: answer } : s)
}
export function submitAnswer(state: LearningState, elapsedSeconds = 0, now = new Date().toISOString()): LearningState {
  const session = state.activeKey && state.sessions[state.activeKey]
  if (!session || session.phase !== 'question' || session.selected === null || session.answers[session.index] !== null) return state
  const question = session.questions[session.index]
  if (!question.choices.includes(session.selected)) return state
  const record = { ...createAnswerRecord(question, checkAnswer(question, session.selected), elapsedSeconds), answeredAt: now,
    stageId: session.plan.stageId, sessionId: session.id, mode: session.mode }
  const answers = session.answers.map((a, i) => i === session.index ? session.selected : a)
  const updated = { ...session, answers, phase: 'feedback' as const, feedbackOpen: true, updatedAt: now }
  let next = { ...state, history: [...state.history, record], sessions: { ...state.sessions, [session.key]: updated } }
  if (answers.every(a => a !== null)) {
    // 最終回答・完走・解放・自動復習追加を同一スナップショットで保存する。
    const score = sessionScore(updated)
    updated.completed = true
    if (session.mode === 'practice') {
      const before = nextStage(state, session.plan.track)
      next = { ...next, progress: { ...next.progress, [session.plan.stageId]: {
        bestScore: Math.max(state.progress[session.plan.stageId]?.bestScore ?? 0, score), lastScore: score, completedAt: now,
      } } }
      const after = nextStage(next, session.plan.track)
      if (after && after.stageId !== before?.stageId) next = { ...next, newIds: [...new Set([...next.newIds, after.stageId])] }
      if (score <= 6) next = addReview(next, session.plan, now)
    } else if (score >= 7) {
      const reviews = { ...next.reviews }
      delete reviews[session.plan.stageId]
      next = { ...next, reviews }
    }
  }
  return next
}
export function advance(state: LearningState) {
  return editSession(state, s => {
    if (s.phase !== 'feedback') return s
    return s.index === 9 ? { ...s, phase: 'result', feedbackOpen: false }
      : { ...s, index: s.index + 1, selected: null, phase: 'question', feedbackOpen: false }
  })
}
export function addReview(state: LearningState, plan: StagePlan, now = new Date().toISOString()): LearningState {
  if (state.reviews[plan.stageId]) return state
  return { ...state, reviews: { ...state.reviews, [plan.stageId]: { plan: structuredClone(plan), addedAt: now } } }
}
export function recommendedReviews(state: LearningState) {
  // 暫定：追加日時が古い順。UIでは件数を強調しない。
  return Object.values(state.reviews).sort((a, b) => a.addedAt.localeCompare(b.addedAt))
}
