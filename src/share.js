/**
 * 分享 —— 复制文本到剪贴板
 */

export function buildShareText(result, siteTitle, siteUrl) {
  const { primary, secondary } = result
  const secondaryLine = secondary && result.mode === 'normal'
    ? `\n次匹配：${secondary.cn}（${secondary.similarity}%）`
    : ''
  return [
    `【${siteTitle}】`,
    `我是「${primary.cn}」${primary.slogan ? '—— ' + primary.slogan : ''}`,
    `匹配度：${primary.similarity}%${secondaryLine}`,
    ``,
    `📎 来测你的：${siteUrl}`,
  ].join('\n')
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
