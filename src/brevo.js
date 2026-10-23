// Suscripción a la newsletter mediante el formulario oficial de Brevo.
// El doble opt-in se activa y se aplica en el panel de Brevo (formulario con
// "Doble confirmación"): aquí solo se envía el email al endpoint del formulario,
// igual que hace el script oficial de Brevo (POST a `action?isAjax=1`).
//
// La URL `action` del formulario es pública (aparece en el HTML que genera Brevo).
// NO es una clave API. Nunca pongas una API key de Brevo en VITE_* ni en el repo:
// todo lo que empieza por VITE_ acaba en el navegador.

const BREVO_HOST_RE = /^([a-z0-9-]+\.)*sibforms\.com$/i
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/
const PROMPT_KEY = 'triatlonpacing:newsletterPrompt' // sessionStorage: 'dismissed' | 'requested'

function parseFormUrl(raw, name) {
  if (!raw) return null
  try {
    const url = new URL(raw)
    const isServePath = url.pathname.startsWith('/serve/') || url.pathname.startsWith('/v2/serve/')
    if (url.protocol === 'https:' && BREVO_HOST_RE.test(url.hostname) && isServePath && !url.search) {
      return url.toString()
    }
  } catch {
    // URL mal formada — se avisa abajo
  }
  if (import.meta.env.DEV) console.warn(`[newsletter] ${name} no es una URL de formulario de Brevo válida (https://….sibforms.com/serve/… o /v2/serve/…)`)
  return null
}

const FORM_URL = parseFormUrl(import.meta.env.BREVO_FORM_ACTION_URL, 'VITE_BREVO_FORM_ACTION_URL')

// Página estática en privacidad/index.html (también enlazada desde el footer)
export const PRIVACY_POLICY_URL = '/privacidad/'

// Sin formulario de Brevo configurado no se muestra nada en producción.
export const NEWSLETTER_ENABLED = Boolean(FORM_URL)

export function isValidEmail(value) {
  return value.length <= 254 && EMAIL_RE.test(value)
}

// Resuelve si Brevo acepta la solicitud (el contacto queda pendiente de confirmar
// por email) y lanza un error en cualquier otro caso. Solo se envía el email: ningún
// dato de la calculadora.
export async function requestSubscription({ email, lang, honeypot }) {
  if (!FORM_URL) throw new Error('newsletter-not-configured')

  const body = new FormData()
  body.append('EMAIL', email)
  body.append('email_address_check', honeypot) // campo trampa anti-bots que espera Brevo
  body.append('locale', lang)

  const res = await fetch(`${FORM_URL}?isAjax=1`, { method: 'POST', body, credentials: 'omit' })
  const data = await res.json().catch(() => null)
  if (!res.ok || data?.success !== true) throw new Error('newsletter-rejected')
}

// Preferencia de la sesión actual para no repetir el pop-up. sessionStorage se borra
// al cerrar la pestaña, no se envía a ningún servidor y no guarda el email.
export function getPromptState() {
  try {
    return sessionStorage.getItem(PROMPT_KEY)
  } catch {
    return null
  }
}

export function setPromptState(value) {
  try {
    sessionStorage.setItem(PROMPT_KEY, value)
  } catch {
    // sessionStorage no disponible (modo privado...) — el pop-up solo se cierra en memoria
  }
}
