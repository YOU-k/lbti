/**
 * LBTI 评分引擎 —— 纯函数，无 DOM 依赖
 *
 * 本文件复用自 SBTI 项目（MIT）：https://github.com/pingfanfan/SBTI
 * 原始作者致谢 B 站 UP 主 @蛆肉儿串儿。本项目仅复用其打分/匹配算法结构，
 * 所有题目、维度、人格类型均为 LBTI 原创。
 */

/**
 * 按维度求和：每维度 2 题，分值相加 (范围 2-6)
 */
export function calcDimensionScores(answers, questions) {
  const scores = {}
  for (const q of questions) {
    if (answers[q.id] == null) continue
    scores[q.dim] = (scores[q.dim] || 0) + answers[q.id]
  }
  return scores
}

/**
 * 原始分 → L/M/H 等级
 */
export function scoresToLevels(scores, thresholds) {
  const levels = {}
  for (const [dim, score] of Object.entries(scores)) {
    if (score <= thresholds.L[1]) levels[dim] = 'L'
    else if (score >= thresholds.H[0]) levels[dim] = 'H'
    else levels[dim] = 'M'
  }
  return levels
}

const LEVEL_NUM = { L: 1, M: 2, H: 3 }

export function parsePattern(pattern) {
  return pattern.replace(/-/g, '').split('')
}

/**
 * 计算用户向量与类型 pattern 的曼哈顿距离
 */
export function matchType(userLevels, dimOrder, pattern) {
  const typeLevels = parsePattern(pattern)
  let distance = 0
  let exact = 0

  for (let i = 0; i < dimOrder.length; i++) {
    const userVal = LEVEL_NUM[userLevels[dimOrder[i]]] || 2
    const typeVal = LEVEL_NUM[typeLevels[i]] || 2
    const diff = Math.abs(userVal - typeVal)
    distance += diff
    if (diff === 0) exact++
  }

  // Max possible distance = dimOrder.length * 2 (L→H per dim)
  const maxDistance = dimOrder.length * 2
  const similarity = Math.max(0, Math.round((1 - distance / maxDistance) * 100))
  return { distance, exact, similarity }
}

/**
 * 匹配所有类型，排序，应用特殊覆盖
 */
export function determineResult(userLevels, dimOrder, standardTypes, specialTypes) {
  const rankings = standardTypes.map((type) => ({
    ...type,
    ...matchType(userLevels, dimOrder, type.pattern),
  }))

  rankings.sort((a, b) => a.distance - b.distance || b.exact - a.exact || b.similarity - a.similarity)

  const best = rankings[0]
  const fallback = specialTypes.find((t) => t.code === 'SCHRODINGER')

  // "薛定谔的暧昧"兜底
  if (best.similarity < 60 && fallback) {
    return {
      primary: { ...fallback, similarity: best.similarity, exact: best.exact },
      secondary: best,
      rankings,
      mode: 'fallback',
    }
  }

  return {
    primary: best,
    secondary: rankings[1] || null,
    rankings,
    mode: 'normal',
  }
}
