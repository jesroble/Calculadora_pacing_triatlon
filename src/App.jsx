import { useState, useMemo } from 'react'
import InstallPWA from './InstallPWA.jsx'
import ReloadPrompt from './ReloadPrompt.jsx'

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

function lookup(data, exp, perfil, desnivelCat) {
  const row = data.find(r => r[0] === exp && r[1] === perfil && r[2] === desnivelCat)
  return row ? { ifMin: row[3], ifMax: row[4] } : null
}

function estimarVelocidad(wkg, experiencia, desnivelCat, distancia) {
  const base = 12 + (wkg * 7)
  const expFactor = experiencia === 'Baja' ? 0.94 : experiencia === 'Media' ? 0.97 : 1.0
  const desnFactor = desnivelCat === 'Bajo' ? 1.0 : desnivelCat === 'Medio' ? 0.95 : 0.90
  let v = base * expFactor * desnFactor
  if (distancia !== '70.3') v = Math.min(v, 42)
  return Math.round(v * 10) / 10
}

function fmtDuracion(h) {
  const horas = Math.floor(h)
  const mins = Math.round((h - horas) * 60)
  return `${horas}h ${mins}min`
}

const FAQS = [
  {
    q: "¿Qué es el IF?",
    a: "El Intensity Factor (IF) es la ratio entre la Potencia Normalizada (NP) y el FTP del atleta. Indica la intensidad relativa del esfuerzo. En un Ironman 70.3 suele recomendarse un IF entre 0.70 y 0.85 según experiencia y condiciones."
  },
  {
    q: "¿Cómo calcular el pacing para Ironman 70.3?",
    a: "Necesitas conocer tu FTP (umbral de potencia funcional), peso corporal, experiencia en triatlón y el desnivel del circuito. La calculadora determina el IF recomendado y la Potencia Normalizada (NP) objetivo para que llegues al T2 con energía para correr."
  },
  {
    q: "¿Cuál es la diferencia de pacing entre 70.3 e Ironman Full?",
    a: "En Ironman Full el IF recomendado es considerablemente más bajo (0.60–0.72) que en 70.3 (0.66–0.85), ya que la distancia es el doble y hay que conservar energía para la maratón final de 42 km."
  },
  {
    q: "¿Qué es el TSS?",
    a: "El Training Stress Score (TSS) estima la carga fisiológica total de una sesión. Se calcula como: horas × IF² × 100. Un TSS por encima de 300 indica una prueba extremadamente exigente con alto riesgo de fatiga profunda."
  }
]

