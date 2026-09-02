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

const validateProblem = (problem: SpiProblem, answer: number, unit: string) => {
  if (problem.choices.length !== 4 || new Set(problem.choices).size !== 4) {
    throw new Error('選択肢は重複しない4つの候補が必要です。')
  }
  if (!problem.choices.includes(problem.answer)) {
    throw new Error('正解が選択肢に含まれていません。')
  }
  if (['人', '個', '匹', '通り', '歳'].includes(unit) && !Number.isInteger(answer)) {
    throw new Error(`${unit}を単位にする答えは整数である必要があります。`)
  }
}

const buildProblem = (category: ProblemCategory, difficulty: Difficulty, question: string, answer: number, explanation: string, unit = '', step = 1): SpiProblem => {
  const problem: SpiProblem = {
    id: `${category}-${Date.now()}-${randomInt(1000, 9999)}`,
    category,
    difficulty,
    question,
    choices: createChoices(answer, unit, step),
    answer: `${format(answer)}${unit}`,
    explanation,
  }
  validateProblem(problem, answer, unit)
  return problem
}

const generateInference = (difficulty: Difficulty): SpiProblem => {
  const first = randomInt(3, 8)
  const second = randomInt(2, 6)
  const answer = first + second
  return buildProblem('推論', difficulty, `AはBより${first}歳年上で、CはBより${second}歳年下です。AとCの年齢差は何歳ですか。`, answer, `AとCの年齢差は、${first} + ${second} = ${answer}歳です。`, '歳')
}

const generateInferenceOrder = (difficulty: Difficulty): SpiProblem => {
  const people = ['A', 'B', 'C', 'D']
  const answer = randomInt(1, 4)
  return buildProblem('推論', difficulty, `${people[(answer + 1) % 4]}は${people[answer % 4]}より前、${people[(answer + 2) % 4]}は${people[(answer + 1) % 4]}より後ろに並んでいます。${people[answer % 4]}が${answer}番目のとき、${people[(answer + 1) % 4]}は何番目ですか。`, answer + 1, `条件より、${people[(answer + 1) % 4]}は${answer}番目の次なので${answer + 1}番目です。`, '番目')
}

const generateCases = (difficulty: Difficulty): SpiProblem => {
  const shirts = randomInt(3, 6)
  const pants = randomInt(2, 4)
  const answer = shirts * pants
  return buildProblem('場合の数', difficulty, `シャツ${shirts}種類とパンツ${pants}種類から1つずつ選ぶと、組み合わせは何通りありますか。`, answer, `${shirts} × ${pants} = ${answer}通りです。`, '通り')
}

const generateCasesCommittee = (difficulty: Difficulty): SpiProblem => {
  const people = randomInt(5, 9)
  const answer = people * (people - 1) / 2
  return buildProblem('場合の数', difficulty, `${people}人の中から、委員を2人選ぶ方法は何通りありますか。`, answer, `${people}C2 = ${people} × ${people - 1} ÷ 2 = ${answer}通りです。`, '通り')
}

const generateCasesArrangement = (difficulty: Difficulty): SpiProblem => {
  const people = randomInt(4, 6)
  const answer = people * (people - 1)
  return buildProblem('場合の数', difficulty, `${people}人の中から、司会と記録係を1人ずつ選ぶ方法は何通りありますか。`, answer, `司会の${people}通りに対し、記録係は${people - 1}通り。${people} × ${people - 1} = ${answer}通りです。`, '通り')
}

const generateProbability = (difficulty: Difficulty): SpiProblem => {
  const red = randomInt(2, 5)
  const blue = randomInt(2, 5)
  const answer = red / (red + blue) * 100
  return buildProblem('確率', difficulty, `赤玉${red}個、青玉${blue}個が入った袋から1個取り出すとき、赤玉である確率は何%ですか。`, answer, `赤玉${red}個 ÷ 全部${red + blue}個 × 100 = ${format(answer)}%です。`, '%', 5)
}

