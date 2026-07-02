#!/usr/bin/env node
/**
 * Monte Carlo 分布测试：模拟"偏中间"用户的答题分布，检查是否会导致所有人都命中同一型。
 *
 * 三种用户画像各跑 1000 次：
 *   - 均衡随机：p=[0.33, 0.34, 0.33]
 *   - 偏中间（社会期望偏差）：p=[0.15, 0.70, 0.15]
 *   - 略偏中间：p=[0.25, 0.50, 0.25]
 *
 * 报告每种画像下 top-1 命中的人格分布。
 *
 * Usage: node scripts/distribution-test.js
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

function pickWeighted(probs) {
  const r = Math.random()
  let acc = 0
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i]
    if (r < acc) return i + 1
  }
  return probs.length
}

function simulate(probs, N = 1000) {
  const counts = {}
  let fallback = 0
  for (let i = 0; i < N; i++) {
    const answers = {}
    for (const q of questions.main) answers[q.id] = pickWeighted(probs)
    answers.emo_gate = 1 // avoid emo triggering
    const scores = calcDimensionScores(answers, questions.main)
    const levels = scoresToLevels(scores, config.scoring.levelThresholds)
    const result = determineResult(levels, dimensions.order, types.standard, types.special, {})
    const key = result.primary.cn
    counts[key] = (counts[key] || 0) + 1
    if (result.mode === 'fallback') fallback++
  }
  return { counts, fallback }
}

function report(name, probs) {
  console.log(`\n== ${name} (p=[${probs.join(',')}]) ==`)
  const { counts, fallback } = simulate(probs, 1000)
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const top1 = sorted[0]
  const top1pct = (top1[1] / 10).toFixed(1)
  for (const [name, n] of sorted) {
    const pct = (n / 10).toFixed(1)
    const bar = '█'.repeat(Math.round(n / 20))
    console.log(`  ${name.padEnd(14)} ${pct.padStart(4)}%  ${bar}`)
  }
  console.log(`  (fallback triggered ${(fallback / 10).toFixed(1)}% of runs)`)

  // Health check: top-1 shouldn't dominate more than 40%
  const health = top1[1] < 400 ? 'GOOD' : top1[1] < 550 ? 'WARN' : 'BAD'
  console.log(`  → Top-1 = ${top1[0]} ${top1pct}%  [${health}]`)
  return { top1, top1pct: parseFloat(top1pct) }
}

console.log('LBTI Distribution Test — 1000 simulated users per profile')
console.log('=========================================================')

const uniform = report('Uniform random', [0.25, 0.25, 0.25, 0.25])
const biased = report('Middle-biased (SDR)', [0.10, 0.40, 0.40, 0.10])
const slight = report('Slightly middle-biased', [0.15, 0.35, 0.35, 0.15])

console.log('\n=== Verdict ===')
if (biased.top1pct < 55) {
  console.log(`OK: Even under 70% middle-picking, top-1 (${biased.top1[0]}) only takes ${biased.top1pct}%`)
  process.exit(0)
} else {
  console.log(`WARN: Middle-biased users converge to ${biased.top1[0]} at ${biased.top1pct}%`)
  process.exit(1)
}
