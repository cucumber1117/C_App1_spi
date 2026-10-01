import { loadAnswerHistory } from '../answers/answerHistoryStorage'
import { PROBLEM_CATEGORIES } from '../problems/problemGenerator'
import { validateProblem } from '../problems/core'
import { emptyState, sessionScore, type LearningState, type Session } from './learning'
import type { StagePlan } from './catalog'
import { isInk } from './ink'

export const LEARNING_KEY = 'spi-stage-learning-v1'
const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)
const strings = (x: unknown): x is string[] => Array.isArray(x) && x.every(v => typeof v === 'string')
const score = (x: unknown) => Number.isInteger(x) && Number(x) >= 0 && Number(x) <= 10
const date = (x: unknown) => typeof x === 'string' && Number.isFinite(Date.parse(x))

function validPlan(x: unknown): x is StagePlan {
  if (!record(x)) return false
  return typeof x.stageId === 'string' && /^(nonverbal|verbal)-(stage|check)-[1-9]\d*$/.test(x.stageId)
    && (x.track === 'nonverbal' || x.track === 'verbal') && x.stageId.startsWith(`${x.track}-`)
    && Number.isInteger(x.revision) && Number(x.revision) > 0 && typeof x.label === 'string'
    && (x.kind === 'stage' || x.kind === 'check') && x.stageId.includes(`-${x.kind}-`)
    && Array.isArray(x.slots) && x.slots.length === 10 && x.slots.every(slot => record(slot)
      && PROBLEM_CATEGORIES.includes(slot.category as never) && ['easy', 'normal', 'hard'].includes(String(slot.difficulty))
      && strings(slot.patternIds) && slot.patternIds.length > 0)
}
function validSession(value: unknown): value is Session {
  if (!record(value) || !validPlan(value.plan) || !Array.isArray(value.questions) || value.questions.length !== 10) return false
  const s = value as unknown as Session
  if (!['practice', 'review'].includes(s.mode) || s.key !== `${s.mode}:${s.plan.stageId}` || typeof s.id !== 'string'
    || !date(s.updatedAt) || !Number.isInteger(s.index) || s.index < 0 || s.index > 9
    || !['question', 'feedback', 'result'].includes(s.phase) || typeof s.feedbackOpen !== 'boolean'
    || typeof s.completed !== 'boolean' || !Array.isArray(s.answers) || s.answers.length !== 10
    || !strings(s.notes) || s.notes.length !== 10 || !Array.isArray(s.ink) || s.ink.length !== 10
    || !s.ink.every(ink => ink === null || isInk(ink))) return false
  const ids = new Set<string>()
  for (const [i, q] of s.questions.entries()) {
    if (!record(q) || typeof q.id !== 'string' || ids.has(q.id) || typeof q.question !== 'string'
      || typeof q.answer !== 'string' || typeof q.explanation !== 'string' || !strings(q.choices)
      || q.stageId !== s.plan.stageId || q.track !== s.plan.track || q.conditionRevision !== s.plan.revision
      || q.category !== s.plan.slots[i].category || q.difficulty !== s.plan.slots[i].difficulty
      || typeof q.patternId !== 'string' || !s.plan.slots[i].patternIds.includes(q.patternId)) return false
    ids.add(q.id)
    try { validateProblem(q) } catch { return false }
    if (s.answers[i] !== null && !q.choices.includes(s.answers[i]!)) return false
    const shouldBeAnswered = i < s.index || (i === s.index && s.phase !== 'question')
    if (shouldBeAnswered !== (s.answers[i] !== null)) return false
  }
  if (s.selected !== null && !s.questions[s.index].choices.includes(s.selected)) return false
  if (s.phase !== 'question' && s.selected !== s.answers[s.index]) return false
  if (s.phase === 'question' && s.feedbackOpen) return false
  if (s.phase === 'result' && (s.index !== 9 || s.feedbackOpen)) return false
  return s.completed === s.answers.every(a => a !== null)
}
export function decodeState(raw: string): LearningState {
  const value: unknown = JSON.parse(raw)
  if (!record(value) || value.version !== 1) throw new Error('保存形式を確認できません。元のデータは上書きしていません。')
  const s = value as unknown as LearningState
  if (!['home', 'map', 'exercise', 'review', 'performance', 'legacyReview'].includes(s.page)
    || !['verbal', 'nonverbal'].includes(s.track) || !record(s.sessions) || !record(s.progress) || !record(s.reviews)
    || !strings(s.newIds) || !strings(s.recent) || !Array.isArray(s.history)
    || !Object.entries(s.sessions).every(([key, session]) => validSession(session) && key === session.key)
    || !Object.values(s.progress).every(p => record(p) && score(p.bestScore) && score(p.lastScore) && Number(p.bestScore) >= Number(p.lastScore) && date(p.completedAt))
    || !Object.entries(s.reviews).every(([id, entry]) => record(entry) && validPlan(entry.plan) && id === entry.plan.stageId && date(entry.addedAt))
    || !s.history.every(h => record(h) && typeof h.problemId === 'string' && typeof h.category === 'string'
      && typeof h.question === 'string' && typeof h.selectedAnswer === 'string' && typeof h.correctAnswer === 'string'
      && typeof h.isCorrect === 'boolean' && typeof h.explanation === 'string' && typeof h.answeredAt === 'string'
      && (h.choices === undefined || strings(h.choices))
      && (h.tables === undefined || (Array.isArray(h.tables) && h.tables.every(t => record(t) && typeof t.title === 'string' && strings(t.headers) && Array.isArray(t.rows) && t.rows.every(strings)))))
    || !(s.activeKey === null || typeof s.activeKey === 'string' && s.sessions[s.activeKey])
    || !(s.lastKey === null || typeof s.lastKey === 'string' && s.sessions[s.lastKey])
    || (s.page === 'exercise' && !s.activeKey)) throw new Error('保存データに不整合があります。元のデータは上書きしていません。')
  for (const session of Object.values(s.sessions)) {
    if (session.completed && session.mode === 'practice' && (!s.progress[session.plan.stageId]
      || s.progress[session.plan.stageId].bestScore < sessionScore(session))) throw new Error('完走記録を確認できません。元のデータは上書きしていません。')
  }
  return s
}
export function loadLearning(): { state: LearningState; error: string | null } {
  try {
    const raw = localStorage.getItem(LEARNING_KEY)
    return { state: raw === null ? emptyState(loadAnswerHistory()) : decodeState(raw), error: null }
  } catch (error) {
    return { state: emptyState(), error: error instanceof Error ? error.message : '保存データを読み込めませんでした。' }
  }
}
export const saveLearning = (state: LearningState) => localStorage.setItem(LEARNING_KEY, JSON.stringify(state))
export function archiveBrokenSave() {
  const raw = localStorage.getItem(LEARNING_KEY)
  if (raw !== null) localStorage.setItem(`${LEARNING_KEY}-recovery-${Date.now()}`, raw)
  const fresh = emptyState(loadAnswerHistory())
  saveLearning(fresh)
  return fresh
}
