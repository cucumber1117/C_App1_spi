import { useCallback, useEffect, useRef, useState } from 'react'
import { loadLearning, saveLearning, archiveBrokenSave } from './features/stages/storage'
import { addReview, advance, editSession, nextStage, recommendedReviews, resumable, selectAnswer, startSession, submitAnswer, type LearningState, type Mode, type Page } from './features/stages/learning'
import { stageTitle } from './features/stages/catalog'
import { calculateCategoryScoreSummaries, calculateScoreSummary } from './features/answers/scoreCalculator'
import { getReviewProblems, toReviewProblem, type ReviewProblem } from './features/answers/reviewProblems'
import { checkAnswer, createAnswerRecord, type AnswerResult } from './features/answers/checkAnswer'
import Home from './pages/home/home'
import CategoryMap from './pages/stages/CategoryMap'
import StageExercise from './pages/stages/StageExercise'
import Performance from './pages/performance/performance'
import Review from './pages/review/review'
import Question from './pages/question/question'
import './App.css'

export default function App() {
  const [initial] = useState(loadLearning)
  const [state, setState] = useState(initial.state)
  const stateRef = useRef(initial.state)
  const [loadError, setLoadError] = useState(initial.error)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const retryGeneration = useRef<(() => void) | null>(null)
  const [legacyProblem, setLegacyProblem] = useState<ReviewProblem | null>(null)
  const [legacyAnswer, setLegacyAnswer] = useState<string | null>(null)
  const [legacyResult, setLegacyResult] = useState<AnswerResult | null>(null)
  const commit = useCallback((change: (previous: LearningState) => LearningState) => {
    const previous = stateRef.current
    const updated = change(previous)
    if (updated === previous) return
    stateRef.current = updated
    setState(updated)
    try { saveLearning(updated); setSaveError(null) }
    catch { setSaveError('端末に保存できませんでした。この画面を閉じると進行が失われる場合があります。') }
  }, [])
  const go = (page: Page) => commit(s => ({ ...s, page }))
  const start = (stageId: string, mode: Mode) => {
    const attempt = () => {
      try { commit(s => startSession(s, stageId, mode)); setGenerationError(null); retryGeneration.current = null }
      catch (error) { setGenerationError(error instanceof Error ? error.message : '問題を準備できませんでした。'); retryGeneration.current = attempt }
    }
    attempt()
  }
  const onSeen = useCallback((id: string) => commit(s => s.newIds.includes(id) ? { ...s, newIds: s.newIds.filter(value => value !== id) } : s), [commit])
  const continueLearning = () => {
    const pending = resumable(state)
    if (pending) start(pending.plan.stageId, pending.mode)
    else {
      const next = nextStage(state, 'nonverbal')
      if (next) start(next.stageId, 'practice')
      else go('map')
    }
  }
  const session = state.activeKey ? state.sessions[state.activeKey] : undefined
  const reviews = recommendedReviews(state)
  const legacyReviews = getReviewProblems(state.history).filter(record => !Object.values(state.sessions).some(s => s.questions.some(q => q.id === record.problemId)) && !('stageId' in record))
  useEffect(() => { window.scrollTo(0, 0) }, [state.page])
  if (loadError) return <main className="page-content narrow-content"><h1 className="page-title">保存データを確認してください</h1><p role="alert">{loadError}</p>
    <p>現在のデータは自動で上書きしません。再読み込みするか、元データを端末内に退避して新しく始められます。</p>
    <button type="button" className="primary-button" onClick={() => window.location.reload()}>再読み込み</button>
    <button type="button" className="secondary-button" onClick={() => { try { const fresh = archiveBrokenSave(); stateRef.current = fresh; setState(fresh); setLoadError(null) } catch { setLoadError('退避先にも保存できませんでした。ブラウザーの保存設定・空き容量を確認してください。') } }}>保存データを退避してやり直す</button>
  </main>
  return <div className="app-shell">
    <header className="app-header"><button className="brand" type="button" onClick={() => go('home')}><span className="brand-mark">S</span><span>SPIトレーニング</span></button><span className="header-caption">ひとつずつ、先へ。</span></header>
    {saveError && <aside className="storage-alert" role="alert"><span>{saveError}</span><button type="button" onClick={() => { try { saveLearning(stateRef.current); setSaveError(null) } catch { /* 警告を維持する */ } }}>保存を再試行</button></aside>}
    {generationError && <aside className="storage-alert" role="alert"><span>{generationError} 回答済みのデータは保持しています。</span><button type="button" onClick={() => retryGeneration.current?.()}>生成を再試行</button><button type="button" onClick={() => setGenerationError(null)}>閉じる</button></aside>}
    <main className="page-container">
      {state.page === 'home' && <Home started={Object.keys(state.sessions).length > 0} onContinue={continueLearning} onMap={() => commit(s => ({ ...s, page: 'map', track: 'nonverbal' }))} onReview={() => go('review')} onPerformance={() => go('performance')} />}
      {state.page === 'map' && (state.track === 'nonverbal' ? <CategoryMap state={state} onSelectStage={id => start(id, 'practice')} onSeen={onSeen} onHome={() => go('home')} /> : <section className="page-content"><p>言語は準備中です。</p><button type="button" onClick={() => go('home')}>ホームへ戻る</button></section>)}
      {state.page === 'exercise' && session && <StageExercise key={session.id} session={session} inReview={Boolean(state.reviews[session.plan.stageId])} saveError={saveError}
        onSelect={answer => commit(s => selectAnswer(s, answer))} onSubmit={elapsed => commit(s => submitAnswer(s, elapsed))} onAdvance={() => commit(advance)}
        onFeedback={open => commit(s => editSession(s, current => ({ ...current, feedbackOpen: open })))}
        onInk={ink => commit(s => editSession(s, current => ({ ...current, ink: current.ink.map((v, i) => i === current.index ? ink : v) })))}
        onNote={note => commit(s => editSession(s, current => ({ ...current, notes: current.notes.map((v, i) => i === current.index ? note : v) })))}
        onExit={() => go(session.mode === 'review' ? 'review' : 'map')} onNext={() => go(session.mode === 'review' ? 'review' : 'map')}
        onRetry={() => start(session.plan.stageId, session.mode)} onAddReview={() => commit(s => addReview(s, session.plan))} />}
      {state.page === 'review' && <section className="page-content narrow-content"><button className="back-button" type="button" onClick={() => go('home')}>← ホームへ戻る</button><p className="eyebrow">REVIEW</p><h1 className="page-title">もう一度、ひとつ。</h1>
        {reviews.length ? <><p className="lead">今やるなら、ここから。</p><div className="result-card"><strong>{stageTitle(reviews[0].plan)}</strong><p>{[...new Set(reviews[0].plan.slots.map(slot => slot.category))].join('・')}</p><button className="primary-button" type="button" onClick={() => start(reviews[0].plan.stageId, 'review')}>復習する →</button></div>
          {reviews.length > 1 && <details><summary>ほかの復習</summary>{reviews.slice(1).map(entry => <button key={entry.plan.stageId} className="category-card" type="button" onClick={() => start(entry.plan.stageId, 'review')}>{stageTitle(entry.plan)} · {[...new Set(entry.plan.slots.map(slot => slot.category))].join('・')}</button>)}</details>}</>
          : <p className="lead">今は復習のおすすめはありません。ステージへ進んでみよう。</p>}
        <button type="button" className="quiet-link" onClick={() => go('map')}>ステージへ</button>
        {legacyReviews.length > 0 && <button type="button" className="quiet-link" onClick={() => { setLegacyProblem(null); setLegacyResult(null); go('legacyReview') }}>以前の問題を復習する</button>}
      </section>}
      {state.page === 'performance' && <Performance scoreSummary={calculateScoreSummary(state.history)} categoryScoreSummaries={calculateCategoryScoreSummaries(state.history).filter(s => s.totalCount > 0)} onBack={() => go('home')} />}
      {state.page === 'legacyReview' && (!legacyProblem ? <Review problems={legacyReviews} onSelect={record => { setLegacyProblem(toReviewProblem(record)); setLegacyAnswer(null); setLegacyResult(null) }} onBack={() => go('review')} />
        : legacyResult ? <section className="page-content narrow-content"><h2>{legacyResult.isCorrect ? '正解！' : '答えを確認しよう'}</h2><p>正解：{legacyResult.correctAnswer}</p><p>{legacyResult.explanation}</p><button type="button" className="primary-button" onClick={() => { setLegacyProblem(null); setLegacyResult(null) }}>以前の復習一覧へ</button></section>
          : <Question key={legacyProblem.id} problem={legacyProblem} selectedAnswer={legacyAnswer} onAnswer={setLegacyAnswer} onBack={() => setLegacyProblem(null)} isReview questionNumber={1} questionCount={1} onSubmit={elapsed => {
            if (legacyAnswer === null) return
            const result = checkAnswer(legacyProblem, legacyAnswer)
            setLegacyResult(result)
            commit(s => ({ ...s, history: [...s.history, createAnswerRecord(legacyProblem, result, elapsed)] }))
          }} />)}
    </main>
    <footer className="app-footer">SPIトレーニング <span>© 2026</span></footer>
  </div>
}
