const COLORS = {
  black: '#0a0a0a',
  bgEnd: '#121a28',
  card: '#181c24',
  card2: '#1e232d',
  border: '#2a3040',
  accent: '#00d4ff',
  accent2: '#ff6b1a',
  green: '#00e676',
  text: '#e8eaf0',
  muted: '#7a8499',
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Genera una imagen vertical (formato Instagram Stories) con el plan de pacing,
// para que se pueda compartir/descargar como imagen en vez de solo texto.
export async function generateShareImageBlob({ results, nutrition, peso, labels }) {
  if (document.fonts?.ready) {
    try { await document.fonts.ready } catch { /* sigue sin bloquear */ }
  }

  const W = 1080
  const H = 1920
  const pad = 64
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, COLORS.black)
  bg.addColorStop(1, COLORS.bgEnd)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const topline = ctx.createLinearGradient(0, 0, W, 0)
  topline.addColorStop(0, COLORS.black)
  topline.addColorStop(0.5, COLORS.accent)
  topline.addColorStop(1, COLORS.black)
  ctx.fillStyle = topline
  ctx.fillRect(0, 0, W, 6)

  let y = 90

  try {
    const logo = await loadImage('/logo.png')
    const badge = 140
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, pad, y, badge, badge, 24)
    ctx.fill()
    ctx.drawImage(logo, pad + 10, y + 10, badge - 20, badge - 20)
  } catch { /* sin logo, seguimos sin romper la imagen */ }

  ctx.fillStyle = COLORS.muted
  ctx.font = '700 24px Barlow, sans-serif'
  ctx.fillText(labels.trainerBadge, pad + 160, y + 52)
  ctx.fillStyle = COLORS.text
  ctx.font = '700 32px "Barlow Condensed", sans-serif'
  ctx.fillText('Pablo Iglesias Navarrete', pad + 160, y + 96)

  y += 210
  ctx.fillStyle = COLORS.text
  ctx.font = '900 76px "Barlow Condensed", sans-serif'
  ctx.fillText(labels.myPacing, pad, y)
  y += 68
  ctx.fillStyle = COLORS.accent2
  ctx.font = '700 44px "Barlow Condensed", sans-serif'
  ctx.fillText(labels.raceName, pad, y)

  y += 70
  const gap = 20
  const cellW = (W - pad * 2 - gap) / 2
  const cellH = 150
  const npWkg = results.np / (Number(peso) || 1)
  const metrics = [
    { label: labels.ifLabel, value: results.ifRec.toFixed(2) },
    { label: labels.npLabel, value: `${results.np.toFixed(0)}W` },
    { label: labels.npWkgLabel, value: npWkg.toFixed(2) },
    { label: labels.tssLabel, value: `${nutrition.tss}` },
  ]
  const gridTop = y
  metrics.forEach((m, i) => {
    const cx = pad + (i % 2) * (cellW + gap)
    const cy = gridTop + Math.floor(i / 2) * (cellH + gap)
    ctx.fillStyle = COLORS.card
    roundRect(ctx, cx, cy, cellW, cellH, 16)
    ctx.fill()
    ctx.strokeStyle = COLORS.border
    ctx.lineWidth = 2
    roundRect(ctx, cx, cy, cellW, cellH, 16)
    ctx.stroke()
    ctx.fillStyle = COLORS.accent
    ctx.font = '900 56px "Barlow Condensed", sans-serif'
    ctx.fillText(m.value, cx + 28, cy + 78)
    ctx.fillStyle = COLORS.muted
    ctx.font = '700 21px Barlow, sans-serif'
    ctx.fillText(m.label, cx + 28, cy + 115)
  })
  y = gridTop + cellH * 2 + gap + 70

  ctx.fillStyle = COLORS.muted
  ctx.font = '700 26px "Barlow Condensed", sans-serif'
  ctx.fillText(labels.terrainTitle, pad, y)
  y += 46

  const terrain = [
    { name: labels.subidas, w: results.subidas, color: '#ff6b6b' },
    { name: labels.llano, w: results.llano, color: COLORS.accent },
    { name: labels.bajadas, w: results.bajadas, color: COLORS.green },
  ]
  for (const t of terrain) {
    ctx.fillStyle = COLORS.card2
    roundRect(ctx, pad, y, W - pad * 2, 88, 14)
    ctx.fill()
    ctx.fillStyle = COLORS.text
    ctx.font = '600 32px Barlow, sans-serif'
    ctx.fillText(t.name, pad + 28, y + 56)
    ctx.fillStyle = t.color
    ctx.font = '900 38px "Barlow Condensed", sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${Math.round(t.w)}W`, W - pad - 28, y + 56)
    ctx.textAlign = 'left'
    y += 88 + 16
  }

  y += 36
  ctx.fillStyle = COLORS.muted
  ctx.font = '700 26px "Barlow Condensed", sans-serif'
  ctx.fillText(labels.nutritionTitle, pad, y)
  y += 46

  const nutriGap = 18
  const nutriW = (W - pad * 2 - nutriGap * 2) / 3
  const nutri = [
    { label: labels.carbsLabel, value: `${nutrition.g_recomendados.toFixed(0)}g`, color: COLORS.accent2 },
    { label: labels.liquidsLabel, value: `${nutrition.ml_h}ml`, color: COLORS.green },
    { label: labels.sodiumLabel, value: `${nutrition.mg_h}mg`, color: COLORS.green },
  ]
  nutri.forEach((n, i) => {
    const cx = pad + i * (nutriW + nutriGap)
    ctx.fillStyle = COLORS.card
    roundRect(ctx, cx, y, nutriW, 124, 16)
    ctx.fill()
    ctx.fillStyle = n.color
    ctx.font = '900 34px "Barlow Condensed", sans-serif'
    ctx.fillText(n.value, cx + 20, y + 56)
    ctx.fillStyle = COLORS.muted
    ctx.font = '600 18px Barlow, sans-serif'
    ctx.fillText(n.label, cx + 20, y + 90)
  })
  y += 124 + 64

  // Reloj de línea dibujado a mano (evita el emoji ⏱, que se renderiza distinto en cada SO)
  const clockR = 13
  const clockCx = pad + clockR
  const clockCy = y - 10
  ctx.strokeStyle = COLORS.accent
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(clockCx, clockCy, clockR, 0, Math.PI * 2)
  ctx.moveTo(clockCx, clockCy - 6)
  ctx.lineTo(clockCx, clockCy)
  ctx.lineTo(clockCx + 5, clockCy + 3)
  ctx.stroke()

  ctx.fillStyle = COLORS.text
  ctx.font = '600 30px Barlow, sans-serif'
  ctx.fillText(labels.durationLine, clockCx + clockR + 16, y)

  y += 60
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(pad, y)
  ctx.lineTo(W - pad, y)
  ctx.stroke()

  y += 66
  ctx.fillStyle = COLORS.accent
  ctx.font = '900 42px "Barlow Condensed", sans-serif'
  ctx.fillText('triatlonpacing.com', pad, y)
  ctx.fillStyle = COLORS.muted
  ctx.font = '600 24px Barlow, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(labels.ctaFree, W - pad, y)
  ctx.textAlign = 'left'

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}
