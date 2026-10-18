import './home.css'

export type HomeProps = {
  started: boolean
  extraAvailable: boolean
  mockAvailable: boolean
  onContinue: () => void
  onMap: () => void
  onExtra: () => void
  onReview: () => void
  onMock: () => void
  onPerformance: () => void
}
export default function Home({ started, extraAvailable, mockAvailable, onContinue, onMap, onExtra, onReview, onMock, onPerformance }: HomeProps) {
  return <section className="home-dashboard" aria-labelledby="home-title">
    <div className="home-welcome">
      <div className="home-welcome-copy">
        <p className="home-eyebrow">YOUR DAILY PRACTICE</p>
        <h1 id="home-title">{started ? <>今日も、ひとつ。<br />自信につなげよう。</> : <>小さな一問が、<br />自信になる。</>}</h1>
        <p className="home-intro">{started ? '昨日の続きも、新しい挑戦も。自分のペースで進もう。' : 'まずは気になる単元から。自分のペースで、SPIの非言語対策を。'}</p>
        <button className="home-start" type="button" onClick={started ? onContinue : onMap}>
          {started ? '続きから' : '学習を始める'}<span aria-hidden="true">↗</span>
        </button>
      </div>
      <div className="home-illustration" aria-hidden="true">
        <span className="home-orbit" />
        <span className="home-orbit home-orbit-inner" />
        <div className="home-study-card"><span className="home-study-kicker">ONE STEP AT A TIME</span><span className="home-study-check">✓</span><span className="home-study-title">ひとつずつ、<br />できるように。</span><span className="home-study-line" /><span className="home-study-line home-study-line-short" /></div>
        <span className="home-spark home-spark-one">＋</span><span className="home-spark home-spark-two">✦</span>
      </div>
    </div>

    <div className="home-section-heading"><h2 id="home-menu-title">今日は、どう学ぶ？</h2><span>非言語トレーニング</span></div>
    <nav className="home-menu" aria-labelledby="home-menu-title">
      <button className="home-menu-card home-menu-card-featured" type="button" onClick={onMap}>
        <span className="home-menu-icon" aria-hidden="true">▦</span>
        <span className="home-menu-copy"><strong>単元を選ぶ</strong><span>割合・推論など、学びたい分野から。</span></span>
        <span className="home-menu-arrow" aria-hidden="true">→</span>
      </button>
      <button className="home-menu-card" type="button" onClick={onReview}>
        <span className="home-menu-icon" aria-hidden="true">↺</span>
        <span className="home-menu-copy"><strong>復習する</strong><span>もう一度解いて、理解を深めよう。</span></span>
        <span className="home-menu-arrow" aria-hidden="true">→</span>
      </button>
      <button className="home-menu-card" type="button" disabled={!extraAvailable} onClick={extraAvailable ? onExtra : undefined}>
        <span className="home-menu-icon" aria-hidden="true">⤨</span>
        <span className="home-menu-copy"><strong>エクストラ{!extraAvailable && <span className="home-status">準備中</span>}</strong><span>分野も難易度もランダムに挑戦。</span></span>
        <span className="home-menu-arrow" aria-hidden="true">→</span>
      </button>
      <button className="home-menu-card" type="button" disabled={!mockAvailable} onClick={mockAvailable ? onMock : undefined}>
        <span className="home-menu-icon" aria-hidden="true">◷</span>
        <span className="home-menu-copy"><strong>模擬試験{!mockAvailable && <span className="home-status">準備中</span>}</strong><span>時間を意識して、非言語の力試し。</span></span>
        <span className="home-menu-arrow" aria-hidden="true">→</span>
      </button>
    </nav>

    <button className="home-performance" type="button" onClick={onPerformance}>
      <span className="home-performance-icon" aria-hidden="true">▥</span><span><strong>学習のあしあと</strong><span>これまでの成績を振り返る</span></span><span className="home-performance-link">成績を見る <span aria-hidden="true">→</span></span>
    </button>
    <p className="home-footnote">現在は非言語に対応しています。言語は準備中です。</p>
  </section>
}
