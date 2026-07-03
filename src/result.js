/**
 * 结果页渲染
 */
import { drawRadar } from './chart.js'
import { buildShareText, copyToClipboard, saveElementAsImage } from './share.js'

export function renderResult({ result, dimensions, config, standardTypes, userLevels, onRestart }) {
  const { primary, secondary, rankings, mode } = result

  const wrap = document.createElement('div')
  wrap.className = 'result-page'

  // For fallback/emo the primary's pattern isn't meaningful — use rankings[0]
  const anchorPattern = (mode === 'normal' ? primary : rankings[0]).pattern
  const anchorChars = anchorPattern.replace(/-/g, '').split('')
  const whyDims = pickDecisiveDims(userLevels || {}, anchorChars, dimensions, standardTypes)

  const modeLabel = mode === 'emo'
    ? '（emo 深夜专属结果）'
    : mode === 'fallback'
    ? '（薛定谔的暧昧兜底）'
    : ''

  // Detect hybrid: top-1 and top-2 within 5% → user sits between two types
  const isHybrid =
    mode === 'normal' &&
    secondary &&
    primary.similarity - secondary.similarity <= 5 &&
    primary.similarity - secondary.similarity >= 0
  const hybridBadge = isHybrid
    ? `<div class="result-hybrid-badge">你在两个型之间 · ${escapeHtml(primary.cn)} × ${escapeHtml(secondary.cn)}</div>`
    : ''

  const codeMap = Object.fromEntries(standardTypes.map((t) => [t.code, t]))
  const highList = (primary.match_high || []).map((c) => codeMap[c]?.cn).filter(Boolean)
  const lowList = (primary.match_low || []).map((c) => codeMap[c]?.cn).filter(Boolean)

  const topFive = rankings.slice(0, 5)

  wrap.innerHTML = `
    <header class="result-header">
      <div class="result-mode">${modeLabel}</div>
      ${hybridBadge}
      <h1 class="result-name">${escapeHtml(primary.cn)}</h1>
      <p class="result-intro">${escapeHtml(primary.intro)}</p>
      <div class="result-similarity">
        与原型相似度 <b>${primary.similarity}%</b>${
          secondary && mode === 'normal'
            ? ` · 次匹配 <b>${escapeHtml(secondary.cn)}</b> ${secondary.similarity}%`
            : ''
        }
      </div>
      ${isHybrid ? `
        <p class="result-hybrid-note">你的答题分布让两个型跟你距离很近 —— 你不是完美的 ${escapeHtml(primary.cn)}，也不是完美的 ${escapeHtml(secondary.cn)}，你是这两个型的<b>混合体</b>。下面的描述以主匹配为主，你可以顺手看看次匹配那个型你身上有几分。</p>
      ` : ''}
    </header>

    <section class="result-desc">
      <p>${renderDescMarkdown(primary.desc)}</p>
      ${primary.slogan ? `<blockquote class="result-slogan">「${escapeHtml(primary.slogan)}」</blockquote>` : ''}
    </section>

    ${primary.warning ? `
      <section class="result-warning">
        <div class="warning-label">📢 给 ta 的一句话警告</div>
        <p class="warning-body">${escapeHtml(primary.warning)}</p>
      </section>
    ` : ''}

    ${whyDims.length > 0 ? `
      <section class="result-why">
        <h3>为什么是这个型？</h3>
        <p class="why-lead">决定你身份的 ${whyDims.length} 个关键维度：</p>
        <ul class="why-list">
          ${whyDims.map((d) => `
            <li>
              <span class="why-dim">${escapeHtml(d.name)}</span>
              <span class="why-level why-level-${d.level.toLowerCase()}">${d.level}</span>
              <span class="why-hint">${escapeHtml(d.hint)}</span>
            </li>
          `).join('')}
        </ul>
      </section>
    ` : ''}

    ${
      mode === 'normal' && (highList.length || lowList.length)
        ? `
      <section class="result-match">
        <h3>你的天菜 & 你的毒药</h3>
        <div class="match-grid">
          <div class="match-col">
            <div class="match-label match-label-high">天菜（最搭）</div>
            <div class="match-tags">${highList.map((n) => `<span class="tag tag-high">${escapeHtml(n)}</span>`).join('')}</div>
          </div>
          <div class="match-col">
            <div class="match-label match-label-low">毒药（尽量别碰）</div>
            <div class="match-tags">${lowList.map((n) => `<span class="tag tag-low">${escapeHtml(n)}</span>`).join('')}</div>
          </div>
        </div>
      </section>
    `
        : ''
    }

    <section class="result-chart">
      <h3>你的 10 维恋爱雷达</h3>
      <div class="chart-wrap"><canvas id="radar"></canvas></div>
    </section>

    <section class="result-top5">
      <h3>Top 5 相似类型</h3>
      <ol class="top5-list">
        ${topFive
          .map(
            (r, i) => `
          <li>
            <span class="top5-rank">${i + 1}</span>
            <span class="top5-name">${escapeHtml(r.cn)}</span>
            <span class="top5-similarity">${r.similarity}%</span>
          </li>
        `,
          )
          .join('')}
      </ol>
    </section>

    <section class="result-actions">
      <button class="btn btn-primary" id="save-img-btn">💾 保存为图片</button>
      <button class="btn btn-ghost" id="copy-btn">复制结果文字</button>
      <button class="btn btn-ghost" id="restart-btn">再测一次</button>
    </section>

    <footer class="result-footer">
      <p>${escapeHtml(mode === 'normal' ? config.display.funNote : config.display.funNoteSpecial)}</p>
    </footer>
  `

  // Radar
  const canvas = wrap.querySelector('#radar')
  // 重新计算 userLevels（因为 mode 特殊时 primary.pattern 被覆盖了，我们用 rankings[0]）
  // rankings[0] 已经是 best 的 standard type
  const bestVec = parsePatternToLevels(rankings[0].pattern, dimensions.order)
  drawRadar(canvas, bestVec, dimensions.order, dimensions.dims)

  // Copy
  const siteUrl = window.location.origin + window.location.pathname
  wrap.querySelector('#copy-btn').addEventListener('click', async () => {
    const text = buildShareText(result, config.display.title, siteUrl)
    const ok = await copyToClipboard(text)
    const btn = wrap.querySelector('#copy-btn')
    btn.textContent = ok ? '已复制！粘贴到朋友圈就行' : '复制失败，长按选中'
    setTimeout(() => (btn.textContent = '复制结果给朋友炫耀'), 3000)
  })

  // Save-as-image
  const saveBtn = wrap.querySelector('#save-img-btn')
  saveBtn.addEventListener('click', async () => {
    const original = saveBtn.textContent
    saveBtn.textContent = '生成中...'
    saveBtn.disabled = true
    // Hide action buttons + footer during snapshot for a clean card
    const actions = wrap.querySelector('.result-actions')
    const footer = wrap.querySelector('.result-footer')
    actions.style.visibility = 'hidden'
    if (footer) footer.style.visibility = 'hidden'
    try {
      await saveElementAsImage(wrap, `LBTI-${primary.cn.replace(/[/\s]/g, '')}.png`)
      saveBtn.textContent = '✓ 图片已生成'
    } catch (e) {
      saveBtn.textContent = '生成失败'
      console.error(e)
    } finally {
      actions.style.visibility = ''
      if (footer) footer.style.visibility = ''
    }
    setTimeout(() => {
      saveBtn.textContent = original
      saveBtn.disabled = false
    }, 3000)
  })

  wrap.querySelector('#restart-btn').addEventListener('click', onRestart)

  return wrap
}

