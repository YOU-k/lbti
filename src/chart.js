/**
 * 雷达图渲染（Canvas API）
 * 结构复用自 SBTI（MIT），颜色改为恋爱主题的暖橘/藕粉。
 */

const LEVEL_NUM = { L: 1, M: 2, H: 3 }

const PALETTE = {
  ring: [
    'rgba(230, 108, 122, 0.10)',
    'rgba(230, 108, 122, 0.06)',
    'rgba(230, 108, 122, 0.03)',
  ],
  grid: 'rgba(230, 108, 122, 0.18)',
  axis: 'rgba(230, 108, 122, 0.14)',
  label: '#a25763',
  polyFill: 'rgba(230, 108, 122, 0.28)',
  polyStroke: 'rgba(210, 82, 96, 0.85)',
  dot: '#d25260',
}

export function drawRadar(canvas, userLevels, dimOrder, dimDefs) {
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const size = 320
  canvas.width = size * dpr
  canvas.height = size * dpr
  canvas.style.width = size + 'px'
  canvas.style.height = size + 'px'
  ctx.scale(dpr, dpr)

  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - 44
  const n = dimOrder.length
  const angleStep = (Math.PI * 2) / n
  const startAngle = -Math.PI / 2

  ctx.clearRect(0, 0, size, size)

  for (let level = 3; level >= 1; level--) {
    const r = (level / 3) * maxR
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.ring[3 - level]
    ctx.fill()
    ctx.strokeStyle = PALETTE.grid
    ctx.lineWidth = 0.5
    ctx.stroke()
  }

  ctx.font = '10px system-ui, -apple-system, "PingFang SC", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep
    const x = cx + Math.cos(angle) * maxR
    const y = cy + Math.sin(angle) * maxR

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(x, y)
    ctx.strokeStyle = PALETTE.axis
    ctx.lineWidth = 0.5
    ctx.stroke()

    const labelR = maxR + 22
    const lx = cx + Math.cos(angle) * labelR
    const ly = cy + Math.sin(angle) * labelR
    const dim = dimOrder[i]
    const label = dimDefs[dim]?.name || dim
    ctx.fillStyle = PALETTE.label
    ctx.fillText(label, lx, ly)
  }

  const values = dimOrder.map((dim) => LEVEL_NUM[userLevels[dim]] || 2)

  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = PALETTE.polyFill
  ctx.fill()
  ctx.strokeStyle = PALETTE.polyStroke
  ctx.lineWidth = 2
  ctx.stroke()

  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.dot
    ctx.fill()
  }
}
