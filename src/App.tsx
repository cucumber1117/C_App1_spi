import { useState } from 'react'
import Home from './pages/home/home'
import Question from './pages/question/question'
import './App.css'

type Page = 'home' | 'categories' | 'question' | 'result'
type Category = '割合' | '損益算' | '速度算'

const categories: { name: Category; description: string; icon: string }[] = [
  { name: '割合', description: '割合・比・百分率の問題', icon: '%' },
  { name: '損益算', description: '原価・利益・売価の問題', icon: '￥' },
  { name: '速度算', description: '速さ・時間・道のりの問題', icon: '↗' },
]

function App() {
  const [page, setPage] = useState<Page>('home')
  const [selectedCategory, setSelectedCategory] = useState<Category>('割合')
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  const startCategory = (category: Category) => {
    setSelectedCategory(category)
    setSelectedAnswer(null)
    setPage('question')
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
        {page === 'question' && <Question category={selectedCategory} selectedAnswer={selectedAnswer} onAnswer={setSelectedAnswer} onBack={() => setPage('categories')} onSubmit={() => setPage('result')} />}
        {page === 'result' && <section className="page-content narrow-content result-page"><p className="eyebrow">RESULT</p><h2 className="page-title">回答を受け付けました</h2><div className="result-card"><span className="result-icon">✓</span><strong>おつかれさまでした！</strong><p>採点結果や解説は、採点機能の実装後に表示されます。</p></div><div className="result-actions"><button className="primary-button" onClick={() => setPage('categories')} type="button">もう一度解く <span>→</span></button><button className="secondary-button" onClick={() => setPage('home')} type="button">ホームへ戻る</button></div></section>}
      </main>
      <footer className="app-footer">SPIトレーニング <span>© 2026</span></footer>
    </div>
  )
}

export default App
