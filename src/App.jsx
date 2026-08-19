import { useState, useMemo, useEffect } from 'react'
import InstallPWA from './InstallPWA.jsx'
import ReloadPrompt from './ReloadPrompt.jsx'
import Icon from './Icons.jsx'
import SEO from './SEO.jsx'
import { generateShareImageBlob } from './shareImage.js'
import { Analytics } from '@vercel/analytics/react'
import { useLanguage } from './i18n/LanguageContext.js'

// ---- IF Tables ----
const DATA_703 = [
  ["Baja","Ligero","Bajo",0.74,0.78],["Baja","Ligero","Medio",0.72,0.76],["Baja","Ligero","Alto",0.70,0.74],
  ["Baja","Medio","Bajo",0.72,0.76],["Baja","Medio","Medio",0.70,0.74],["Baja","Medio","Alto",0.68,0.72],
  ["Baja","Pesado","Bajo",0.70,0.74],["Baja","Pesado","Medio",0.68,0.72],["Baja","Pesado","Alto",0.66,0.70],
  ["Media","Ligero","Bajo",0.78,0.82],["Media","Ligero","Medio",0.76,0.80],["Media","Ligero","Alto",0.74,0.78],
  ["Media","Medio","Bajo",0.76,0.80],["Media","Medio","Medio",0.74,0.78],["Media","Medio","Alto",0.72,0.76],
  ["Media","Pesado","Bajo",0.74,0.78],["Media","Pesado","Medio",0.72,0.76],["Media","Pesado","Alto",0.70,0.74],
  ["Alta","Ligero","Bajo",0.82,0.85],["Alta","Ligero","Medio",0.80,0.83],["Alta","Ligero","Alto",0.78,0.82],
  ["Alta","Medio","Bajo",0.80,0.83],["Alta","Medio","Medio",0.78,0.82],["Alta","Medio","Alto",0.76,0.80],
  ["Alta","Pesado","Bajo",0.78,0.82],["Alta","Pesado","Medio",0.76,0.80],["Alta","Pesado","Alto",0.74,0.78],
]
const DATA_FULL = [
  ["Baja","Ligero","Bajo",0.60,0.65],["Baja","Ligero","Medio",0.59,0.64],["Baja","Ligero","Alto",0.58,0.63],
  ["Baja","Medio","Bajo",0.59,0.64],["Baja","Medio","Medio",0.58,0.63],["Baja","Medio","Alto",0.57,0.62],
  ["Baja","Pesado","Bajo",0.58,0.63],["Baja","Pesado","Medio",0.57,0.62],["Baja","Pesado","Alto",0.56,0.61],
  ["Media","Ligero","Bajo",0.65,0.69],["Media","Ligero","Medio",0.64,0.68],["Media","Ligero","Alto",0.63,0.67],
  ["Media","Medio","Bajo",0.64,0.68],["Media","Medio","Medio",0.63,0.67],["Media","Medio","Alto",0.62,0.66],
  ["Media","Pesado","Bajo",0.63,0.67],["Media","Pesado","Medio",0.62,0.66],["Media","Pesado","Alto",0.61,0.65],
  ["Alta","Ligero","Bajo",0.69,0.72],["Alta","Ligero","Medio",0.68,0.71],["Alta","Ligero","Alto",0.67,0.70],
  ["Alta","Medio","Bajo",0.68,0.71],["Alta","Medio","Medio",0.67,0.70],["Alta","Medio","Alto",0.66,0.69],
  ["Alta","Pesado","Bajo",0.67,0.70],["Alta","Pesado","Medio",0.66,0.69],["Alta","Pesado","Alto",0.65,0.68],
]

const CARRERAS_703 = [
  { value: '70.3-vitoria',  label: '70.3 Vitoria-Gasteiz',  desnivel: 950 },
  { value: '70.3-mallorca', label: '70.3 Mallorca (Alcúdia)', desnivel: 700 },
  { value: '70.3-marbella', label: '70.3 Marbella',          desnivel: 850 },
  { value: '70.3-calella',  label: '70.3 Calella',           desnivel: 750 },
  { value: '70.3-cascais',  label: '70.3 Cascais',           desnivel: 600 },
]
const CARRERAS_FULL = [
  { value: 'full-lanzarote', label: 'Ironman Lanzarote',  desnivel: 2600 },
  { value: 'full-vitoria',   label: 'Ironman Vitoria',    desnivel: 1800 },
  { value: 'full-barcelona', label: 'Ironman Barcelona',  desnivel: 1200 },
  { value: 'full-frankfurt', label: 'Ironman Frankfurt',  desnivel: 1700 },
  { value: 'full-zurich',    label: 'Ironman Zurich',     desnivel: 1800 },
]
const TODAS_CARRERAS = [...CARRERAS_703, ...CARRERAS_FULL]

