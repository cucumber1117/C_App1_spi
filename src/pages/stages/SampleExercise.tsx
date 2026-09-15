import { useEffect, useRef, useState } from 'react'
import type { Track } from './StageMap'
import InkMemo, { InkPreview, isInk, type Ink } from './InkMemo'
import './exercise.css'

type SampleQuestion = { question: string; choices: string[]; correct: number; explanation: string }
const numeric: SampleQuestion[] = [
  { question: '定価2,000円の商品を20%引きで購入しました。支払額はいくらですか。', choices: ['1,400円', '1,600円', '1,800円', '2,400円'], correct: 1, explanation: '20%引きは、定価の80%。2,000 × 0.8 = 1,600円です。' },
  { question: '時速60kmで2時間進むと、何km進みますか。', choices: ['30km', '60km', '120km', '180km'], correct: 2, explanation: '道のり = 速さ × 時間。60 × 2 = 120kmです。' },
  { question: '赤玉3個、青玉2個が入った袋から1個取り出すとき、赤玉である確率は何%ですか。', choices: ['20%', '40%', '50%', '60%'], correct: 3, explanation: '赤玉3個 ÷ 全部5個 × 100 = 60%です。' },
  { question: '5人の中から委員を2人選ぶ方法は何通りありますか。', choices: ['10通り', '15通り', '20通り', '25通り'], correct: 0, explanation: '5 × 4 ÷ 2 = 10通り。同じ2人を選ぶ順序は区別しません。' },
  { question: '原価1,000円の商品に、原価の30%の利益を加えると売価はいくらですか。', choices: ['1,030円', '1,300円', '1,500円', '3,000円'], correct: 1, explanation: '利益は1,000 × 0.3 = 300円。売価は1,000 + 300 = 1,300円です。' },
  { question: '40人のうち、Aに属する人は20人、Bに属する人は15人、両方に属する人は5人です。どちらにも属さない人は何人ですか。', choices: ['5人', '15人', '10人', '20人'], correct: 2, explanation: 'AまたはBは20 + 15 − 5 = 30人。どちらにも属さない人は40 − 30 = 10人です。' },
  { question: '80人の25%は何人ですか。', choices: ['10人', '15人', '25人', '20人'], correct: 3, explanation: '25%は4分の1。80 ÷ 4 = 20人です。' },
  { question: 'シャツ3種類とズボン4種類から1つずつ選ぶと、組み合わせは何通りありますか。', choices: ['12通り', '7通り', '9通り', '16通り'], correct: 0, explanation: 'シャツの各3種類にズボン4種類を合わせられるので、3 × 4 = 12通りです。' },
  { question: 'AはBより5歳年上で、CはBより3歳年下です。AとCの年齢差は何歳ですか。', choices: ['2歳', '8歳', '5歳', '15歳'], correct: 1, explanation: 'Bを基準に、Aは5歳上、Cは3歳下。年齢差は5 + 3 = 8歳です。' },
  { question: '昨年の売上200万円から今年は10%増加しました。今年の売上はいくらですか。', choices: ['210万円', '240万円', '220万円', '300万円'], correct: 2, explanation: '増加分は200 × 0.1 = 20万円。今年は200 + 20 = 220万円です。' },
]
const verbal: SampleQuestion[] = [
  { question: '「慎重」の反対の意味に最も近い言葉を選んでください。', choices: ['軽率', '丁寧', '用心', '緻密'], correct: 0, explanation: '慎重は注意深いこと。軽率は深く考えずに行動することです。' },
  { question: '「迅速」と最も近い意味の言葉を選んでください。', choices: ['静か', 'すばやい', '正確', '穏やか'], correct: 1, explanation: '迅速は物事の進み方や行動が非常に速いことです。' },
  { question: '「医師：病院」と同じ関係になる組を選んでください。', choices: ['教師：教科書', '教師：授業', '教師：学校', '教師：生徒'], correct: 2, explanation: '職業と、その人が働く場所の関係です。' },
  { question: '「雨が降った。（　）、試合は中止になった。」空欄に最も適切な言葉を選んでください。', choices: ['しかし', 'たとえば', '一方', 'そのため'], correct: 3, explanation: '前の文の原因を受け、後の文で結果を述べています。' },
  { question: '「妥当」の意味として最も適切なものを選んでください。', choices: ['事情によく合って適切であること', '時間がかかること', '珍しく目立つこと', '強い意志を持つこと'], correct: 0, explanation: '妥当は、その状況や道理に合っていることを意味します。' },
  { question: '「拡大」の反対の意味に最も近い言葉を選んでください。', choices: ['増加', '縮小', '延長', '発展'], correct: 1, explanation: '拡大は大きくすること。縮小は小さくすることです。' },
  { question: '「読書：本」と同じ関係になる組を選んでください。', choices: ['鑑賞：劇場', '鑑賞：休日', '鑑賞：絵画', '鑑賞：観客'], correct: 2, explanation: '行為と、その対象となるものの関係です。' },
  { question: '「努力した。（　）、目標には届かなかった。」空欄に最も適切な言葉を選んでください。', choices: ['したがって', 'つまり', 'なぜなら', 'しかし'], correct: 3, explanation: '前の内容から予想される結果と異なるため、逆接の「しかし」が適切です。' },
  { question: '「概略」の意味として最も適切なものを選んでください。', choices: ['大まかな内容', '細かな手順', '厳密な数値', '例外の一覧'], correct: 0, explanation: '概略は、細部を省いた大まかな内容やあらましを意味します。' },
  { question: '「彼は毎朝走っている。雨の日は室内で運動する。」この文章から確実に読み取れることを選んでください。', choices: ['雨の日は運動を休む', '雨の日も運動する', '毎朝同じ道を走る', '室内では必ず走る'], correct: 1, explanation: '雨の日は室内で運動すると明記されています。室内で何をするかまでは書かれていません。' },
]
type Session = { version: 1; questions: SampleQuestion[]; answers: number[]; selected: number | null; index: number; notes: string[]; review: boolean; ink?: (Ink | null)[] }
const fresh = (track: Track): Session => ({ version: 1, questions: track === 'verbal' ? verbal : numeric, answers: [], selected: null, index: 0, notes: Array(10).fill(''), review: false })
function restore(key: string, track: Track): Session {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null') as Session | null
    if (value?.version === 1 && Array.isArray(value.questions) && value.questions.length === 10 && value.questions.every(q => typeof q.question === 'string' && typeof q.explanation === 'string' && Array.isArray(q.choices) && q.choices.length === 4 && q.choices.every(c => typeof c === 'string') && Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4)
      && Array.isArray(value.answers) && value.answers.every(a => Number.isInteger(a) && a >= 0 && a < 4) && Number.isInteger(value.index) && value.index >= 0 && value.index <= 10 && value.answers.length >= value.index && value.answers.length <= Math.min(value.index + 1, 10)
      && (value.selected === null || Number.isInteger(value.selected) && value.selected >= 0 && value.selected < 4) && Array.isArray(value.notes) && value.notes.length === 10 && value.notes.every(n => typeof n === 'string') && typeof value.review === 'boolean') return value
  } catch { /* Invalid preview data starts a fresh sample session. */ }
  return fresh(track)
}