const generateProbabilityTwoDraws = (difficulty: Difficulty): SpiProblem => {
  const red = randomInt(2, 4)
  const blue = randomInt(2, 4)
  const total = red + blue
  const answer = red / total * (red - 1) / (total - 1) * 100
  return buildProblem('確率', difficulty, `赤玉${red}個、青玉${blue}個が入った袋から、玉を戻さず2個続けて取り出します。2個とも赤玉である確率は何%ですか。`, answer, `${red} ÷ ${total} × ${red - 1} ÷ ${total - 1} × 100 = ${format(answer)}%です。`, '%', 5)
}

const generateProbabilityDice = (difficulty: Difficulty): SpiProblem => {
  const target = pick([7, 8, 9, 10])
  const answer = (6 - Math.abs(7 - target)) / 36 * 100
  return buildProblem('確率', difficulty, `サイコロを2個同時に投げたとき、目の和が${target}になる確率は何%ですか。`, answer, `和が${target}になる組み合わせは${6 - Math.abs(7 - target)}通り。${6 - Math.abs(7 - target)} ÷ 36 × 100 = ${format(answer)}%です。`, '%', 5)
}

const generateSet = (difficulty: Difficulty): SpiProblem => {
  const total = randomInt(30, 60)
  const both = randomInt(5, 12)
  const groupA = randomInt(12, 20)
  const groupB = randomInt(12, 20)
  const answer = total - (groupA + groupB - both)
  return buildProblem('集合', difficulty, `${total}人のうち、Aに属する人は${groupA}人、Bに属する人は${groupB}人、両方に属する人は${both}人です。どちらにも属さない人は何人ですか。`, answer, `AまたはBは${groupA} + ${groupB} - ${both} = ${groupA + groupB - both}人。${total} - ${groupA + groupB - both} = ${answer}人です。`, '人')
}

const generateSetThreeGroups = (difficulty: Difficulty): SpiProblem => {
  const onlyA = randomInt(10, 20)
  const onlyB = randomInt(10, 20)
  const onlyC = randomInt(10, 20)
  const overlaps = randomInt(5, 10)
  const outside = randomInt(10, 20)
  const total = onlyA + onlyB + onlyC + overlaps + outside
  const answer = total - onlyA - onlyB - onlyC - overlaps
  return buildProblem('集合', difficulty, `${total}人を調査したところ、Aだけの人が${onlyA}人、Bだけが${onlyB}人、Cだけが${onlyC}人、2つ以上に属する人が${overlaps}人でした。どれにも属さない人は何人ですか。`, answer, `${total} - (${onlyA} + ${onlyB} + ${onlyC} + ${overlaps}) = ${answer}人です。`, '人')
}

const generateSetSurvey = (difficulty: Difficulty): SpiProblem => {
  const total = randomInt(50, 80)
  const tea = randomInt(25, 40)
  const coffee = randomInt(20, 35)
  const both = randomInt(8, 15)
  const answer = tea + coffee - both
  return buildProblem('集合', difficulty, `${total}人に調査したところ、紅茶を飲む人は${tea}人、コーヒーを飲む人は${coffee}人、両方飲む人は${both}人でした。少なくともどちらかを飲む人は何人ですか。`, answer, `${tea} + ${coffee} - ${both} = ${answer}人です。`, '人')
}

const generateProfitLoss = (difficulty: Difficulty): SpiProblem => {
  const cost = randomInt(4, 16) * 500
  const rate = pick([10, 20, 25, 30, 40])
  const answer = cost * (1 + rate / 100)
  return buildProblem('損益算', difficulty, `原価${cost}円の商品に、原価の${rate}%の利益を加えると売価はいくらですか。`, answer, `${cost} × (1 + ${rate} ÷ 100) = ${format(answer)}円です。`, '円', 50)
}

