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
  const whyDims = pickDecisiveDims(userLevels || {}, anchorChars, dimensions)

  const modeLabel = mode === 'emo'
    ? '（emo 深夜专属结果）'
    : mode === 'fallback'
    ? '（薛定谔的暧昧兜底）'
    : ''

  const codeMap = Object.fromEntries(standardTypes.map((t) => [t.code, t]))
  const highList = (primary.match_high || []).map((c) => codeMap[c]?.cn).filter(Boolean)
  const lowList = (primary.match_low || []).map((c) => codeMap[c]?.cn).filter(Boolean)

  const topFive = rankings.slice(0, 5)

  wrap.innerHTML = `
    <header class="result-header">
      <div class="result-mode">${modeLabel}</div>
      <h1 class="result-name">${escapeHtml(primary.cn)}</h1>
      <p class="result-intro">${escapeHtml(primary.intro)}</p>
      <div class="result-similarity">
        与原型匹配度 <b>${primary.similarity}%</b>${
          secondary && mode === 'normal'
            ? ` · 次匹配 <b>${escapeHtml(secondary.cn)}</b> ${secondary.similarity}%`
            : ''
        }
      </div>
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
 * Pick the 3 dimensions where the user's level matches the type's pattern
 * AND the value is at an extreme (H or L) — those are the "identity signals".
 * Falls back to include M matches if fewer than 3 extreme matches exist.
 */
function pickDecisiveDims(userLevels, typeChars, dimensions) {
  const extremeMatches = []
  const midMatches = []
  for (let i = 0; i < dimensions.order.length; i++) {
    const dim = dimensions.order[i]
    const userLevel = userLevels[dim]
    const typeLevel = typeChars[i]
    if (!userLevel || userLevel !== typeLevel) continue
    const def = dimensions.dims[dim]
    if (!def) continue
    const hint = userLevel === 'H' ? def.hi : userLevel === 'L' ? def.lo : '中等，介于两端之间'
    const entry = { dim, level: userLevel, name: def.name, hint }
    if (userLevel === 'M') midMatches.push(entry)
    else extremeMatches.push(entry)
  }
  const picks = extremeMatches.slice(0, 3)
  while (picks.length < 3 && midMatches.length > 0) picks.push(midMatches.shift())
  return picks
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