/**
 * Pick the 3 dimensions where the user's level (a) matches this type's
 * pattern AND (b) is most distinctive — few other types share this
 * level at this dim. That's what actually SEPARATES this type from
 * neighbors, not just "the value the user happened to score".
 *
 * If ties, extremes (H/L) win over M since M often lands mid-range.
 */
function pickDecisiveDims(userLevels, typeChars, dimensions, allTypes) {
  const order = dimensions.order
  // For each dim + level (L/M/H), how many standard types share it?
  const scoredMatches = []
  for (let i = 0; i < order.length; i++) {
    const dim = order[i]
    const userLevel = userLevels[dim]
    const typeLevel = typeChars[i]
    if (!userLevel || userLevel !== typeLevel) continue

    // Count how many other standard types also carry this level at this position.
    let shared = 0
    for (const other of allTypes) {
      const otherChars = other.pattern.replace(/-/g, '')
      if (otherChars[i] === userLevel) shared++
    }

    const def = dimensions.dims[dim]
    if (!def) continue
    const hint =
      userLevel === 'H' ? def.hi : userLevel === 'L' ? def.lo : '介于两端之间'
    scoredMatches.push({
      dim,
      level: userLevel,
      name: def.name,
      hint,
      shared, // fewer = more distinctive
    })
  }

  // Sort: fewer shared → more distinctive first;
  //       if tied, prefer extremes (H/L) over M.
  scoredMatches.sort((a, b) => {
    if (a.shared !== b.shared) return a.shared - b.shared
    const aMid = a.level === 'M' ? 1 : 0
    const bMid = b.level === 'M' ? 1 : 0
    return aMid - bMid
  })

  return scoredMatches.slice(0, 3)
}

function renderDescMarkdown(text) {
  // Only supports **bold** for now — used in "拥有一个 XX 朋友是什么体验" hooks
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

function parsePatternToLevels(pattern, dimOrder) {
  const chars = pattern.replace(/-/g, '').split('')
  const out = {}
  for (let i = 0; i < dimOrder.length; i++) out[dimOrder[i]] = chars[i]
  return out
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}
