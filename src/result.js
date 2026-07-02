/**
 * 结果页渲染
 */
import { drawRadar } from './chart.js'
import { buildShareText, copyToClipboard } from './share.js'

export function renderResult({ result, dimensions, config, standardTypes, onRestart }) {
  const { primary, secondary, rankings, mode } = result

  const wrap = document.createElement('div')
  wrap.className = 'result-page'

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
      <p>${escapeHtml(primary.desc)}</p>
      ${primary.slogan ? `<blockquote class="result-slogan">「${escapeHtml(primary.slogan)}」</blockquote>` : ''}
    </section>

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
      <h3>你的 15 维恋爱雷达</h3>
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
      <button class="btn btn-primary" id="copy-btn">复制结果给朋友炫耀</button>
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

  wrap.querySelector('#restart-btn').addEventListener('click', onRestart)

  return wrap
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
