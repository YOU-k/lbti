#!/usr/bin/env node
/**
 * 检查所有型 pattern 的分布：
 *   - 两两曼哈顿距离
 *   - 均值 / 最小 / 最大
 *   - 标记距离过近（< MIN_DIST）的成对类型
 *
 * Thresholds auto-scale with dim count (max distance = dims * 2).
 *
 * Usage: node scripts/check-patterns.js
 */
import { readFileSync } from 'node:fs'

const LEVEL_NUM = { L: 1, M: 2, H: 3 }

function toVec(pattern) {
  return pattern.replace(/-/g, '').split('').map((c) => LEVEL_NUM[c])
}

function manhattan(a, b) {
  let d = 0
  for (let i = 0; i < a.length; i++) d += Math.abs(a[i] - b[i])
  return d
}

const types = JSON.parse(readFileSync(new URL('../data/types.json', import.meta.url))).standard

const vecs = types.map((t) => ({ code: t.code, vec: toVec(t.pattern) }))

const dimCount = vecs[0].vec.length
const maxDistance = dimCount * 2
const MIN_DIST = Math.max(2, Math.floor(dimCount * 0.2))
const MEAN_TARGET = Math.floor(dimCount * 0.4)

let sum = 0
let count = 0
let min = Infinity
let max = -Infinity
const closePairs = []

for (let i = 0; i < vecs.length; i++) {
  for (let j = i + 1; j < vecs.length; j++) {
    const d = manhattan(vecs[i].vec, vecs[j].vec)
    sum += d
    count++
    if (d < min) min = d
    if (d > max) max = d
    if (d < MIN_DIST) closePairs.push([vecs[i].code, vecs[j].code, d])
  }
}

const mean = (sum / count).toFixed(2)
console.log(`Dimensions: ${dimCount}  (max distance = ${maxDistance})`)
console.log(`Pairs: ${count}`)
console.log(`Mean distance: ${mean} (target >= ${MEAN_TARGET})`)
console.log(`Min: ${min}  (should be >= ${MIN_DIST})`)
console.log(`Max: ${max}  (theoretical max: ${maxDistance})`)

if (closePairs.length > 0) {
  console.log('\nToo-close pairs:')
  for (const [a, b, d] of closePairs) console.log(`  ${a} <-> ${b}: ${d}`)
} else {
  console.log('\nNo overly close pairs.')
}

const pass = mean >= MEAN_TARGET && min >= MIN_DIST
console.log(`\n${pass ? 'PASS' : 'FAIL'}`)
process.exit(pass ? 0 : 1)
