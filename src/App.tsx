import { useEffect, useState } from 'react'
import { checkAnswer, createAnswerRecord, type AnswerRecord, type AnswerResult } from './features/answers/checkAnswer'
import { loadAnswerHistory, saveAnswerHistory } from './features/answers/answerHistoryStorage'
import { getReviewProblems, toReviewProblem, type ReviewableAnswerRecord, type ReviewProblem } from './features/answers/reviewProblems'
import { calculateCategoryScoreSummaries, calculateScoreSummary } from './features/answers/scoreCalculator'
import { generateProblem, type ProblemCategory, type SpiProblem } from './features/problems/problemGenerator'
import Home from './pages/home/home'
import Performance from './pages/performance/performance'
import Question from './pages/question/question'
import Review from './pages/review/review'
import CategoryMap from './pages/stages/CategoryMap'
import './App.css'

type Page = 'home' | 'categories' | 'question' | 'result' | 'performance' | 'review'


function App() {
  const [page, setPage] = useState<Page>('home')
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [answerHistory, setAnswerHistory] = useState<AnswerRecord[]>(loadAnswerHistory)
  const [currentProblem, setCurrentProblem] = useState<SpiProblem | ReviewProblem>(() => generateProblem('割合'))
  const scoreSummary = calculateScoreSummary(answerHistory)
  const categoryScoreSummaries = calculateCategoryScoreSummaries(answerHistory)
    .filter((summary) => summary.totalCount > 0)
  const reviewProblems = getReviewProblems(answerHistory)

  useEffect(() => {
    saveAnswerHistory(answerHistory)
  }, [answerHistory])

  const startCategory = (category: ProblemCategory) => {
    setIsReviewMode(false)
    setCurrentProblem(generateProblem(category))
    setSelectedAnswer(null)
    setAnswerResult(null)
    setPage('question')
  }

  const startReview = (record: ReviewableAnswerRecord) => {
    setIsReviewMode(true)
    setCurrentProblem(toReviewProblem(record))
    setSelectedAnswer(null)
    setAnswerResult(null)
    setPage('question')
  }

  const submitAnswer = (elapsedSeconds: number) => {
    if (selectedAnswer === null) return

    const result = checkAnswer(currentProblem, selectedAnswer)
    const record = createAnswerRecord(currentProblem, result, elapsedSeconds)

    setAnswerResult(result)
    setAnswerHistory((history) => [...history, record])
    setPage('result')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand" onClick={() => setPage('home')} type="button"><span className="brand-mark">S</span><span>SPIトレーニング</span></button>
        <span className="header-caption">非言語問題演習</span>
      </header>
      <main className="page-container">
        {page === 'home' && <Home onStart={() => setPage('categories')} onShowPerformance={() => setPage('performance')} onShowReview={() => setPage('review')} />}
        {page === 'performance' && <Performance scoreSummary={scoreSummary} categoryScoreSummaries={categoryScoreSummaries} onBack={() => setPage('home')} />}
        {page === 'review' && <Review problems={reviewProblems} onSelect={startReview} onBack={() => setPage('home')} />}
        {page === 'categories' && <CategoryMap history={answerHistory} onSelectCategory={startCategory} onHome={() => setPage('home')} />}
        {page === 'question' && <Question key={`${isReviewMode ? 'review' : 'practice'}-${currentProblem.id}`} problem={currentProblem} selectedAnswer={selectedAnswer} onAnswer={setSelectedAnswer} onBack={() => setPage(isReviewMode ? 'review' : 'categories')} onSubmit={submitAnswer} isReview={isReviewMode} />}
        {page === 'result' && answerResult && (
          <section className="page-content narrow-content result-page">
            <p className="eyebrow">RESULT</p>
            <h2 className="page-title">{answerResult.isCorrect ? '正解です！' : '不正解です'}</h2>
            <div className="result-card">
              <span className="result-icon">{answerResult.isCorrect ? '✓' : '×'}</span>
              <strong>正解：{answerResult.correctAnswer}</strong>
              <p>あなたの回答：{answerResult.selectedAnswer}</p>
              <p>{answerResult.explanation}</p>
            </div>
            <div className="result-actions">
              <button className="primary-button" onClick={() => setPage(isReviewMode ? 'review' : 'categories')} type="button">{isReviewMode ? '復習一覧へ戻る' : 'MAPへ戻る'} <span>→</span></button>
              <button className="secondary-button" onClick={() => setPage('home')} type="button">ホームへ戻る</button>
            </div>
          </section>
        )}
      </main>
      <footer className="app-footer">SPIトレーニング <span>© 2026</span></footer>
    </div>
  )
}

export default App