export default function SampleExercise({ stageId, track, onExit, onComplete }: { stageId: string; track: Track; onExit: () => void; onComplete: (score: number) => void }) {
  const key = `spi-ui-sample-v1:${stageId}`
  const [session, setSession] = useState(() => { const saved = restore(key, track); return { ...saved, ink: Array.from({ length: 10 }, (_, i) => isInk(saved.ink?.[i]) ? saved.ink![i] : null) } })
  const [saveError, setSaveError] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const feedback = useRef<HTMLDialogElement>(null)
  const [hiddenFeedback, setHiddenFeedback] = useState<number | null>(null)
  // Storage is an external system; the warning reflects the outcome of that synchronization.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(session)); setSaveError(false) } catch { setSaveError(true) } }, [key, session])
  useEffect(() => { heading.current?.focus(); window.scrollTo(0, 0) }, [session.index])
  const score = session.answers.reduce((sum, answer, i) => sum + Number(answer === session.questions[i].correct), 0)
  const finished = session.index === 10
  const q = session.questions[Math.min(session.index, 9)]
  const answered = session.answers.length > session.index
  const showFeedback = answered && hiddenFeedback !== session.index
  useEffect(() => {
    const dialog = feedback.current
    if (!showFeedback || !dialog) return
    dialog.showModal()
    return () => dialog.close()
  }, [showFeedback, session.index])
  const correct = answered && session.answers[session.index] === q.correct
  const label = stageId.includes('-check-') ? 'CHECK' : `STAGE ${stageId.split('-').at(-1)?.padStart(2, '0')}`
  return <main className="sample-exercise">
    <div className="sample-top"><button type="button" onClick={onExit}>閉じる</button><span>{label}</span><span>{finished ? 'RESULT' : `${session.index + 1} / 10`}</span></div>
    {saveError && <p role="alert">この端末に保存できませんでした。閉じると進行が失われる場合があります。</p>}
    {!finished ? <>
      <progress aria-label="回答済みの問題数" max={10} value={session.answers.length} />
      <InkMemo key={session.index} ink={session.ink?.[session.index] ?? undefined} onChange={ink => setSession(s => ({ ...s, ink: Array.from({ length: 10 }, (_, i) => i === s.index ? ink : s.ink?.[i] ?? null) }))} />
      <h1 ref={heading} tabIndex={-1} className="sample-question">{q.question}</h1>
      <div className="sample-choices" role="group" aria-label="選択肢">
        {q.choices.map((choice, i) => <button key={choice} type="button" disabled={answered} aria-pressed={session.selected === i}
          className={`${session.selected === i ? 'sample-selected' : ''} ${answered && i === q.correct ? 'sample-correct' : ''}`}
          onClick={() => setSession(s => ({ ...s, selected: i }))}><span>{String.fromCharCode(65 + i)}</span>{choice}{answered && i === q.correct && <small>正解</small>}</button>)}
      </div>
      <details className="sample-memo"><summary>メモ</summary><textarea aria-label="この問題のメモ" placeholder="計算や気づきを残す" value={session.notes[session.index]} onChange={e => { const text = e.target.value; setSession(s => ({ ...s, notes: s.notes.map((n, i) => i === s.index ? text : n) })) }} /></details>
      {showFeedback && <dialog ref={feedback} className="sample-feedback-sheet" aria-labelledby="sample-feedback-title" aria-describedby="sample-feedback-explanation" onCancel={() => setHiddenFeedback(session.index)}>
        <div className="sample-feedback-body"><h2 id="sample-feedback-title">{correct ? '正解！' : '答えを確認しよう'}</h2><p className="sample-answer">正解：{q.choices[q.correct]}</p><p id="sample-feedback-explanation">{q.explanation}</p></div>
        <div className="sample-feedback-actions"><button type="button" className="sample-feedback-next" autoFocus onClick={() => { feedback.current?.close(); setHiddenFeedback(null); setSession(s => ({ ...s, index: s.index + 1, selected: null })) }}>{session.index === 9 ? '結果を見る' : '次の問題へ'} →</button><button type="button" className="sample-feedback-back" onClick={() => setHiddenFeedback(session.index)}>問題を見返す</button></div>
      </dialog>}
      <div className="sample-action">{answered ? <button type="button" onClick={() => setHiddenFeedback(null)}>解説を見る</button>
        : <button type="button" disabled={session.selected === null} onClick={() => setSession(s => s.selected === null || s.answers.length > s.index ? s : ({ ...s, answers: [...s.answers, s.selected] }))}>回答する</button>}</div>
      <p className="sample-save">{saveError ? 'この画面を開いている間は続けられます。' : '自動保存 · 閉じても、このステージから再開できます。'}</p>
    </> : <section className="sample-result"><p>おつかれさま！</p><h1 ref={heading} tabIndex={-1}>{score === 10 ? 'PERFECT!' : score >= 6 ? 'CLEAR' : '最後までできました'}</h1><p className="sample-score">{score}<span> / 10</span></p>
      {(score <= 6 || session.review) && <p>復習の候補にしました（サンプル）</p>}
      <div className="sample-action"><button type="button" onClick={() => { try { localStorage.removeItem(key) } catch { /* Keep in-memory navigation available. */ } onComplete(score) }}>次へ →</button></div>
      {score >= 7 && score <= 9 && !session.review && <button className="sample-link" type="button" onClick={() => setSession(s => ({ ...s, review: true }))}>＋ 復習に追加</button>}
      <details className="sample-review"><summary>今回の問題を振り返る</summary>{session.questions.map((question, i) => <article key={i}><h2>{i + 1}. {question.question}</h2><p>あなたの回答：{question.choices[session.answers[i]]}</p><p>正解：{question.choices[question.correct]}</p><p>{question.explanation}</p>{session.notes[i] && <p>メモ：{session.notes[i]}</p>}{session.ink?.[i]?.strokes.length ? <InkPreview ink={session.ink[i]!} /> : null}</article>)}</details>
      <button type="button" className="sample-link" onClick={() => setSession({ ...fresh(track), ink: Array(10).fill(null) })}>もう一度（同じサンプル問題）</button>
    </section>}
  </main>
}
