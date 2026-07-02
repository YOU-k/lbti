#!/usr/bin/env node
/**
 * End-to-end 测试：加载真实数据文件，跑真实的 engine.js，验证多种场景。
 *
 * Usage: node scripts/e2e-test.js
 */
import { readFileSync } from 'node:fs'
import {
  calcDimensionScores,
  scoresToLevels,
  determineResult,
} from '../src/engine.js'

function load(p) {
  return JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf-8'))
}

const questions = load('../data/questions.json')
const dimensions = load('../data/dimensions.json')
const types = load('../data/types.json')
const config = load('../data/config.json')

function run(name, answers, expectMode) {
  const scores = calcDimensionScores(answers, questions.main)
  const levels = scoresToLevels(scores, config.scoring.levelThresholds)
  const gateId = config.emoGate.questionId
  const isEmo = answers[gateId] === config.emoGate.triggerValue
  const result = determineResult(
    levels,
    dimensions.order,
    types.standard,
    types.special,
    { isEmo },
  )
  const status = expectMode === result.mode ? 'PASS' : 'FAIL'
  console.log(
    `[${status}] ${name}: mode=${result.mode}, top=${result.primary.cn}, sim=${result.primary.similarity}%`,
  )
  return result.mode === expectMode
}

const idsMain = questions.main.map((q) => q.id)
const gateId = 'emo_gate'

let all = true

// 1. All middle → normal, should be > 60%
all = run(
  'all middle (2)',
  Object.fromEntries([...idsMain.map((id) => [id, 2]), [gateId, 1]]),
  'normal',
) && all

// 2. All high (3) → normal
all = run(
  'all high (3), emo=1',
  Object.fromEntries([...idsMain.map((id) => [id, 3]), [gateId, 1]]),
  'normal',
) && all

// 3. All low (1) → normal
all = run(
  'all low (1), emo=1',
  Object.fromEntries([...idsMain.map((id) => [id, 1]), [gateId, 1]]),
  'normal',
) && all

// 4. gate = 3 → emo (regardless of other answers)
all = run(
  'emo gate = 3',
  Object.fromEntries([...idsMain.map((id) => [id, 2]), [gateId, 3]]),
  'emo',
) && all

// 5. Adversarial (seed=128 python discovery) → fallback
const adversarialLevels = {
  A1: 'L', A2: 'H', A3: 'L',
  E1: 'L', E2: 'H', E3: 'H',
  B1: 'H', B2: 'H', B3: 'H',
  C1: 'L', C2: 'L', C3: 'L',
  M1: 'H', M2: 'L', M3: 'H',
}
// Build answers that produce these exact levels
const perDim = {}
questions.main.forEach((q) => {
  if (!perDim[q.dim]) perDim[q.dim] = []
  perDim[q.dim].push(q.id)
})
const levelToVal = { L: 1, M: 2, H: 3 }
const adversarialAnswers = { [gateId]: 1 }
for (const [dim, level] of Object.entries(adversarialLevels)) {
  const v = levelToVal[level]
  for (const qid of perDim[dim]) adversarialAnswers[qid] = v
}
all = run('adversarial (should trigger fallback)', adversarialAnswers, 'fallback') && all

// 6. Also assert Top-5 rendering: rankings length >= 5
{
  const scores = calcDimensionScores(
    Object.fromEntries(idsMain.map((id) => [id, 2])),
    questions.main,
  )
  const levels = scoresToLevels(scores, config.scoring.levelThresholds)
  const result = determineResult(levels, dimensions.order, types.standard, types.special, {})
  if (result.rankings.length >= 5) {
    console.log(`[PASS] Top-5 rankings available: ${result.rankings.length} types`)
  } else {
    console.log(`[FAIL] rankings only ${result.rankings.length}`)
    all = false
  }
}

console.log('\n' + (all ? 'ALL E2E PASS' : 'E2E FAILURES'))
process.exit(all ? 0 : 1)