function lookup(data, exp, perfil, desnivelCat) {
  const row = data.find(r => r[0] === exp && r[1] === perfil && r[2] === desnivelCat)
  return row ? { ifMin: row[3], ifMax: row[4] } : null
}

function estimarVelocidad(npWkg, experiencia, desnivelCat) {
  const base = 15.8 + (npWkg * 8)
  const expFactor = experiencia === 'Baja' ? 0.94 : experiencia === 'Media' ? 0.97 : 1.0
  const desnFactor = desnivelCat === 'Bajo' ? 1.0 : desnivelCat === 'Medio' ? 0.95 : 0.90
  return Math.round(base * expFactor * desnFactor * 10) / 10
}

function fmtDuracion(h) {
  const horas = Math.floor(h)
  const mins = Math.round((h - horas) * 60)
  return `${horas}h ${mins}min`
}

const STORAGE_KEY = 'triatlonpacing:lastPlan'

function loadLastPlan() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const plan = JSON.parse(raw)
    const valid = plan && typeof plan.savedAt === 'number' && typeof plan.ftp === 'number' &&
      typeof plan.wkg === 'number' && typeof plan.np === 'number' && typeof plan.ifRec === 'number'
    return valid ? plan : null
  } catch {
    return null
  }
}

function saveLastPlan(plan) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
  } catch {
    // localStorage no disponible (modo privado, cuota llena...) — no es crítico
  }
}