export default function App() {
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
  const velocidadEstimada = results ? estimarVelocidad(wkg, experiencia, desnivelCat, distancia) : null
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

  // ---- Alertas ----
  const alerts = []
  if (results && nutrition) {
    if (distancia !== '70.3' && results.ifRec > 0.70)
      alerts.push("IF elevado para Ironman Full. Riesgo alto de degradación en la maratón.")
    if (nutrition.tss > 300)
      alerts.push("TSS muy elevado. Riesgo alto de fatiga acumulada.")
    if (nutrition.g_ch_ox > 220)
      alerts.push("Demanda de carbohidratos extremadamente alta.")
    if (nutrition.deficit_h > 140)
      alerts.push("Déficit energético muy elevado para tu nivel de entrenamiento intestinal. Considera subir de nivel gradualmente.")
  }

  return (
    <>
      {/* HERO */}
      <header className="hero" role="banner">
        <div className="hero-tag fade-up delay-1">Herramienta Profesional Gratuita</div>
        <h1 className="fade-up delay-1">
          Calculadora de<br /><span>Pacing Triatlón</span>
        </h1>
        <p className="hero-sub fade-up delay-2">Ironman 70.3 · Ironman Full</p>
        <p className="hero-author fade-up delay-2">
          Creada por <strong><a href="https://entrenador-deportes-cicl-h5zi3vi.gamma.site/#card-9bg9tkkaby8ezxr" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Pablo Iglesias Navarrete</a></strong><br />
          Entrenador Nacional de Triatlón y Natación
        </p>
        <p className="hero-bizum fade-up delay-2">
          <img src="/bizum-logo.svg" alt="Logo Bizum" style={{ width: '48px', height: '48px', verticalAlign: 'middle', marginLeft: '8px', marginRight: '8px'}} /> Si esta herramienta te ayuda, puedes invitarme a un café o colaborar por Bizum · <strong>600 254 690</strong>
        </p>
        <InstallPWA />
      </header>

      <main className="app-container" role="main">

        {/* CALCULADORA */}
        <section aria-labelledby="calc-title" style={{marginTop:'40px'}}>
          <p className="section-label" id="calc-title">Datos del atleta</p>

          {/* DISTANCIA */}
          <div className="form-card fade-up">
            <div className="field">
              <label>Distancia</label>
              <div className="tab-group" role="radiogroup" aria-label="Distancia del triatlón">
                {['70.3', 'Ironman Full'].map(d => (
                  <button
                    key={d}
                    className={`tab-btn${distancia === d ? ' active' : ''}`}
                    onClick={() => setDistancia(d)}
                    role="radio"
                    aria-checked={distancia === d}
                  >{d}</button>
                ))}
              </div>
            </div>
          </div>

          {/* FTP Y PESO */}
          <div className="form-card fade-up">
            <div className="grid-2">
              <div className="field">
                <label htmlFor="ftp">FTP (vatios)</label>
                <input
                  id="ftp"
                  type="number"
                  min="50" max="500"
                  value={ftp}
                  onChange={e => setFtp(e.target.value === '' ? '' : Number(e.target.value))}
                  aria-describedby="ftp-hint"
                />
                <span className="hint" id="ftp-hint">
                  Tu umbral de potencia funcional · <strong style={{color:'var(--accent)'}}>{wkg.toFixed(2)} W/kg</strong>
                </span>
              </div>
              <div className="field">
                <label htmlFor="peso">Peso corporal (kg)</label>
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
              <label>¿Tienes el dato de % de grasa corporal?</label>
              <div className="radio-group" role="radiogroup">
                {[['no','No'], ['si','Sí']].map(([val, label]) => (
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
                <label htmlFor="grasa">Porcentaje de grasa (%)</label>
                <input
                  id="grasa"
                  type="number"
                  min="3" max="40" step="0.1"
                  value={grasa}
                  onChange={e => setGrasa(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <span className="hint">
                  Perfil: <strong style={{color:'var(--accent)'}}>{categoriaPeso}</strong>
                  {pesoMagro && ` · Peso magro: ${pesoMagro.toFixed(1)} kg`}
                </span>
              </div>
            )}

            {tieneGrasa === 'no' && (
              <p style={{fontSize:'0.85rem', color:'var(--muted)'}}>
                Sin dato de grasa el perfil se basa solo en W/kg: <strong style={{color:'var(--accent)'}}>{categoriaPeso}</strong>. Para mayor precisión, mide tu % con báscula o caliper.
              </p>
            )}
          </div>

          {/* EXPERIENCIA */}
          <div className="form-card fade-up">
            <div className="field">
              <label>Experiencia en triatlón</label>
              <div className="tab-group" role="radiogroup" aria-label="Nivel de experiencia">
                {['Baja','Media','Alta'].map(e => (
                  <button
                    key={e}
                    className={`tab-btn${experiencia === e ? ' active' : ''}`}
                    onClick={() => setExperiencia(e)}
                    role="radio"
                    aria-checked={experiencia === e}
                  >{e}</button>
                ))}
              </div>
            </div>
          </div>

        </section>

        {/* DATOS PRUEBA */}
        <section aria-labelledby="prueba-title" style={{marginTop:'32px'}}>
          <p className="section-label" id="prueba-title">Datos de la prueba</p>

          {/* DESNIVEL Y TEMPERATURA */}
          <div className="form-card fade-up">
            <div className="grid-2">
              <div className="field">
                <label htmlFor="desnivel">Desnivel acumulado (m)</label>
                <input
                  id="desnivel"
                  type="number"
                  min="0" max="6000" step="50"
                  value={desnivel}
                  onChange={e => setDesnivel(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <span className="hint">
                  Categoría calculada: <strong style={{color:'var(--accent)'}}>{desnivelCat}</strong>
                  {distancia === '70.3'
                    ? ' · (70.3: <800m Bajo · 800–1500m Medio · >1500m Alto)'
                    : ' · (Full: <1500m Bajo · 1500–3000m Medio · >3000m Alto)'}
                </span>
              </div>
              <div className="field">
                <label>Temperatura carrera</label>
                <div className="tab-group" role="radiogroup" aria-label="Temperatura ambiental">
                  {['Fría','Moderada','Calor'].map(t => (
                    <button
                      key={t}
                      className={`tab-btn${temp === t ? ' active' : ''}`}
                      onClick={() => setTemp(t)}
                      role="radio"
                      aria-checked={temp === t}
                    >{t}</button>
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
                  <label>Velocidad estimada ciclismo</label>
                  <input
                    type="number"
                    min="15" max="60" step="0.5"
                    value={velocidad}
                    onChange={e => setVelocidadOverride(e.target.value === '' ? null : Number(e.target.value))}
                    aria-label="Velocidad media en km/h"
                  />
                  {velocidadOverride === null ? (
                    <span className="hint">Calculada según W/kg, experiencia y desnivel · Ajusta si la conoces</span>
                  ) : (
                    <span className="hint">
                      <button
                        onClick={() => setVelocidadOverride(null)}
                        style={{background:'none', border:'none', color:'var(--muted)', cursor:'pointer', padding:'0', fontSize:'inherit', textDecoration:'underline'}}
                      >↩ Restablecer estimación ({velocidadEstimada} km/h)</button>
                    </span>
                  )}
                </div>
                <div className="field">
                  <label>Tiempo estimado</label>
                  <div style={{
                    background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'10px',
                    padding:'12px 16px', fontSize:'1.6rem', fontFamily:'var(--font-display)',
                    fontWeight:900, color:'var(--accent)', letterSpacing:'1px'
                  }}>
                    {fmtDuracion(duracion)}
                  </div>
                  <span className="hint">{distanciaKm} km a {velocidad} km/h</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* RESULTADOS PACING */}
        {results && nutrition && (<>
          <section aria-labelledby="results-title" className="results-card fade-up" style={{marginTop:'32px'}}>
            <h2 className="results-title" id="results-title">📊 Tu Pacing Óptimo</h2>

            <div className="metrics-grid">
              <div className="metric">
                <div className="metric-value">{results.ifRec.toFixed(2)}</div>
                <div className="metric-label">IF Recomendado</div>
              </div>
              <div className="metric">
                <div className="metric-value">{results.np.toFixed(0)}W</div>
                <div className="metric-label">NP Objetivo</div>
              </div>
              <div className="metric">
                <div className="metric-value">{wkg.toFixed(2)}</div>
                <div className="metric-label">FTP W/kg</div>
              </div>
              <div className="metric">
                <div className="metric-value">{(results.np / (Number(peso) || 1)).toFixed(2)}</div>
                <div className="metric-label">NP W/kg</div>
              </div>
              <div className="metric">
                <div className="metric-value">{nutrition.kj_totales.toFixed(0)}</div>
                <div className="metric-label">kJ totales</div>
              </div>
              <div className="metric">
                <div className="metric-value">{nutrition.tss}</div>
                <div className="metric-label">TSS</div>
              </div>
              {pesoMagro && (
                <>
                  <div className="metric">
                    <div className="metric-value">{(ftp / pesoMagro).toFixed(2)}</div>
                    <div className="metric-label">FTP W/kg magro</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value">{(results.np / pesoMagro).toFixed(2)}</div>
                    <div className="metric-label">NP W/kg magro</div>
                  </div>
                </>
              )}
            </div>

            <p style={{fontSize:'0.82rem', color:'var(--muted)', marginBottom:'20px'}}>
              Rango IF recomendado: <strong style={{color:'var(--text)'}}>{results.ifMin.toFixed(2)} — {results.ifMax.toFixed(2)}</strong>
              {' · '}Perfil atleta: <strong style={{color:'var(--accent)'}}>{categoriaPeso}</strong>
            </p>

            <div className="terrain-section">
              <p className="terrain-title">Pacing por tipo de terreno</p>
              {[
                { icon: '⛰️', name: 'Subidas', w: results.subidas, color: '#ff6b6b' },
                { icon: '➡️', name: 'Llano',   w: results.llano,   color: '#00d4ff' },
                { icon: '⬇️', name: 'Bajadas', w: results.bajadas, color: '#00e676' },
              ].map(({ icon, name, w, color }) => (
                <div className="terrain-row" key={name}>
                  <span className="terrain-icon">{icon}</span>
                  <span className="terrain-name">{name}</span>
                  <span className="terrain-watts" style={{ color }}>{Math.round(w)}W</span>
                  <span className="terrain-wkg">{(w / (Number(peso) || 1)).toFixed(2)} W/kg</span>
                </div>
              ))}
            </div>
          </section>

            <div className="form-card fade-up">
              <div className="field">
                <label>Entrenamiento intestinal (Gut Training)</label>
                <div className="tab-group" role="radiogroup" aria-label="Nivel de entrenamiento intestinal">
                  {['Bajo','Medio','Alto','Elite'].map(g => (
                    <button
                      key={g}
                      className={`tab-btn${gut === g ? ' active' : ''}`}
                      onClick={() => setGut(g)}
                      role="radio"
                      aria-checked={gut === g}
                    >{g}</button>
                  ))}
                </div>
                <span className="hint">Capacidad del intestino para absorber carbohidratos durante el esfuerzo</span>
              </div>
            </div>
          </>)}

        {/* NUTRICIÓN E HIDRATACIÓN */}
        {nutrition && (
          <section aria-labelledby="nutrition-title" className="results-card nutrition fade-up">
            <h2 className="results-title" id="nutrition-title" style={{color:'var(--accent2)'}}>Nutrición e Hidratación</h2>

            <div className="nutrition-grid">
              {/* CARBOHIDRATOS */}
              <div>
                <p className="terrain-title" style={{marginBottom:'16px'}}>Carbohidratos</p>
                <div className="metrics-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))'}}>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--accent2)'}}>{nutrition.g_ch_ox.toFixed(0)}</div>
                    <div className="metric-label">g oxidación/h</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--accent2)'}}>{nutrition.g_recomendados.toFixed(0)}</div>
                    <div className="metric-label">g ingesta/h</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--accent2)'}}>{nutrition.total_ch.toFixed(0)}</div>
                    <div className="metric-label">g CH totales</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value" style={{color:'#ffd166'}}>{nutrition.deficit_h.toFixed(0)}</div>
                    <div className="metric-label">g déficit/h</div>
                  </div>
                </div>
                <p style={{fontSize:'0.8rem', color:'var(--muted)', marginTop:'10px'}}>
                  No es posible reponer el 100% del gasto. El déficit es fisiológicamente normal en competición.
                </p>
              </div>

              {/* HIDRATACIÓN */}
              <div>
                <p className="terrain-title" style={{marginBottom:'16px'}}>Hidratación</p>
                <div className="metrics-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))'}}>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--green)'}}>{nutrition.ml_h}</div>
                    <div className="metric-label">ml / hora</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--green)'}}>{nutrition.total_liq.toFixed(0)}</div>
                    <div className="metric-label">ml totales</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--green)'}}>{nutrition.mg_h}</div>
                    <div className="metric-label">mg sodio/h</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--green)'}}>{nutrition.total_sodio.toFixed(0)}</div>
                    <div className="metric-label">mg sodio total</div>
                  </div>
                </div>
              </div>
            </div>

            {/* PLAN CADA 20 MIN */}
            <div style={{borderTop:'1px solid var(--border)', marginTop:'24px', paddingTop:'20px'}}>
              <p className="terrain-title" style={{marginBottom:'14px'}}>Plan cada 20 minutos</p>
              <div className="metrics-grid" style={{gridTemplateColumns:'repeat(3, 1fr)'}}>
                <div className="metric">
                  <div className="metric-value" style={{color:'var(--accent2)'}}>{nutrition.ch_20.toFixed(0)}</div>
                  <div className="metric-label">g CH</div>
                </div>
                <div className="metric">
                  <div className="metric-value" style={{color:'var(--green)'}}>{nutrition.liq_20.toFixed(0)}</div>
                  <div className="metric-label">ml líquidos</div>
                </div>
                <div className="metric">
                  <div className="metric-value" style={{color:'var(--green)'}}>{nutrition.sodio_20.toFixed(0)}</div>
                  <div className="metric-label">mg sodio</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ALERTAS FISIOLÓGICAS */}
        {alerts.length > 0 && (
          <section aria-labelledby="alerts-title" style={{marginBottom:'24px'}}>
            <p className="section-label" id="alerts-title">Análisis fisiológico</p>
            {alerts.map((msg, i) => (
              <div key={i} className="alert-card">⚠️ {msg}</div>
            ))}
          </section>
        )}

        {/* ENTRENA CONMIGO */}
        <section aria-labelledby="cta-title" className="cta-card fade-up">
          <h2 id="cta-title">Entrena Conmigo</h2>
          <p>Planificación científica personalizada para triatletas de todos los niveles</p>
          <div className="services-grid">
            {[
              { icon: '🏊', title: 'Natación técnica', desc: 'Eficiencia y técnica para el segmento más temido' },
              { icon: '🚴', title: 'Ciclismo y pacing', desc: 'Control del esfuerzo y potencia en carretera' },
              { icon: '🏃', title: 'Carrera a pie', desc: 'Gestión de carga y ritmo en la maratón' },
              { icon: '🧠', title: 'Planificación científica', desc: 'Seguimiento semanal con datos reales' },
              { icon: '📊', title: 'Análisis de datos', desc: 'W/kg, NP, TSS, IF, HRV y más métricas' },
              { icon: '🌿', title: 'Adaptación total', desc: 'Compatible con tu vida, trabajo y familia' },
            ].map(s => (
              <div className="service-item" key={s.title}>
                <span className="service-icon">{s.icon}</span>
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
            aria-label="Visitar el blog de Pablo Iglesias Navarrete para ver tarifas y servicios"
          >
            Ver Tarifas y Servicios
          </a>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-title" className="faq-section">
          <p className="section-label" id="faq-title">Preguntas Frecuentes</p>
          {FAQS.map((f, i) => (
            <article key={i} className="faq-item">
              <h3 className="faq-q">{f.q}</h3>
              <p className="faq-a">{f.a}</p>
            </article>
          ))}
        </section>

      </main>

      <footer role="contentinfo">
        <img src="/logo.png" alt="Logo Pablo Iglesias Navarrete — Entrenador Triatlón" className="hero-logo fade-up" />
        <p>© {new Date().getFullYear()} Pablo Iglesias Navarrete · Entrenador Nacional de Triatlón y Natación</p>
        <p style={{marginTop:'4px'}}>📞 600 254 690 · Herramienta gratuita de pacing para triatlón</p>
      </footer>

      <ReloadPrompt />
    </>
  )
}
