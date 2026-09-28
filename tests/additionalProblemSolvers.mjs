import assert from 'node:assert/strict'

// 生成側の計算関数は使わず、利用者に提示される文章・表だけから検算する。
const numbers = s => [...s.matchAll(/\d+(?:\.\d+)?/g)].map(m => Number(m[0]))
const number = s => Number.parseFloat(s)
const answer = (p, expected, unit = '') => assert.equal(p.answer, `${expected}${unit}`, p.question)
const solvers = {}
for (const level of ['easy', 'normal', 'hard']) {
  solvers[`work-${level}`] = p => {
    const ns = numbers(p.question)
    if (level === 'hard') {
      const [inlet, lead, outlet, capacity] = ns
      let water = 0, minutes = 0
      while (water < capacity && minutes < 1000) { water += inlet - (minutes >= lead ? outlet : 0); minutes++ }
      assert.equal(water, capacity)
      assert.ok(inlet * lead < capacity)
      answer(p, minutes, '分')
    } else {
      const [a, b, total, lead = 0] = ns
      let done = 0, minutes = 0
      while (done < total && minutes < 1000) { done += a + (minutes >= lead ? b : 0); minutes++ }
      assert.equal(done, total)
      answer(p, minutes, '分')
    }
  }
  solvers[`installment-${level}`] = p => {
    const [price, downRate, third, fourth] = numbers(p.question)
    const feeRate = level === 'hard' ? 0 : third, months = level === 'hard' ? third : fourth, multiplier = level === 'hard' ? fourth : 1
    const payment = number(p.answer)
    const paid = price * downRate / 100 + payment * (months - 1) + payment * multiplier
    assert.equal(paid, price + price * feeRate / 100)
    assert.ok(Number.isInteger(payment) && payment > 0)
  }
  solvers[`settlement-${level}`] = p => {
    if (level === 'normal') {
      const [, a, b, c] = numbers(p.question), share = (a + b + c) / 3
      assert.equal(b + number(p.answer), share)
      assert.equal(a - number(p.answer) - (share - c), share)
    } else {
      const [a, b, debt = 0] = numbers(p.question)
      assert.equal(a - number(p.answer) + debt, b + number(p.answer) - debt)
    }
  }
  solvers[`integer-${level}`] = p => {
    if (level === 'hard') {
      const years = Number(p.question.match(/(\d+)年後/)[1]), b = number(p.answer)
      assert.equal((2 * b + years) * 2, (b + years) * 3)
      assert.ok(Number.isInteger(b) && b > 0)
    } else {
      const [, cheap, , premium, count, budget] = numbers(p.question), valid = []
      for (let b = 0; b <= count; b++) {
        const total = cheap * (count - b) + premium * b
        if (level === 'easy' ? total === budget : total <= budget) valid.push(b)
      }
      if (level === 'easy') assert.equal(valid.length, 1)
      answer(p, Math.max(...valid), '個')
    }
  }
  solvers[`flow-${level}`] = p => {
    const rows = p.tables[0].rows, limit = numbers(rows[1][1])[0], step = numbers(rows[2][1])[0]
    if (level === 'easy') {
      const input = numbers(rows[0][1])[0]
      answer(p, input >= limit ? input - step : input + numbers(rows[3][1])[0])
    } else if (level === 'normal') {
      let x = numbers(rows[0][1])[0], guard = 0
      while (x < limit && guard++ < 1000) x += step
      answer(p, x)
    } else {
      const times = numbers(p.question)[0], inputs = []
      for (let input = 0; input <= limit; input++) {
        let x = input, repeats = 0
        while (x < limit && repeats < 1000) { x += step; repeats++ }
        if (repeats === times) inputs.push(input)
      }
      answer(p, Math.min(...inputs))
    }
  }
  solvers[`region-${level}`] = p => {
    if (level === 'easy') {
      const [slope, intercept, x] = numbers(p.question)
      const valid = []
      for (let y = -100; y <= 100; y++) if (y < slope * x + intercept) valid.push(y)
      answer(p, Math.max(...valid))
    } else if (level === 'normal') {
      const [lower, slope, intercept, x] = numbers(p.question)
      let count = 0
      for (let y = -100; y <= 100; y++) if (y >= x + lower && y <= slope * x + intercept) count++
      answer(p, count, '個')
    } else {
      const [, , cap, limit] = numbers(p.question)
      let count = 0
      for (let x = -1; x <= limit + 1; x++) for (let y = -1; y <= limit + 1; y++) {
        if (x >= 0 && y >= 0 && x <= cap && x + y <= limit) count++
      }
      answer(p, count, '個')
    }
  }
  solvers[`optimization-${level}`] = p => {
    const ns = numbers(p.question), rows = p.tables[0].rows
    if (level === 'hard') {
      // 個数ごとの最小費用を動的計画法で検算。生成側の二重列挙とは別方式。
      const need = ns[0], sizes = rows.map(r => number(r[1])), prices = rows.map(r => number(r[2]))
      const upper = need + Math.max(...sizes), costs = Array(upper + 1).fill(Infinity)
      costs[0] = 0
      for (let amount = 1; amount <= upper; amount++) for (let i = 0; i < 2; i++) {
        if (amount >= sizes[i]) costs[amount] = Math.min(costs[amount], costs[amount - sizes[i]] + prices[i])
      }
      answer(p, Math.min(...costs.slice(need)), '円')
    } else {
      const material = ns[0], time = level === 'normal' ? ns[1] : 100
      const prices = rows.map(r => number(r.at(-1))), materialCosts = rows.map(r => number(r[1]))
      const timeCosts = level === 'normal' ? rows.map(r => number(r[2])) : [0, 0]
      const dp = Array.from({ length: material + 1 }, () => Array(time + 1).fill(0))
      for (let m = 0; m <= material; m++) for (let t = 0; t <= time; t++) for (let i = 0; i < 2; i++) {
        if (m >= materialCosts[i] && t >= timeCosts[i]) dp[m][t] = Math.max(dp[m][t], dp[m - materialCosts[i]][t - timeCosts[i]] + prices[i])
      }
      answer(p, dp[material][time], '円')
    }
  }
}
export const additionalSolvers = solvers
