import { int, numeric, pick } from './core'
import type { Difficulty, Draft, ProblemCategory, Table, Template } from './core'


const levels: Difficulty[] = ['easy', 'normal', 'hard']
function family(id: string, category: ProblemCategory, names: string[], create: (level: Difficulty) => Draft): Template[] {
  return levels.map((difficulty, i) => ({ id: `${id}-${difficulty}`, category, name: names[i], difficulty, create: () => create(difficulty) }))
}
const data = (title: string, rows: string[][]): Table[] => [{ title, headers: ['項目', '値'], rows }]

export const additionalTemplates: Template[] = [
  ...family('work', '仕事算', ['2台の共同処理', '先行作業と共同処理', '注水と途中からの排水'], level => {
    if (level !== 'hard') {
      const rateA = int(3, 8), rateB = int(4, 9), together = int(5, 15), lead = level === 'normal' ? int(3, 8) : 0
      const amount = (rateA + rateB) * together + rateA * lead
      const prefix = lead ? `最初にAだけを${lead}分動かし、その後Bも動かします。` : 'AとBを同時に動かし始めます。'
      return numeric(`装置Aは毎分${rateA}個、装置Bは毎分${rateB}個の部品を検査します。${amount}個を重複なく検査するとき、${prefix}作業開始からすべての検査が終わるまで何分ですか。処理速度は一定で、作業の切替時間は無視します。`, lead + together, '分', `先行作業で${rateA}×${lead}=${rateA * lead}個を処理します。残り${amount - rateA * lead}個を毎分${rateA + rateB}個で処理するので、全時間は${lead}+${amount - rateA * lead}÷${rateA + rateB}=${lead + together}分。`)
    }
    const inlet = int(8, 15), outlet = int(2, 6), lead = int(3, 8), after = int(5, 15), capacity = inlet * lead + (inlet - outlet) * after
    return numeric(`空のタンクに毎分${inlet}Lで注水を始めます。${lead}分後から毎分${outlet}Lの排水も始め、注水は続けます。容量${capacity}Lのタンクが満杯になるのは、注水開始から何分後ですか。流量は一定です。`, lead + after, '分', `排水開始までに${inlet * lead}Lたまります。その後の増加は毎分${inlet - outlet}Lなので、${lead}+(${capacity}−${inlet * lead})÷${inlet - outlet}=${lead + after}分です。`)
  }),
  ...family('installment', '分割払い', ['頭金と均等払い', '手数料を含む均等払い', '一部の支払額が異なる分割払い'], level => {
    const months = int(4, 10), downRate = pick([20, 30, 40]), feeRate = level === 'normal' ? pick([4, 6, 8]) : 0
    const multiple = level === 'hard' ? pick([2, 3]) : 1
    const divisor = months - 1 + multiple
    const price = divisor * int(2, 8) * 10000
    const down = price * downRate / 100, fee = price * feeRate / 100, payment = (price + fee - down) / divisor
    const terms = level === 'hard' ? `残りを${months}回に分け、最終回だけ他の各回の${multiple}倍支払います。手数料はありません。最終回以外の1回分はいくらですか。` : `商品価格の${feeRate}%の手数料を残額に加え、${months}回で均等に支払います。1回分はいくらですか。手数料の基準は頭金を引く前の商品価格です。`
    return numeric(`価格${price}円の商品を購入し、商品価格の${downRate}%を頭金として支払います。${terms}`, payment, '円', `頭金は${down}円、頭金後の残額と手数料の合計は${price}−${down}+${fee}=${price - down + fee}円です。${level === 'hard' ? `通常回を1口とすると合計${months - 1}+${multiple}=${divisor}口` : `${months}回で均等払い`}なので、1回分は${payment}円。`)
  }),
  ...family('settlement', '代金の精算', ['2人の立替精算', '3人の立替精算', '立替と既存の貸し借りの相殺'], level => {
    const share = int(10, 30) * 100, excess = int(2, 8) * 100
    if (level === 'normal') {
      const less = int(1, 5) * 100, paidA = share + excess + less, paidB = share - excess, paidC = share - less
      return numeric(`3人で共同利用する備品代を、Aが${paidA}円、Bが${paidB}円、Cが${paidC}円立て替えました。費用は3人で等分し、BとCがそれぞれAに送金して精算します。BからAへの送金額はいくらですか。`, excess, '円', `総額${3 * share}円を3人で割ると1人${share}円です。Bの不足額は${share}−${paidB}=${excess}円なので、この金額をAへ送ります。`)
    }
    const debt = level === 'hard' ? int(1, 9) * 100 : 0
    return numeric(`AとBで等分する共同購入費を、Aが${share + excess}円、Bが${share - excess}円立て替えました。${debt ? `これとは別に、Bは以前Aから借りた${debt}円をまだ返していません。今回の費用と借金をまとめて精算します。` : ''}BはAにいくら支払えばよいですか。`, excess + debt, '円', `共同購入費の1人分は${share}円です。Bの立替不足は${excess}円で、以前の借金${debt}円も加えると${excess + debt}円をAに支払います。`)
  }),
  ...family('integer', '整数条件', ['個数と合計金額', '整数制約と購入数の最大', '年齢比と経過年数'], level => {
    if (level === 'hard') {
      const years = int(4, 12), younger = years, older = younger * 2
      return numeric(`現在、Aの年齢はBの2倍です。${years}年後には、Aの年齢はBの年齢の3/2倍になります。現在のBは何歳ですか。年齢は満年齢とし、2人の年齢は同じ時点で比較します。`, younger, '歳', `Bをx歳とすると、2x+${years}=(x+${years})×3/2。両辺を2倍すると4x+${years * 2}=3x+${years * 3}となり、x=${younger}。現在A=${older}歳、B=${younger}歳です。`)
    }
    const cheap = int(2, 6) * 100, premium = cheap + int(1, 4) * 100, count = int(8, 18), high = int(2, count - 2)
    const remainder = level === 'normal' ? int(0, (premium - cheap) / 100 - 1) * 100 : 0
    const budget = count * cheap + high * (premium - cheap) + remainder
    return numeric(`1個${cheap}円の小箱と1個${premium}円の大箱を合わせて${count}個購入します。${level === 'easy' ? `合計金額が${budget}円のとき、大箱は何個ですか。` : `合計金額を${budget}円以下にするとき、大箱は最大何個買えますか。`}箱は整数個で購入します。`, high, '個', `すべて小箱なら${cheap * count}円です。大箱に1個替えるごとに${premium - cheap}円増えるので、(${budget}−${cheap * count})÷${premium - cheap}${level === 'normal' ? 'の整数部分' : ''}より${high}個です。`)
  }),
  ...family('flow', 'フローチャート', ['条件分岐の追跡', '繰返し処理の出力', '繰返し回数から入力を逆算'], level => {
    const threshold = int(15, 30), step = int(2, 6), initial = int(2, 12)
    if (level === 'easy') {
      const input = int(5, 40), output = input >= threshold ? input - step : input + step
      return numeric('次の処理手順を上から実行したとき、出力されるxの値はいくつですか。判定は1回だけ行います。', output, '', `入力${input}は${threshold}${input >= threshold ? '以上' : '未満'}なので、${input}${input >= threshold ? '−' : '+'}${step}=${output}を出力します。`, data('条件分岐の手順', [['開始', `xに${input}を入れる`], ['判定', `xが${threshold}以上か`], ['はい', `xから${step}を引く`], ['いいえ', `xに${step}を足す`], ['終了', 'xを出力する']]))
    }
    if (level === 'normal') {
      const repeats = Math.ceil((threshold - initial) / step), output = initial + repeats * step
      return numeric('表の手順を実行したとき、最後に出力されるxの値はいくつですか。判定は加算する前に毎回行います。', output, '', `${initial}から${step}ずつ増やし、初めて${threshold}以上になるまで${repeats}回加算します。${initial}+${step}×${repeats}=${output}です。`, data('繰返しの手順', [['開始', `xに${initial}を入れる`], ['判定', `xが${threshold}以上なら終了へ`], ['処理', `xに${step}を足して判定へ戻る`], ['終了', 'xを出力する']]))
    }
    const repeats = int(2, 4), limit = step * repeats + int(8, 20), min = limit - step * repeats
    return numeric(`表の処理で加算がちょうど${repeats}回行われました。最初に入れた非負整数xの最小値はいくつですか。判定は加算する前に毎回行います。`, min, '', `初期値をaとすると、${repeats - 1}回後にはa+${step * (repeats - 1)}<${limit}、${repeats}回後にはa+${step * repeats}≥${limit}です。したがって最小値は${min}です。`, data('入力を調べる手順', [['開始', 'xに非負整数を入れる'], ['判定', `xが${limit}以上なら終了へ`], ['処理', `xに${step}を足して判定へ戻る`], ['終了', 'xを出力する']]))
  }),
  ...family('region', 'グラフと不等式の領域', ['直線と整数座標', '2直線に挟まれた整数座標', '領域内の格子点の個数'], level => {
    const slope = int(1, 3), intercept = int(4, 10), x = int(2, 6), lower = int(1, 3)
    if (level === 'easy') return numeric(`座標平面で、直線y=${slope}x+${intercept}より下側（直線上を含まない）を考えます。x=${x}のとき、この領域にある整数yの最大値はいくつですか。`, slope * x + intercept - 1, '', `直線上のyは${slope}×${x}+${intercept}=${slope * x + intercept}。境界を含まないので、整数yの最大値は1小さい${slope * x + intercept - 1}です。`)
    if (level === 'normal') return numeric(`座標平面で、y≥x+${lower}かつy≤${slope + 1}x+${intercept}を満たす領域を考えます。x=${x}の直線上にある、この領域内の整数座標の点は何個ですか。両方の境界線上を含みます。`, slope * x + intercept - lower + 1, '個', `yの下限は${x + lower}、上限は${(slope + 1) * x + intercept}です。両端を含む整数の数は上限−下限+1=${slope * x + intercept - lower + 1}個。`)
    const limit = int(5, 10), cap = int(2, limit - 2)
    const count = Array.from({ length: cap + 1 }, (_, a) => limit - a + 1).reduce((a, b) => a + b, 0)
    return numeric(`座標平面で、x≥0、y≥0、x≤${cap}、x+y≤${limit}をすべて満たす領域を考えます。x、yがともに整数である点は何個ですか。境界上の点も含めます。`, count, '個', `xを0から${cap}まで固定すると、yは0から${limit}−xまでです。各列の点の数は${limit + 1}から${limit - cap + 1}まで1ずつ減るので、その合計${count}個になります。`)
  }),
  ...family('optimization', '最大値と最小値', ['資源制約での最大売上', '2資源制約での最大売上', '必要量を満たす最小費用'], level => {
    if (level === 'hard') {
      const need = int(15, 35), sizeA = 4, sizeB = 7, priceA = int(5, 9) * 100, priceB = int(9, 14) * 100
      let best = Infinity, bestA = 0, bestB = 0
      for (let a = 0; a <= Math.ceil(need / sizeA); a++) for (let b = 0; b <= Math.ceil(need / sizeB); b++) {
        const cost = a * priceA + b * priceB
        if (a * sizeA + b * sizeB >= need && cost < best) { best = cost; bestA = a; bestB = b }
      }
      return numeric(`資材を${need}個以上用意します。表のセットを整数セット購入し、余った資材は使わなくてもよいものとします。必要な購入費用の最小値はいくらですか。セットの分割購入はできません。`, best, '円', `Bの購入数を0から${Math.ceil(need / sizeB)}まで調べ、各場合に不足を埋める最小のAの数を求めます。最安はAを${bestA}セット、Bを${bestB}セット買う場合で、${bestA}×${priceA}+${bestB}×${priceB}=${best}円です。`, [{ title: '資材セット', headers: ['セット', '個数', '価格'], rows: [['A', '4個', `${priceA}円`], ['B', '7個', `${priceB}円`]] }])
    }
    const material = int(12, 25), time = int(14, 30), priceA = int(3, 8) * 100, priceB = int(4, 10) * 100
    let best = 0, bestA = 0, bestB = 0
    for (let a = 0; a <= material; a++) for (let b = 0; b <= material; b++) {
      if (2 * a + 3 * b > material || (level === 'normal' && 3 * a + 2 * b > time)) continue
      if (a * priceA + b * priceB > best) { best = a * priceA + b * priceB; bestA = a; bestB = b }
    }
    const rows = level === 'normal' ? [['A', '2枚', '3分', `${priceA}円`], ['B', '3枚', '2分', `${priceB}円`]] : [['A', '2枚', `${priceA}円`], ['B', '3枚', `${priceB}円`]]
    return numeric(`材料が${material}枚${level === 'normal' ? `、作業時間が${time}分` : ''}あります。表の条件で製品A・Bを整数個作り、すべて販売します。材料${level === 'normal' ? 'と作業時間' : ''}を使い切る必要はありません。売上の最大値はいくらですか。`, best, '円', `Aをa個、Bをb個とすると2a+3b≤${material}${level === 'normal' ? `、3a+2b≤${time}` : ''}です。非負整数の組を調べ、${priceA}a+${priceB}bが最大になるのは、例えばAが${bestA}個、Bが${bestB}個のとき。最大売上は${best}円です。`, [{ title: '製品1個あたりの条件', headers: level === 'normal' ? ['製品', '材料', '作業時間', '売価'] : ['製品', '材料', '売価'], rows }])
  }),
]