const generateProfitLossDiscount = (difficulty: Difficulty): SpiProblem => {
  const cost = randomInt(4, 8) * 1000
  const markup = pick([20, 25, 30])
  const discount = pick([10, 20])
  const answer = cost * (1 + markup / 100) * (1 - discount / 100)
  return buildProblem('損益算', difficulty, `原価${cost}円に${markup}%の利益を加えた定価から、${discount}%引きで販売しました。売価はいくらですか。`, answer, `${cost} × 1.${markup === 20 ? '2' : markup === 25 ? '25' : '3'} × 0.${discount === 10 ? '9' : '8'} = ${format(answer)}円です。`, '円', 50)
}

const generateProfitLossReverse = (difficulty: Difficulty): SpiProblem => {
  const rate = pick([20, 25, 30])
  const base = rate === 20 ? 6000 : rate === 25 ? 5000 : 6500
  const price = base * randomInt(1, 2)
  const answer = price / (1 + rate / 100)
  return buildProblem('損益算', difficulty, `原価に${rate}%の利益を加えて${price}円で販売しました。原価はいくらですか。`, answer, `${price} ÷ (1 + ${rate} ÷ 100) = ${format(answer)}円です。`, '円', 50)
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

const generatePercentageDiscount = (difficulty: Difficulty): SpiProblem => {
  const price = randomInt(4, 12) * 500
  const rate = pick([10, 20, 25])
  const answer = price * (1 - rate / 100)
  return buildProblem('割合', difficulty, `定価${price}円の商品を${rate}%引きで購入しました。支払額はいくらですか。`, answer, `${price} × (1 - ${rate} ÷ 100) = ${format(answer)}円です。`, '円', 50)
}

const generatePercentageChange = (difficulty: Difficulty): SpiProblem => {
  const original = randomInt(4, 12) * 100
  const rate = pick([10, 20, 25])
  const answer = original * (1 + rate / 100)
  return buildProblem('割合', difficulty, `昨年の売上${original}万円から今年は${rate}%増加しました。今年の売上はいくらですか。`, answer, `${original} × (1 + ${rate} ÷ 100) = ${format(answer)}万円です。`, '万円', 10)
}

const generateTableCrossReference = (difficulty: Difficulty): SpiProblem => {
  const cApplicants = randomInt(4, 7) * 100
  const applicants = [randomInt(3, 5) * 100, cApplicants + randomInt(1, 3) * 100, cApplicants]
  const generalShare = [50, 50, 50]
  const passRates = [20, 25, 20]
  const bGeneralPassers = applicants[1] * generalShare[1] / 100 * passRates[1] / 100
  const cGeneralPassers = applicants[2] * generalShare[2] / 100 * passRates[2] / 100
  const answer = bGeneralPassers - cGeneralPassers
  const problem = buildProblem('表の読み取り', difficulty, '次の2つの表を見て、B支店とC支店の一般職合格者数の差を求めてください。', answer, `B支店は${applicants[1]} × ${generalShare[1]}% × ${passRates[1]}% = ${bGeneralPassers}人、C支店は${applicants[2]} × ${generalShare[2]}% × ${passRates[2]}% = ${cGeneralPassers}人。差は${bGeneralPassers} - ${cGeneralPassers} = ${answer}人です。`, '人')
  problem.tables = [
    {
      title: '表1　支店別の応募者数と職種構成',
      headers: ['支店', 'A支店', 'B支店', 'C支店'],
      rows: [['応募者数', ...applicants.map((value) => `${value}人`)], ['一般職の割合', ...generalShare.map((value) => `${value}%`)]],
    },
    {
      title: '表2　支店別の合格率',
      headers: ['支店', 'A支店', 'B支店', 'C支店'],
      rows: [['合格率', ...passRates.map((value) => `${value}%`)]],
    },
  ]
  return problem
}

const generateTableAverage = (difficulty: Difficulty): SpiProblem => {
  const departments = ['営業部', '企画部', '開発部']
  const people = [randomInt(8, 16), randomInt(8, 16), randomInt(8, 16)]
  const scores = [randomInt(60, 85), randomInt(65, 90), randomInt(70, 95)]
  const target = pick([0, 1, 2])
  const answer = scores[target]
  const problem = buildProblem('表の読み取り', difficulty, `次の表は各部署の人数と3回のテストの平均点です。${departments[target]}の3回のテストの合計点は何点ですか。`, answer * 3, `${departments[target]}の平均点${answer}点 × 3回 = ${answer * 3}点です。`, '点', 3)
  problem.tables = [{
    title: '部署別テスト結果',
    headers: ['部署', ...departments],
    rows: [['人数', ...people.map((value) => `${value}人`)], ['3回の平均点', ...scores.map((value) => `${value}点`)]],
  }]
  return problem
}

const generateTableGrowth = (difficulty: Difficulty): SpiProblem => {
  const years = ['2023年', '2024年', '2025年']
  const sales = [randomInt(40, 80) * 10, randomInt(50, 90) * 10, randomInt(60, 100) * 10]
  const target = pick([1, 2])
  const answer = (sales[target] - sales[target - 1]) / sales[target - 1] * 100
  const problem = buildProblem('表の読み取り', difficulty, `${years[target - 1]}から${years[target]}への売上の増加率は何%ですか。`, answer, `(${sales[target]} - ${sales[target - 1]}) ÷ ${sales[target - 1]} × 100 = ${format(answer)}%です。`, '%', 5)
  problem.tables = [{
    title: '年度別売上（単位：万円）',
    headers: ['年度', ...years],
    rows: [['売上', ...sales.map((value) => `${value}万円`)]],
  }]
  return problem
}

const generateTablePriceQuantity = (difficulty: Difficulty): SpiProblem => {
  const products = ['商品A', '商品B', '商品C']
  const prices = [randomInt(4, 9) * 100, randomInt(5, 12) * 100, randomInt(6, 15) * 100]
  const quantities = [randomInt(2, 6), randomInt(2, 6), randomInt(2, 6)]
  const totals = prices.map((price, index) => price * quantities[index])
  const answer = totals[0] + totals[1] + totals[2]
  const problem = buildProblem('表の読み取り', difficulty, '次の表の商品をすべて販売したとき、売上の合計はいくらですか。', answer, `商品ごとの売上は${totals.map((value) => format(value)).join('円、')}円。合計は${format(answer)}円です。`, '円', 100)
  problem.tables = [{
    title: '商品別の価格と販売数量',
    headers: ['商品', ...products],
    rows: [['1個あたりの価格', ...prices.map((value) => `${value}円`)], ['販売数量', ...quantities.map((value) => `${value}個`)]],
  }]
  return problem
}

const generateTable = (difficulty: Difficulty): SpiProblem =>
  pick([generateTableCrossReference, generateTableAverage, generateTableGrowth, generateTablePriceQuantity])(difficulty)

const generators: Record<ProblemCategory, (difficulty: Difficulty) => SpiProblem> = {
  推論: (difficulty) => pick([generateInference, generateInferenceOrder])(difficulty),
  '場合の数': (difficulty) => pick([generateCases, generateCasesCommittee, generateCasesArrangement])(difficulty),
  確率: (difficulty) => pick([generateProbability, generateProbabilityTwoDraws, generateProbabilityDice])(difficulty),
  集合: (difficulty) => pick([generateSet, generateSetThreeGroups, generateSetSurvey])(difficulty),
  損益算: (difficulty) => pick([generateProfitLoss, generateProfitLossDiscount, generateProfitLossReverse])(difficulty),
  速度算: generateSpeed,
  割合: (difficulty) => pick([generatePercentage, generatePercentageDiscount, generatePercentageChange])(difficulty),
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
