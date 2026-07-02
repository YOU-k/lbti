/**
 * 分享 —— 复制文本、保存图片
 */

const H2C_URL = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'

let _h2cPromise = null

/**
 * Lazy-load html2canvas from CDN. Returned once cached.
 */
function loadHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas)
  if (_h2cPromise) return _h2cPromise
  _h2cPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = H2C_URL
    s.onload = () => resolve(window.html2canvas)
    s.onerror = () => reject(new Error('html2canvas failed to load'))
    document.head.appendChild(s)
  })
  return _h2cPromise
}

/**
 * Snap a DOM element to PNG blob and trigger download.
 */
export async function saveElementAsImage(element, filename = 'lbti-result.png') {
  const h2c = await loadHtml2Canvas()
  const canvas = await h2c(element, {
    backgroundColor: '#fdf5f3',
    scale: 2,
    useCORS: true,
    logging: false,
  })
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'))
  if (!blob) throw new Error('toBlob returned null')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function buildShareText(result, siteTitle, siteUrl) {
  const { primary, secondary } = result
  const secondaryLine = secondary && result.mode === 'normal'
    ? `\n次匹配：${secondary.cn}（${secondary.similarity}%）`
    : ''
  // Encode primary result into URL so viewer sees the sharer's result card
  const sharedUrl = buildSharedUrl(siteUrl, primary.code, primary.similarity)
  return [
    `【${siteTitle}】`,
    `我是「${primary.cn}」${primary.slogan ? '—— ' + primary.slogan : ''}`,
    `匹配度：${primary.similarity}%${secondaryLine}`,
    ``,
    `📎 看我的结果卡 + 测你的：${sharedUrl}`,
  ].join('\n')
}

/**
 * Build a URL that pre-loads a shared result card.
 * Format: <baseUrl>?r=<code>&s=<similarity>
 */
export function buildSharedUrl(baseUrl, code, similarity) {
  const url = new URL(baseUrl)
  url.searchParams.set('r', code)
  url.searchParams.set('s', String(similarity))
  return url.toString()
}

/**
 * Parse the current URL for a shared-result payload. Returns null if none.
 */
export function parseSharedFromLocation() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('r')
  if (!code) return null
  const s = parseInt(params.get('s') || '0', 10)
  return { code, similarity: Number.isFinite(s) ? s : 0 }
}

export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return true
  }
  // fallback
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(ta)
  return ok
}
