export type Difficulty = 'easy' | 'normal' | 'hard'

/** このアプリでメインとして扱うSPI非言語8分野 */
export type ProblemCategory = '推論' | '場合の数' | '確率' | '集合' | '損益算' | '速度算' | '割合' | '表の読み取り'

export type SpiProblem = {
  id: string
  category: ProblemCategory
  question: string
  choices: string[]
  answer: string
  explanation: string
  difficulty: Difficulty
  tables?: { title: string; headers: string[]; rows: string[][] }[]
}

export const PROBLEM_CATEGORIES: ProblemCategory[] = [
  '推論', '場合の数', '確率', '集合', '損益算', '速度算', '割合', '表の読み取り',
]

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T,>(items: T[]) => items[randomInt(0, items.length - 1)]
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5)
const format = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')

const createChoices = (answer: number, unit = '', step = 1) => {
  const values = new Set<number>([answer])
  for (const offset of shuffle([-3, -2, -1, 1, 2, 3])) {
    const candidate = Number((answer + offset * step).toFixed(2))
    if (candidate > 0) values.add(candidate)
    if (values.size === 4) break
  }
  return shuffle([...values]).map((value) => `${format(value)}${unit}`)
}

const buildProblem = (category: ProblemCategory, difficulty: Difficulty, question: string, answer: number, explanation: string, unit = '', step = 1): SpiProblem => ({
  id: `${category}-${Date.now()}-${randomInt(1000, 9999)}`,
  category,
  difficulty,
  question,
  choices: createChoices(answer, unit, step),
  answer: `${format(answer)}${unit}`,
  explanation,
})

const generateInference = (difficulty: Difficulty): SpiProblem => {
  const first = randomInt(3, 8)
  const second = randomInt(2, 6)
  const answer = first + second
  return buildProblem('推論', difficulty, `AはBより${first}歳年上で、CはBより${second}歳年下です。AとCの年齢差は何歳ですか。`, answer, `AとCの年齢差は、${first} + ${second} = ${answer}歳です。`, '歳')
}

const generateCases = (difficulty: Difficulty): SpiProblem => {
  const shirts = randomInt(3, 6)
  const pants = randomInt(2, 4)
  const answer = shirts * pants
  return buildProblem('場合の数', difficulty, `シャツ${shirts}種類とパンツ${pants}種類から1つずつ選ぶと、組み合わせは何通りありますか。`, answer, `${shirts} × ${pants} = ${answer}通りです。`, '通り')
}

const generateProbability = (difficulty: Difficulty): SpiProblem => {
  const red = randomInt(2, 5)
  const blue = randomInt(2, 5)
  const answer = red / (red + blue) * 100
  return buildProblem('確率', difficulty, `赤玉${red}個、青玉${blue}個が入った袋から1個取り出すとき、赤玉である確率は何%ですか。`, answer, `赤玉${red}個 ÷ 全部${red + blue}個 × 100 = ${format(answer)}%です。`, '%', 5)
}

const generateSet = (difficulty: Difficulty): SpiProblem => {
  const total = randomInt(30, 60)
  const both = randomInt(5, 12)
  const groupA = randomInt(12, 20)
  const groupB = randomInt(12, 20)
  const answer = total - (groupA + groupB - both)
  return buildProblem('集合', difficulty, `${total}人のうち、Aに属する人は${groupA}人、Bに属する人は${groupB}人、両方に属する人は${both}人です。どちらにも属さない人は何人ですか。`, answer, `AまたはBは${groupA} + ${groupB} - ${both} = ${groupA + groupB - both}人。${total} - ${groupA + groupB - both} = ${answer}人です。`, '人')
}

const generateProfitLoss = (difficulty: Difficulty): SpiProblem => {
  const cost = randomInt(4, 16) * 500
  const rate = pick([10, 20, 25, 30, 40])
  const answer = cost * (1 + rate / 100)
  return buildProblem('損益算', difficulty, `原価${cost}円の商品に、原価の${rate}%の利益を加えると売価はいくらですか。`, answer, `${cost} × (1 + ${rate} ÷ 100) = ${format(answer)}円です。`, '円', 50)
}

