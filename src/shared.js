/**
 * Shared-result landing card — what someone sees when they open a
 * friend's shared URL (?r=CODE&s=SIM).
 */

export function renderSharedCard({ shared, allTypes, onStartMine }) {
  const type = allTypes.find((t) => t.code === shared.code)
  const wrap = document.createElement('div')
  wrap.className = 'shared-page'

  if (!type) {
    wrap.innerHTML = `
      <div class="shared-inner">
        <p class="shared-error">这个人格代码「${escapeHtml(shared.code)}」我不认识 —— 也许链接是旧版的，也许被改过。</p>
        <button class="btn btn-primary btn-lg" id="start-mine">测我自己的</button>
      </div>
    `
    wrap.querySelector('#start-mine').addEventListener('click', onStartMine)
    return wrap
  }

  wrap.innerHTML = `
    <div class="shared-inner">
      <div class="shared-badge">你朋友测出了</div>
      <h1 class="shared-name">${escapeHtml(type.cn)}</h1>
      <p class="shared-intro">${escapeHtml(type.intro)}</p>
      ${shared.similarity ? `<div class="shared-sim">匹配度 <b>${shared.similarity}%</b></div>` : ''}

      ${type.slogan ? `
        <blockquote class="shared-slogan">「${escapeHtml(type.slogan)}」</blockquote>
      ` : ''}

      ${type.warning ? `
        <div class="shared-warning">
          <div class="shared-warning-label">📢 ta 给未来伴侣的一句话</div>
          <p class="shared-warning-body">${escapeHtml(type.warning)}</p>
        </div>
      ` : ''}

      <p class="shared-cta-lead">想知道你自己是哪种物种？</p>
      <button class="btn btn-primary btn-lg" id="start-mine">开始测我的</button>
      <p class="shared-hint">共 20 题，约 2-3 分钟。测完你也能生成一张卡分享。</p>
    </div>
  `

  wrap.querySelector('#start-mine').addEventListener('click', onStartMine)
  return wrap
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