export default function App() {
  const { lang, setLang, t, tCat, locale } = useLanguage()
  const [distancia, setDistancia] = useState('70.3')
  const [ftp, setFtp] = useState(250)
  const [peso, setPeso] = useState(70)
  const [tieneGrasa, setTieneGrasa] = useState('no')
  const [grasa, setGrasa] = useState(15)
  const [experiencia, setExperiencia] = useState('Media')
  const [gut, setGut] = useState('Medio')
  const [desnivel, setDesnivel] = useState(1200)
  const [velocidadOverride, setVelocidadOverride] = useState(null)
  const [temp, setTemp] = useState('Moderada')
  const [carreraSeleccionada, setCarreraSeleccionada] = useState('')
  const [openFaq, setOpenFaq] = useState(null)
  const [shareMsg, setShareMsg] = useState('')
  const [sharing, setSharing] = useState(false)
  const [previousPlan] = useState(loadLastPlan)

  // ---- Perfil atleta ----
  const wkg = (Number(ftp) || 0) / (Number(peso) || 1)
  const pesoMagro = tieneGrasa === 'si' ? Number(peso) * (1 - Number(grasa) / 100) : null

  let score = wkg >= 4.5 ? 2 : wkg >= 3.5 ? 1 : 0
  if (tieneGrasa === 'si') {
    if (Number(grasa) < 10) score += 1
    else if (Number(grasa) > 18) score -= 1
  }
  score = Math.max(0, Math.min(score, 2))
  const categoriaPeso = score === 2 ? 'Ligero' : score === 1 ? 'Medio' : 'Pesado'

  // ---- Desnivel metros → categoría ----
  let desnivelCat
  const desnivelNum = Number(desnivel) || 0
  if (distancia === '70.3') {
    desnivelCat = desnivelNum < 800 ? 'Bajo' : desnivelNum < 1500 ? 'Medio' : 'Alto'
  } else {
    desnivelCat = desnivelNum < 1500 ? 'Bajo' : desnivelNum < 3000 ? 'Medio' : 'Alto'
  }

  const distanciaKm = distancia === '70.3' ? 90 : 180

  // ---- Pacing ----
  const results = useMemo(() => {
    const data = distancia === '70.3' ? DATA_703 : DATA_FULL
    const r = lookup(data, experiencia, categoriaPeso, desnivelCat)
    if (!r) return null
    const ifRec = (r.ifMin + r.ifMax) / 2
    const ftpNum = Number(ftp) || 0
    const np = ftpNum * ifRec
    let subidas, llano, bajadas
    if (distancia === '70.3') {
      subidas = ftpNum * (ifRec + 0.08)
      llano   = ftpNum * (ifRec - 0.02)
      bajadas = ftpNum * (ifRec - 0.1)
    } else {
      subidas = ftpNum * (ifRec + 0.05)
      llano   = ftpNum * (ifRec - 0.01)
      bajadas = ftpNum * (ifRec - 0.08)
    }
    return { ifMin: r.ifMin, ifMax: r.ifMax, ifRec, np, subidas, llano, bajadas }
  }, [distancia, ftp, experiencia, categoriaPeso, desnivelCat])

  // ---- Velocidad y duración ----
  const velocidadEstimada = results ? estimarVelocidad(results.np / (Number(peso) || 1), experiencia, desnivelCat) : null
  const velocidad = velocidadOverride ?? velocidadEstimada ?? 32
  const duracion = distanciaKm / velocidad

  // ---- Nutrición e hidratación ----
  const nutrition = useMemo(() => {
    if (!results) return null
    const { ifRec, np } = results
    const kj_h = np * 3.6
    const kj_totales = kj_h * duracion
    const tss = Math.round(duracion * ifRec * ifRec * 100)

    let ch_pct = 0.45 + (ifRec * 0.35)
    ch_pct = Math.min(ch_pct, 0.8)
    const g_ch_ox = (kj_h * ch_pct) / 4

    const gutTable = {
      Bajo:  { gut_max: 60,  factor_rep: 0.5 },
      Medio: { gut_max: 90,  factor_rep: 0.65 },
      Alto:  { gut_max: 110, factor_rep: 0.75 },
      Elite: { gut_max: 130, factor_rep: 0.85 },
    }
    const { gut_max, factor_rep } = gutTable[gut]
    const g_recomendados = Math.min(g_ch_ox * factor_rep, gut_max)
    const total_ch = g_recomendados * duracion
    const deficit_h = g_ch_ox - g_recomendados

    let ml_h, mg_h
    if (temp === 'Fría') { ml_h = 500; mg_h = 400 }
    else if (temp === 'Moderada') { ml_h = 750; mg_h = 600 }
    else { ml_h = 1000; mg_h = 900 }

    return {
      kj_h, kj_totales, tss,
      g_ch_ox, g_recomendados, total_ch, deficit_h,
      ml_h, mg_h,
      total_liq: ml_h * duracion,
      total_sodio: mg_h * duracion,
      ch_20: g_recomendados / 3,
      liq_20: ml_h / 3,
      sodio_20: mg_h / 3,
    }
  }, [results, duracion, temp, gut])

  // ---- Progreso (localStorage) ----
  const isDefaultState = distancia === '70.3' && Number(ftp) === 250 && Number(peso) === 70 &&
    tieneGrasa === 'no' && experiencia === 'Media' && gut === 'Medio' && Number(desnivel) === 1200 && temp === 'Moderada'
  const sameDistanciaQuePrevio = previousPlan?.distancia === distancia

  useEffect(() => {
    if (isDefaultState || !results || !nutrition) return
    saveLastPlan({
      savedAt: Date.now(),
      distancia,
      ftp: Number(ftp) || 0,
      peso: Number(peso) || 0,
      wkg,
      ifRec: results.ifRec,
      np: results.np,
      tss: nutrition.tss,
    })
  }, [isDefaultState, results, nutrition, distancia, ftp, peso, wkg])

  // ---- Alertas ----
  const alerts = []
  if (results && nutrition) {
    if (distancia !== '70.3' && results.ifRec > 0.70)
      alerts.push(t('alerts.ifFullHigh'))
    if (nutrition.tss > 300)
      alerts.push(t('alerts.tssHigh'))
    if (nutrition.g_ch_ox > 220)
      alerts.push(t('alerts.carbsHigh'))
    if (nutrition.deficit_h > 140)
      alerts.push(t('alerts.deficitHigh'))
  }

  // ---- Handlers ----
  function handleDistanciaChange(d) {
    setDistancia(d)
    setVelocidadOverride(null)
    setCarreraSeleccionada('')
  }

  function handleCarreraChange(e) {
    const val = e.target.value
    setCarreraSeleccionada(val)
    if (!val) return
    const carrera = TODAS_CARRERAS.find(c => c.value === val)
    if (!carrera) return
    setDesnivel(carrera.desnivel)
    setVelocidadOverride(null)
    if (val.startsWith('70.3') && distancia !== '70.3') setDistancia('70.3')
    if (val.startsWith('full') && distancia !== 'Ironman Full') setDistancia('Ironman Full')
  }

  async function handleShare() {
    if (!results || !nutrition) return
    const raceName = distancia === '70.3' ? t('share.raceName703') : t('share.raceNameFull')
    const texto = [
      `📊 ${t('share.textHeaderPrefix')} ${raceName} — triatlonpacing.com`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `IF: ${results.ifRec.toFixed(2)} | NP: ${results.np.toFixed(0)}W | ${(results.np / (Number(peso) || 1)).toFixed(2)} W/kg`,
      `TSS: ${nutrition.tss} | ${nutrition.kj_totales.toFixed(0)} kJ`,
      ``,
      `⛰️ ${tCat('terrain', 'Subidas')}: ${Math.round(results.subidas)}W`,
      `➡️ ${tCat('terrain', 'Llano')}: ${Math.round(results.llano)}W`,
      `⬇️ ${tCat('terrain', 'Bajadas')}: ${Math.round(results.bajadas)}W`,
      ``,
      `🍌 CH: ${nutrition.g_recomendados.toFixed(0)}g/h | 💧 ${nutrition.ml_h}ml/h | 🧂 ${nutrition.mg_h}mg ${t('share.sodiumWord')}/h`,
      `⏱️ ${t('race.tiempoLabel')}: ${fmtDuracion(duracion)} ${t('race.atConnector')} ${velocidad} km/h`,
      ``,
      `${t('share.ctaPrefix')} triatlonpacing.com`,
    ].join('\n')

    function fallbackTextShare() {
      if (navigator.share) {
        navigator.share({ title: `${t('share.myPacingPrefix')} ${distancia}`, text: texto, url: 'https://triatlonpacing.com' }).catch(() => {})
      } else {
        navigator.clipboard.writeText(texto).then(() => {
          setShareMsg(t('share.copiedMsg'))
          setTimeout(() => setShareMsg(''), 3000)
        })
      }
    }

    const labels = {
      trainerBadge: t('share.image.trainerBadge'),
      myPacing: t('share.image.myPacing'),
      raceName,
      ifLabel: t('share.image.ifLabel'),
      npLabel: t('share.image.npLabel'),
      npWkgLabel: t('share.image.npWkgLabel'),
      tssLabel: t('share.image.tssLabel'),
      terrainTitle: t('share.image.terrainTitle'),
      subidas: tCat('terrain', 'Subidas'),
      llano: tCat('terrain', 'Llano'),
      bajadas: tCat('terrain', 'Bajadas'),
      nutritionTitle: t('share.image.nutritionTitle'),
      carbsLabel: t('share.image.carbsLabel'),
      liquidsLabel: t('share.image.liquidsLabel'),
      sodiumLabel: t('share.image.sodiumLabel'),
      ctaFree: t('share.image.ctaFree'),
      durationLine: `${fmtDuracion(duracion)} · ${distanciaKm} km ${t('race.atConnector')} ${velocidad} km/h`,
    }

    setSharing(true)
    try {
      const blob = await generateShareImageBlob({ results, nutrition, peso, labels })
      const file = new File([blob], 'mi-pacing-triatlonpacing.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${t('share.myPacingPrefix')} ${distancia}`, text: texto })
        return
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mi-pacing-triatlonpacing.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      await navigator.clipboard?.writeText(texto)
      setShareMsg(t('share.downloadedMsg'))
      setTimeout(() => setShareMsg(''), 3500)
    } catch (err) {
      if (err?.name !== 'AbortError') fallbackTextShare()
    } finally {
      setSharing(false)
    }
  }

  return (
    <>
      <SEO />
      {/* HERO */}
      <header className="hero" role="banner">
        <div className="lang-toggle tab-group" role="radiogroup" aria-label="Idioma / Language">
          {['es', 'en'].map(l => (
            <button
              key={l}
              className={`tab-btn${lang === l ? ' active' : ''}`}
              onClick={() => setLang(l)}
              role="radio"
              aria-checked={lang === l}
            >{l.toUpperCase()}</button>
          ))}
        </div>
        <div className="hero-tag fade-up delay-1">{t('hero.badge')}</div>
        <h1 className="fade-up delay-1">
          {t('hero.titleLine1')}<br /><span>{t('hero.titleLine2')}</span>
        </h1>
        <p className="hero-sub fade-up delay-2">{t('hero.subtitle')}</p>
        <p className="hero-author fade-up delay-2">
          {t('hero.authorPrefix')} <strong><a href="https://entrenador-deportes-cicl-h5zi3vi.gamma.site/#card-9bg9tkkaby8ezxr" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Pablo Iglesias Navarrete</a></strong><br />
          {t('hero.authorRole')}
        </p>
        <p className="hero-bizum fade-up delay-2">
          <img src="/bizum-logo.svg" alt={t('hero.bizumAlt')} style={{ width: '48px', height: '48px', verticalAlign: 'middle', marginLeft: '8px', marginRight: '8px'}} /> {t('hero.bizumText')} <strong><a href="tel:+34600254690" style={{ color: 'inherit', textDecoration: 'underline' }}>600 254 690</a></strong>
        </p>
        <InstallPWA />
      </header>

      <main className="app-container" role="main">

        {/* CALCULADORA */}
        <section aria-labelledby="calc-title" style={{marginTop:'40px'}}>
          <p className="section-label" id="calc-title">{t('athlete.sectionLabel')}</p>

          {/* DISTANCIA */}
          <div className="form-card fade-up">
            <div className="field">
              <label>{t('athlete.distanceLabel')}</label>
              <div className="tab-group" role="radiogroup" aria-label={t('athlete.distanceAriaLabel')}>
                {['70.3', 'Ironman Full'].map(d => (
                  <button
                    key={d}
                    className={`tab-btn${distancia === d ? ' active' : ''}`}
                    onClick={() => handleDistanciaChange(d)}
                    role="radio"
                    aria-checked={distancia === d}
                  >{tCat('distancia', d)}</button>
                ))}
              </div>
            </div>
          </div>

          {/* FTP Y PESO */}
          <div className="form-card fade-up">
            <div className="grid-2">
              <div className="field">
                <label htmlFor="ftp">{t('athlete.ftpLabel')}</label>
                <input
                  id="ftp"
                  type="number"
                  min="50" max="500"
                  value={ftp}
                  onChange={e => setFtp(e.target.value === '' ? '' : Number(e.target.value))}
                  aria-describedby="ftp-hint"
                />
                <span className="hint" id="ftp-hint">
                  {t('athlete.ftpHintPrefix')} <strong style={{color:'var(--accent)'}}>{wkg.toFixed(2)} W/kg</strong>
                </span>
              </div>
              <div className="field">
                <label htmlFor="peso">{t('athlete.pesoLabel')}</label>
                <input
                  id="peso"
                  type="number"
                  min="30" max="150" step="0.1"
                  value={peso}
                  onChange={e => setPeso(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* GRASA */}
          <div className="form-card fade-up">
            <div className="field" style={{marginBottom:'16px'}}>
              <label>{t('athlete.fatQuestion')}</label>
              <div className="radio-group" role="radiogroup">
                {[['no', t('athlete.fatNo')], ['si', t('athlete.fatYes')]].map(([val, label]) => (
                  <div
                    key={val}
                    className={`radio-opt${tieneGrasa === val ? ' active' : ''}`}
                    onClick={() => setTieneGrasa(val)}
                    role="radio"
                    aria-checked={tieneGrasa === val}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setTieneGrasa(val)}
                  >
                    <span className="radio-dot" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {tieneGrasa === 'si' && (
              <div className="field">
                <label htmlFor="grasa">{t('athlete.fatPercentLabel')}</label>
                <input
                  id="grasa"
                  type="number"
                  min="3" max="40" step="0.1"
                  value={grasa}
                  onChange={e => setGrasa(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <span className="hint">
                  {t('athlete.profilePrefix')} <strong style={{color:'var(--accent)'}}>{tCat('categoriaPeso', categoriaPeso)}</strong>
                  {pesoMagro && ` · ${t('athlete.leanWeightPrefix')} ${pesoMagro.toFixed(1)} kg`}
                </span>
              </div>
            )}

            {tieneGrasa === 'no' && (
              <p style={{fontSize:'0.85rem', color:'var(--muted)'}}>
                {t('athlete.noFatPrefix')} <strong style={{color:'var(--accent)'}}>{tCat('categoriaPeso', categoriaPeso)}</strong>{t('athlete.noFatSuffix')}
              </p>
            )}
          </div>

          {/* EXPERIENCIA */}
          <div className="form-card fade-up">
            <div className="field">
              <label>{t('athlete.experienceLabel')}</label>
              <div className="tab-group" role="radiogroup" aria-label={t('athlete.experienceAriaLabel')}>
                {['Baja','Media','Alta'].map(e => (
                  <button
                    key={e}
                    className={`tab-btn${experiencia === e ? ' active' : ''}`}
                    onClick={() => setExperiencia(e)}
                    role="radio"
                    aria-checked={experiencia === e}
                  >{tCat('experiencia', e)}</button>
                ))}
              </div>
            </div>
          </div>

        </section>

        {/* DATOS PRUEBA */}
        <section aria-labelledby="prueba-title" style={{marginTop:'32px'}}>
          <p className="section-label" id="prueba-title">{t('race.sectionLabel')}</p>

          {/* SELECTOR DE CARRERA */}
          <div className="form-card fade-up">
            <div className="field">
              <label htmlFor="carrera">{t('race.selectLabel')}</label>
              <select
                id="carrera"
                value={carreraSeleccionada}
                onChange={handleCarreraChange}
              >
                <option value="">{t('race.customOption')}</option>
                <optgroup label={t('race.optgroup703')}>
                  {CARRERAS_703.map(c => (
                    <option key={c.value} value={c.value}>{c.label} · {c.desnivel}m {t('race.elevationSuffix')}</option>
                  ))}
                </optgroup>
                <optgroup label={t('race.optgroupFull')}>
                  {CARRERAS_FULL.map(c => (
                    <option key={c.value} value={c.value}>{c.label} · {c.desnivel}m {t('race.elevationSuffix')}</option>
                  ))}
                </optgroup>
              </select>
              <span className="hint">{t('race.raceSelectHint')}</span>
            </div>
          </div>

          {/* DESNIVEL Y TEMPERATURA */}
          <div className="form-card fade-up">
            <div className="grid-2">
              <div className="field">
                <label htmlFor="desnivel">{t('race.desnivelLabel')}</label>
                <input
                  id="desnivel"
                  type="number"
                  min="0" max="6000" step="50"
                  value={desnivel}
                  onChange={e => {
                    setDesnivel(e.target.value === '' ? '' : Number(e.target.value))
                    setCarreraSeleccionada('')
                  }}
                />
                <span className="hint">
                  {t('race.desnivelCatPrefix')} <strong style={{color:'var(--accent)'}}>{tCat('desnivelCat', desnivelCat)}</strong>
                  {' '}{distancia === '70.3' ? t('race.desnivelHint703') : t('race.desnivelHintFull')}
                </span>
              </div>
              <div className="field">
                <label>{t('race.tempLabel')}</label>
                <div className="tab-group" role="radiogroup" aria-label={t('race.tempAriaLabel')}>
                  {['Fría','Moderada','Calor'].map(tp => (
                    <button
                      key={tp}
                      className={`tab-btn${temp === tp ? ' active' : ''}`}
                      onClick={() => setTemp(tp)}
                      role="radio"
                      aria-checked={temp === tp}
                    >{tCat('temp', tp)}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* VELOCIDAD ESTIMADA */}
          {velocidadEstimada !== null && (
            <div className="form-card fade-up">
              <div className="grid-2">
                <div className="field">
                  <label>{t('race.velocidadLabel')}</label>
                  <input
                    type="number"
                    min="15" max="60" step="0.5"
                    value={velocidad}
                    onChange={e => setVelocidadOverride(e.target.value === '' ? null : Number(e.target.value))}
                    aria-label={t('race.velocidadAriaLabel')}
                  />
                  {velocidadOverride === null ? (
                    <span className="hint">{t('race.velocidadHint')}</span>
                  ) : (
                    <span className="hint">
                      <button
                        onClick={() => setVelocidadOverride(null)}
                        style={{background:'none', border:'none', color:'var(--muted)', cursor:'pointer', padding:'0', fontSize:'inherit', textDecoration:'underline'}}
                      >{t('race.resetVelocidad')} ({velocidadEstimada} km/h)</button>
                    </span>
                  )}
                </div>
                <div className="field">
                  <label>{t('race.tiempoLabel')}</label>
                  <div style={{
                    background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'10px',
                    padding:'12px 16px', fontSize:'1.6rem', fontFamily:'var(--font-display)',
                    fontWeight:900, color:'var(--accent)', letterSpacing:'1px'
                  }}>
                    {fmtDuracion(duracion)}
                  </div>
                  <span className="hint">{distanciaKm} km {t('race.atConnector')} {velocidad} km/h</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* RESULTADOS PACING */}
        {results && nutrition && (<>
          {previousPlan && (
            <section aria-labelledby="progress-title" className="progress-card fade-up" style={{marginTop:'32px'}}>
              <p className="progress-card__title" id="progress-title">
                <Icon name="trendingUp" size={18} className="title-icon" />
                {t('progress.titlePrefix')} {new Date(previousPlan.savedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              {[
                { id: 'ftp', label: t('progress.ftpLabel'), prev: previousPlan.ftp, now: Number(ftp) || 0, unit: 'W' },
                { id: 'wkgFtp', label: t('progress.wkgFtpLabel'), prev: previousPlan.wkg, now: wkg, unit: '', digits: 2 },
                ...(sameDistanciaQuePrevio ? [
                  { id: 'npObjetivo', label: t('progress.npObjetivoLabel'), prev: previousPlan.np, now: results.np, unit: 'W' },
                  { id: 'ifRecomendado', label: t('progress.ifRecomendadoLabel'), prev: previousPlan.ifRec, now: results.ifRec, unit: '', digits: 2 },
                ] : []),
              ].map(({ id, label, prev, now, unit, digits = 0 }) => {
                const delta = now - prev
                const dir = delta > 0.005 ? 'up' : delta < -0.005 ? 'down' : 'flat'
                return (
                  <div className="progress-row" key={id}>
                    <span>{label}</span>
                    <span>
                      {prev.toFixed(digits)}{unit} → <strong>{now.toFixed(digits)}{unit}</strong>{' '}
                      <span className={`progress-delta progress-delta--${dir}`}>
                        {dir === 'up' && <Icon name="trendingUp" size={14} />}
                        {dir === 'down' && <Icon name="trendingDown" size={14} />}
                        {dir === 'flat' ? '±' : ''} {Math.abs(delta).toFixed(digits)}{unit}
                      </span>
                    </span>
                  </div>
                )
              })}
              {!sameDistanciaQuePrevio && (
                <p className="progress-note">
                  {t('progress.notePrefix')} {tCat('distancia', previousPlan.distancia)} {t('progress.noteSuffix')}
                </p>
              )}
            </section>
          )}

          <section aria-labelledby="results-title" className="results-card fade-up" style={{marginTop: previousPlan ? '20px' : '32px'}}>
            <h2 className="results-title" id="results-title"><Icon name="gauge" size={22} className="title-icon" />{t('results.title')}</h2>

            <div className="metrics-grid">
              <div className="metric">
                <div className="metric-value">{results.ifRec.toFixed(2)}</div>
                <div className="metric-label">{t('results.ifRecomendado')}</div>
              </div>
              <div className="metric">
                <div className="metric-value">{results.np.toFixed(0)}W</div>
                <div className="metric-label">{t('results.npObjetivo')}</div>
              </div>
              <div className="metric">
                <div className="metric-value">{wkg.toFixed(2)}</div>
                <div className="metric-label">{t('results.ftpWkg')}</div>
              </div>
              <div className="metric">
                <div className="metric-value">{(results.np / (Number(peso) || 1)).toFixed(2)}</div>
                <div className="metric-label">{t('results.npWkg')}</div>
              </div>
              <div className="metric">
                <div className="metric-value">{nutrition.kj_totales.toFixed(0)}</div>
                <div className="metric-label">{t('results.kjTotales')}</div>
              </div>
              <div className="metric">
                <div className="metric-value">{nutrition.tss}</div>
                <div className="metric-label">{t('results.tss')}</div>
              </div>
              {pesoMagro && (
                <>
                  <div className="metric">
                    <div className="metric-value">{(ftp / pesoMagro).toFixed(2)}</div>
                    <div className="metric-label">{t('results.ftpWkgMagro')}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value">{(results.np / pesoMagro).toFixed(2)}</div>
                    <div className="metric-label">{t('results.npWkgMagro')}</div>
                  </div>
                </>
              )}
            </div>

            <p style={{fontSize:'0.82rem', color:'var(--muted)', marginBottom:'20px'}}>
              {t('results.ifRangePrefix')} <strong style={{color:'var(--text)'}}>{results.ifMin.toFixed(2)} — {results.ifMax.toFixed(2)}</strong>
              {' · '}{t('results.athleteProfilePrefix')} <strong style={{color:'var(--accent)'}}>{tCat('categoriaPeso', categoriaPeso)}</strong>
            </p>

            <div className="terrain-section">
              <p className="terrain-title">{t('results.terrainTitle')}</p>
              {[
                { icon: 'mountain',       name: 'Subidas', w: results.subidas, color: '#ff7a6b' },
                { icon: 'arrowRight',     name: 'Llano',   w: results.llano,   color: '#00d4ff' },
                { icon: 'arrowDownRight', name: 'Bajadas', w: results.bajadas, color: '#00e676' },
              ].map(({ icon, name, w, color }) => (
                <div className="terrain-row" key={icon}>
                  <span className="terrain-icon" style={{ color }}><Icon name={icon} size={20} /></span>
                  <span className="terrain-name">{tCat('terrain', name)}</span>
                  <span className="terrain-watts" style={{ color }}>{Math.round(w)}W</span>
                  <span className="terrain-wkg">{(w / (Number(peso) || 1)).toFixed(2)} W/kg</span>
                </div>
              ))}
            </div>
          </section>

          <div className="form-card fade-up">
            <div className="field">
              <label>{t('gut.label')}</label>
              <div className="tab-group" role="radiogroup" aria-label={t('gut.ariaLabel')}>
                {['Bajo','Medio','Alto','Elite'].map(g => (
                  <button
                    key={g}
                    className={`tab-btn${gut === g ? ' active' : ''}`}
                    onClick={() => setGut(g)}
                    role="radio"
                    aria-checked={gut === g}
                  >{tCat('gut', g)}</button>
                ))}
              </div>
              <span className="hint">{t('gut.hint')}</span>
            </div>
          </div>
        </>)}

        {/* NUTRICIÓN E HIDRATACIÓN */}
        {nutrition && (
          <section aria-labelledby="nutrition-title" className="results-card nutrition fade-up">
            <h2 className="results-title" id="nutrition-title" style={{color:'var(--accent2)'}}><Icon name="droplet" size={22} className="title-icon" />{t('nutrition.title')}</h2>

            <div className="nutrition-grid">
              {/* CARBOHIDRATOS */}
              <div>
                <p className="terrain-title" style={{marginBottom:'16px'}}>{t('nutrition.carbsTitle')}</p>
                <div className="metrics-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))'}}>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--accent2)'}}>{nutrition.g_ch_ox.toFixed(0)}</div>
                    <div className="metric-label">{t('nutrition.oxidationLabel')}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--accent2)'}}>{nutrition.g_recomendados.toFixed(0)}</div>
                    <div className="metric-label">{t('nutrition.intakeLabel')}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--accent2)'}}>{nutrition.total_ch.toFixed(0)}</div>
                    <div className="metric-label">{t('nutrition.totalChLabel')}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value" style={{color:'#ffd166'}}>{nutrition.deficit_h.toFixed(0)}</div>
                    <div className="metric-label">{t('nutrition.deficitLabel')}</div>
                  </div>
                </div>
                <p style={{fontSize:'0.8rem', color:'var(--muted)', marginTop:'10px'}}>
                  {t('nutrition.deficitNote')}
                </p>
              </div>

              {/* HIDRATACIÓN */}
              <div>
                <p className="terrain-title" style={{marginBottom:'16px'}}>{t('nutrition.hydrationTitle')}</p>
                <div className="metrics-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))'}}>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--green)'}}>{nutrition.ml_h}</div>
                    <div className="metric-label">{t('nutrition.mlHourLabel')}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--green)'}}>{nutrition.total_liq.toFixed(0)}</div>
                    <div className="metric-label">{t('nutrition.mlTotalLabel')}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--green)'}}>{nutrition.mg_h}</div>
                    <div className="metric-label">{t('nutrition.sodiumHourLabel')}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--green)'}}>{nutrition.total_sodio.toFixed(0)}</div>
                    <div className="metric-label">{t('nutrition.sodiumTotalLabel')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* PLAN CADA 20 MIN */}
            <div style={{borderTop:'1px solid var(--border)', marginTop:'24px', paddingTop:'20px'}}>
              <p className="terrain-title" style={{marginBottom:'14px'}}>{t('nutrition.planTitle')}</p>
              <div className="metrics-grid" style={{gridTemplateColumns:'repeat(3, 1fr)'}}>
                <div className="metric">
                  <div className="metric-value" style={{color:'var(--accent2)'}}>{nutrition.ch_20.toFixed(0)}</div>
                  <div className="metric-label">{t('nutrition.chLabel')}</div>
                </div>
                <div className="metric">
                  <div className="metric-value" style={{color:'var(--green)'}}>{nutrition.liq_20.toFixed(0)}</div>
                  <div className="metric-label">{t('nutrition.liquidsLabel')}</div>
                </div>
                <div className="metric">
                  <div className="metric-value" style={{color:'var(--green)'}}>{nutrition.sodio_20.toFixed(0)}</div>
                  <div className="metric-label">{t('nutrition.sodiumLabel')}</div>
                </div>
              </div>
            </div>

            {/* COMPARTIR */}
            <div style={{borderTop:'1px solid var(--border)', marginTop:'24px', paddingTop:'20px'}}>
              <button className="share-btn" onClick={handleShare} disabled={sharing} aria-label={t('nutrition.shareAriaLabel')}>
                <Icon name="camera" size={20} />
                {sharing ? t('nutrition.generatingImage') : (shareMsg || t('nutrition.shareButtonText'))}
              </button>
              <p className="hint" style={{textAlign:'center', marginTop:'10px'}}>{t('nutrition.shareHint')}</p>
            </div>
          </section>
        )}

        {/* ALERTAS FISIOLÓGICAS */}
        {alerts.length > 0 && (
          <section aria-labelledby="alerts-title" style={{marginBottom:'24px'}}>
            <p className="section-label" id="alerts-title">{t('alerts.sectionLabel')}</p>
            {alerts.map((msg, i) => (
              <div key={i} className="alert-card"><Icon name="alert" size={20} /><span>{msg}</span></div>
            ))}
          </section>
        )}

        {/* ENTRENA CONMIGO */}
        <section aria-labelledby="cta-title" className="cta-card fade-up">
          <h2 id="cta-title">{t('cta.title')}</h2>
          <p>{t('cta.subtitle')}</p>
          <div className="services-grid">
            {t('cta.services').map(s => (
              <div className="service-item" key={s.icon}>
                <span className="service-icon"><Icon name={s.icon} size={22} /></span>
                <div className="service-text">
                  <strong>{s.title}</strong>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
          <a
            href="https://entrenador-deportes-cicl-h5zi3vi.gamma.site/#card-9bg9tkkaby8ezxr"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-btn"
            style={{ background: 'var(--green)', marginTop: '16px' }}
            aria-label={t('cta.linkAriaLabel')}
          >
            {t('cta.linkText')}
          </a>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-title" className="faq-section">
          <p className="section-label" id="faq-title">{t('faq.title')}</p>
          {t('faq.items').map((f, i) => (
            <article key={i} className={`faq-item${openFaq === i ? ' open' : ''}`}>
              <button
                className="faq-q"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                {f.q}
                <span className="faq-chevron" aria-hidden="true">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && <p className="faq-a">{f.a}</p>}
            </article>
          ))}
        </section>

      </main>

      <footer role="contentinfo">
        <img src="/logo.png" alt={t('footer.logoAlt')} className="hero-logo fade-up" />
        <p>© {new Date().getFullYear()} {t('footer.copyrightSuffix')}</p>
        <p style={{marginTop:'4px', display:'inline-flex', alignItems:'center', gap:'6px', flexWrap:'wrap', justifyContent:'center'}}>
          <Icon name="phone" size={15} style={{ verticalAlign: 'middle' }} />
          <a href="tel:+34600254690" style={{ color: 'inherit', textDecoration: 'underline' }}>600 254 690</a> {t('footer.tagline')}
        </p>
      </footer>

      <ReloadPrompt />
      <Analytics />
    </>
  )
}
