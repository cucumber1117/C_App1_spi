import { useState } from 'react'
import { checkAnswer, createAnswerRecord, type AnswerRecord, type AnswerResult } from './features/answers/checkAnswer'
import { generateProblem, type ProblemCategory, type SpiProblem } from './features/problems/problemGenerator'
import Home from './pages/home/home'
import Question from './pages/question/question'
import './App.css'

type Page = 'home' | 'categories' | 'question' | 'result'

const categories: { name: ProblemCategory; description: string; icon: string }[] = [
  { name: '推論', description: '条件から答えを導く問題', icon: '◎' },
  { name: '場合の数', description: '組み合わせを数える問題', icon: 'Ⅲ' },
  { name: '確率', description: '起こりやすさを求める問題', icon: '⅟' },
  { name: '集合', description: 'グループの重なりの問題', icon: '◯' },
  { name: '損益算', description: '原価・利益・売価の問題', icon: '￥' },
  { name: '速度算', description: '速さ・時間・道のりの問題', icon: '↗' },
  { name: '割合', description: '割合・比・百分率の問題', icon: '%' },
  { name: '表の読み取り', description: '表や数値を読み取る問題', icon: '▦' },
]

function App() {
  const [page, setPage] = useState<Page>('home')
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
  const [answerHistory, setAnswerHistory] = useState<AnswerRecord[]>([])
  const [currentProblem, setCurrentProblem] = useState<SpiProblem>(() => generateProblem('割合'))

  const startCategory = (category: ProblemCategory) => {
    setCurrentProblem(generateProblem(category))
    setSelectedAnswer(null)
    setAnswerResult(null)
    setPage('question')
  }

  const submitAnswer = () => {
    if (selectedAnswer === null) return

    const result = checkAnswer(currentProblem, selectedAnswer)
    const record = createAnswerRecord(currentProblem, result)

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
        {page === 'home' && <Home onStart={() => setPage('categories')} />}
        {page === 'categories' && <section className="page-content narrow-content"><button className="back-button" onClick={() => setPage('home')} type="button">← ホームへ戻る</button><p className="eyebrow">STEP 01</p><h2 className="page-title">分野を選ぼう</h2><p className="page-description">挑戦したい分野を選択してください。</p><div className="category-grid">{categories.map((category) => <button className="category-card" key={category.name} onClick={() => startCategory(category.name)} type="button"><span className="category-icon">{category.icon}</span><span className="category-info"><strong>{category.name}</strong><small>{category.description}</small></span><span className="card-arrow">→</span></button>)}</div></section>}
        {page === 'question' && <Question problem={currentProblem} selectedAnswer={selectedAnswer} onAnswer={setSelectedAnswer} onBack={() => setPage('categories')} onSubmit={submitAnswer} />}
        {page === 'result' && answerResult && <section className="page-content narrow-content result-page"><p className="eyebrow">RESULT</p><h2 className="page-title">{answerResult.isCorrect ? '正解です！' : '不正解です'}</h2><div className="result-card"><span className="result-icon">{answerResult.isCorrect ? '✓' : '×'}</span><strong>正解：{answerResult.correctAnswer}</strong><p>あなたの回答：{answerResult.selectedAnswer}</p><p>{answerResult.explanation}</p><p>これまでの回答数：{answerHistory.length}問</p></div><div className="result-actions"><button className="primary-button" onClick={() => setPage('categories')} type="button">もう一度解く <span>→</span></button><button className="secondary-button" onClick={() => setPage('home')} type="button">ホームへ戻る</button></div></section>}
      </main>
      <footer className="app-footer">SPIトレーニング <span>© 2026</span></footer>
    </div>
  )
}

export default App
