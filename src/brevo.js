// Newsletter: formulario alojado por Brevo, incrustado en un <iframe>.
// El doble opt-in se activa y se aplica en el panel de Brevo (formulario con
// "Doble confirmación"); el email se escribe dentro del iframe y la web nunca lo ve.
//
// La URL del formulario es pública (es el src del iframe que genera Brevo).
// NO es una clave API. Nunca pongas una API key de Brevo en VITE_* ni en el repo:
// todo lo que empieza por VITE_ acaba en el navegador.

const BREVO_HOST_RE = /^([a-z0-9-]+\.)*sibforms\.com$/i
const PROMPT_KEY = 'triatlonpacing:newsletterPrompt' // sessionStorage: 'dismissed'

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

export const FORM_URL = parseFormUrl(import.meta.env.VITE_BREVO_FORM_ACTION_URL, 'VITE_BREVO_FORM_ACTION_URL')

// Página estática en privacidad/index.html (también enlazada desde el footer)
export const PRIVACY_POLICY_URL = '/privacidad/'

// Sin formulario de Brevo configurado no se muestra nada en producción.
export const NEWSLETTER_ENABLED = Boolean(FORM_URL)

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