const generateSpeed = (difficulty: Difficulty): SpiProblem => {
  const pattern = pick(['basic', 'minute', 'roundTrip'] as const)
  if (pattern === 'minute') {
    const speed = randomInt(50, 100)
    const time = randomInt(10, 30)
    const answer = speed * time
    return buildProblem('速度算', difficulty, `分速${speed}mで${time}分歩くと、何m進みますか。`, answer, `道のり = 速さ × 時間 = ${speed} × ${time} = ${answer}mです。`, 'm', speed)
  }
  if (pattern === 'roundTrip') {
    const distance = randomInt(2, 6) * 20
    const going = randomInt(3, 6) * 10
    const returning = going - 10
    const answer = distance / going + distance / returning
    return buildProblem('速度算', difficulty, `片道${distance}kmの道を、行きは時速${going}km、帰りは時速${returning}kmで往復しました。所要時間は何時間ですか。`, answer, `往路は${distance} ÷ ${going}時間、復路は${distance} ÷ ${returning}時間。合計は${format(answer)}時間です。`, '時間', .1)
  }
  const speed = randomInt(3, 12) * 10
  const time = randomInt(2, 6)
  const answer = speed * time
  return buildProblem('速度算', difficulty, `時速${speed}kmで${time}時間進むと、何km進みますか。`, answer, `道のり = 速さ × 時間 = ${speed} × ${time} = ${answer}kmです。`, 'km', speed / 2)
}

const generatePercentage = (difficulty: Difficulty): SpiProblem => {
  const base = randomInt(4, 20) * 50
  const rate = pick([10, 15, 20, 25, 30, 40, 50])
  const answer = base * rate / 100
  return buildProblem('割合', difficulty, `${base}人の${rate}%は何人ですか。`, answer, `${base} × ${rate} ÷ 100 = ${format(answer)}人です。`, '人')
}

const generateTable = (difficulty: Difficulty): SpiProblem => {
  const applicants = [randomInt(80, 160), randomInt(100, 200), randomInt(120, 240)]
  const rates = [pick([20, 25, 30]), pick([20, 25, 30]), pick([25, 30, 40])]
  const answer = applicants[1] * rates[1] / 100 + applicants[2] * rates[2] / 100
  const problem = buildProblem('表の読み取り', difficulty, '次の2つの表を見て、B支店とC支店の合格者数の合計を求めてください。', answer, `B支店は${applicants[1]} × ${rates[1]} ÷ 100 = ${applicants[1] * rates[1] / 100}人、C支店は${applicants[2]} × ${rates[2]} ÷ 100 = ${applicants[2] * rates[2] / 100}人。合計は${format(answer)}人です。`, '人')
  problem.tables = [
    {
      title: '表1　支店別の応募者数',
      headers: ['支店', 'A支店', 'B支店', 'C支店'],
      rows: [['応募者数', `${applicants[0]}人`, `${applicants[1]}人`, `${applicants[2]}人`]],
    },
    {
      title: '表2　支店別の合格率',
      headers: ['支店', 'A支店', 'B支店', 'C支店'],
      rows: [['合格率', `${rates[0]}%`, `${rates[1]}%`, `${rates[2]}%`]],
    },
  ]
  return problem
}

const generators: Record<ProblemCategory, (difficulty: Difficulty) => SpiProblem> = {
  推論: generateInference,
  '場合の数': generateCases,
  確率: generateProbability,
  集合: generateSet,
  損益算: generateProfitLoss,
  速度算: generateSpeed,
  割合: generatePercentage,
  '表の読み取り': generateTable,
}

/** カテゴリを指定しない場合は、メイン8分野からランダムに1問生成します。 */
export const generateProblem = (category?: ProblemCategory, difficulty: Difficulty = 'normal') => {
  const selectedCategory = category ?? pick(PROBLEM_CATEGORIES)
  return generators[selectedCategory](difficulty)
}

export const generateProblems = (count: number, options: { category?: ProblemCategory; difficulty?: Difficulty } = {}) => {
  if (!Number.isInteger(count) || count < 1) throw new Error('問題数は1以上の整数を指定してください。')
  return Array.from({ length: count }, () => generateProblem(options.category, options.difficulty))
}
