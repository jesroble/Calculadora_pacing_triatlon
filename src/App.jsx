import { useState, useMemo } from 'react'

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

function lookup(data, exp, peso, desnivel) {
  const row = data.find(r => r[0] === exp && r[1] === peso && r[2] === desnivel)
  return row ? { ifMin: row[3], ifMax: row[4] } : null
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
    q: "¿Qué es el FTP?",
    a: "FTP (Functional Threshold Power) es la potencia máxima, medida en vatios, que un ciclista puede mantener de forma constante durante aproximadamente una hora. Se utiliza como referencia para evaluar el rendimiento y establecer zonas de entrenamiento."
  }
]

export default function App() {
  const [distancia, setDistancia] = useState('70.3')
  const [ftp, setFtp] = useState(250)
  const [peso, setPeso] = useState(70)
  const [tieneGrasa, setTieneGrasa] = useState('no')
  const [grasa, setGrasa] = useState(15)
  const [experiencia, setExperiencia] = useState('Media')
  const [desnivel, setDesnivel] = useState('Medio')
  const [metodo, setMetodo] = useState('velocidad')
  const [velocidad, setVelocidad] = useState(32)
  const [duracionManual, setDuracionManual] = useState(3)
  const [temp, setTemp] = useState('Moderada')

  const pesoMagro = tieneGrasa === 'si' ? peso * (1 - grasa / 100) : null
  const categoriaPeso = tieneGrasa !== 'si' ? 'Medio' : grasa < 10 ? 'Ligero' : grasa <= 15 ? 'Medio' : 'Pesado'

  const distanciaKm = distancia === '70.3' ? 90 : 180
  const duracion = metodo === 'velocidad' ? distanciaKm / velocidad : duracionManual

  const results = useMemo(() => {
    const data = distancia === '70.3' ? DATA_703 : DATA_FULL
    const r = lookup(data, experiencia, categoriaPeso, desnivel)
    if (!r) return null
    const ifRec = (r.ifMin + r.ifMax) / 2
    const np = ftp * ifRec
    let subidas, llano, bajadas
    if (distancia === '70.3') {
      subidas = ftp * (ifRec + 0.08)
      llano   = ftp * (ifRec - 0.02)
      bajadas = ftp * (ifRec - 0.10)
    } else {
      subidas = ftp * (ifRec + 0.05)
      llano   = ftp * (ifRec - 0.01)
      bajadas = ftp * (ifRec - 0.08)
    }
    return { ifMin: r.ifMin, ifMax: r.ifMax, ifRec, np, subidas, llano, bajadas }
  }, [distancia, ftp, peso, experiencia, desnivel, categoriaPeso])

  const maxW = results ? Math.max(results.subidas, results.llano, results.bajadas) : 1

  const nutrition = useMemo(() => {
    if (!results) return null
    const { ifRec, np } = results
    const kj_h = np * 3.6
    let ch_base = 0.25 + 0.75 * ifRec
    ch_base = Math.max(0.4, Math.min(ch_base, 0.9))
    let dur_factor = 1 - 0.05 * (duracion - 1)
    dur_factor = Math.max(0.75, dur_factor)
    const ch_pct = ch_base * dur_factor
    const g_ch_h_raw = (kj_h * ch_pct) / 4
    let limite
    if (experiencia === 'Baja') limite = 60
    else if (experiencia === 'Media') limite = 80
    else limite = 100
    const g_final = Math.min(g_ch_h_raw, limite)
    const total_ch = g_final * duracion
    let hydration
    if (temp === 'Fría') hydration = { ml: 500, mg: 400 }
    else if (temp === 'Moderada') hydration = { ml: 750, mg: 600 }
    else hydration = { ml: 1000, mg: 900 }
    return {
      g_ch_h: g_final,
      total_ch,
      ml_h: hydration.ml,
      mg_h: hydration.mg,
      total_liq: hydration.ml * duracion,
      total_sodio: hydration.mg * duracion,
    }
  }, [results, duracion, temp, experiencia])

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
      </header>

      <main className="app-container" role="main">

        {/* CALCULADORA */}
        <section aria-labelledby="calc-title" style={{marginTop:'40px'}}>
          <p className="section-label" id="calc-title">Calculadora</p>

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
                  onChange={e => setFtp(Number(e.target.value))}
                  aria-describedby="ftp-hint"
                />
                <span className="hint" id="ftp-hint">Tu umbral de potencia funcional</span>
              </div>
              <div className="field">
                <label htmlFor="peso">Peso corporal (kg)</label>
                <input
                  id="peso"
                  type="number"
                  min="30" max="150" step="0.1"
                  value={peso}
                  onChange={e => setPeso(Number(e.target.value))}
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
                  onChange={e => setGrasa(Number(e.target.value))}
                />
                <span className="hint">
                  Categoría asignada: <strong style={{color:'var(--accent)'}}>{categoriaPeso}</strong>
                  {pesoMagro && ` · Peso magro: ${pesoMagro.toFixed(1)} kg`}
                </span>
              </div>
            )}

            {tieneGrasa === 'no' && (
              <p style={{fontSize:'0.85rem', color:'var(--muted)'}}>
                Sin dato de grasa se asignará categoría <strong style={{color:'var(--accent)'}}>Medio</strong>. Para mayor precisión, mide tu % con báscula o caliper.
              </p>
            )}
          </div>

          {/* EXPERIENCIA Y DESNIVEL */}
          <div className="form-card fade-up">
            <div className="grid-2">
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
              <div className="field">
                <label>Desnivel del circuito</label>
                <div className="tab-group" role="radiogroup" aria-label="Desnivel del circuito de ciclismo">
                  {['Bajo','Medio','Alto'].map(d => (
                    <button
                      key={d}
                      className={`tab-btn${desnivel === d ? ' active' : ''}`}
                      onClick={() => setDesnivel(d)}
                      role="radio"
                      aria-checked={desnivel === d}
                    >{d}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TIEMPO Y TEMPERATURA */}
          <div className="form-card fade-up">
            <div className="grid-2">
              <div className="field">
                <label>Estimar duración por</label>
                <div className="tab-group" role="radiogroup" aria-label="Método de estimación de duración">
                  {[['velocidad','Velocidad'],['manual','Manual']].map(([val, label]) => (
                    <button
                      key={val}
                      className={`tab-btn${metodo === val ? ' active' : ''}`}
                      onClick={() => setMetodo(val)}
                      role="radio"
                      aria-checked={metodo === val}
                    >{label}</button>
                  ))}
                </div>
                {metodo === 'velocidad' ? (
                  <div style={{marginTop:'12px'}}>
                    <input
                      type="number"
                      min="15" max="60" step="0.5"
                      value={velocidad}
                      onChange={e => setVelocidad(Number(e.target.value))}
                      aria-label="Velocidad media en km/h"
                    />
                    <span className="hint">km/h · {distanciaKm} km → <strong style={{color:'var(--accent)'}}>{duracion.toFixed(2)} h</strong></span>
                  </div>
                ) : (
                  <div style={{marginTop:'12px'}}>
                    <input
                      type="number"
                      min="1" max="12" step="0.1"
                      value={duracionManual}
                      onChange={e => setDuracionManual(Number(e.target.value))}
                      aria-label="Duración estimada en horas"
                    />
                    <span className="hint">horas</span>
                  </div>
                )}
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
        </section>

        {/* RESULTADOS */}
        {results && (
          <section aria-labelledby="results-title" className="results-card fade-up">
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
                <div className="metric-value">{(ftp / peso).toFixed(2)}</div>
                <div className="metric-label">FTP W/kg</div>
              </div>
              <div className="metric">
                <div className="metric-value">{(results.np / peso).toFixed(2)}</div>
                <div className="metric-label">NP W/kg</div>
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
                  <span className="terrain-wkg">{(w / peso).toFixed(2)} W/kg</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* NUTRICIÓN E HIDRATACIÓN */}
        {nutrition && (
          <section aria-labelledby="nutrition-title" className="results-card nutrition fade-up">
            <h2 className="results-title" id="nutrition-title" style={{color:'var(--accent2)'}}>🍌 Nutrición e Hidratación</h2>

            <div className="nutrition-grid">
              <div>
                <p className="terrain-title" style={{marginBottom:'16px'}}>Carbohidratos</p>
                <div className="metrics-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))'}}>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--accent2)'}}>{nutrition.g_ch_h.toFixed(0)}</div>
                    <div className="metric-label">g CH / hora</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--accent2)'}}>{nutrition.total_ch.toFixed(0)}</div>
                    <div className="metric-label">g CH totales</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--accent2)'}}>{duracion.toFixed(2)}</div>
                    <div className="metric-label">Horas carrera</div>
                  </div>
                </div>
              </div>

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
                    <div className="metric-label">mg sodio / h</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value" style={{color:'var(--green)'}}>{nutrition.total_sodio.toFixed(0)}</div>
                    <div className="metric-label">mg sodio total</div>
                  </div>
                </div>
              </div>
            </div>
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

        {/* FAQ — SEO muy importante */}
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
    </>
  )
}
