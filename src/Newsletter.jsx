import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icons.jsx'
import { useLanguage } from './i18n/LanguageContext.js'
import {
  FORM_URL,
  NEWSLETTER_ENABLED,
  PRIVACY_POLICY_URL,
  getPromptState,
  setPromptState,
} from './brevo.js'

// El pop-up se abre solo a los 15 s o al bajar el 40 % de la página, lo que ocurra antes
const POPUP_DELAY_MS = 15000
const POPUP_SCROLL = 0.4
const OPEN_EVENT = 'triatlonpacing:open-newsletter'

// Zona del formulario de Brevo que se ve en la vista previa, en px del iframe a 540 px de
// ancho: la cabecera "Entrenamiento, ciencia y rendimiento" y su texto. Si Pablo cambia el
// diseño del formulario en Brevo, hay que reajustar estos valores.
const PREVIEW_FRAME = { width: 540, height: 400 }
const PREVIEW_CROP = { left: 20, top: 40, width: 500, height: 196 }

// Formulario alojado por Brevo (el que entrega el titular desde su panel)
function BrevoForm() {
  const { t } = useLanguage()
  return (
    <>
      <iframe
        className="newsletter-iframe"
        src={FORM_URL}
        title={t('newsletter.iframeTitle')}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <p className="newsletter-privacy">
        {t('newsletter.privacyNotice')}{' '}
        <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer">
          {t('newsletter.privacyLink')}<span className="sr-only">{t('newsletter.newTab')}</span>
        </a>
      </p>
    </>
  )
}

// Recorte no interactivo del formulario, escalado para que siempre se vea la misma zona
function BrevoPreview() {
  const frameRef = useRef(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / PREVIEW_CROP.width))
    })
    observer.observe(frameRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={frameRef} className="newsletter-preview__frame" style={{ height: PREVIEW_CROP.height * scale }} inert>
      <iframe
        src={FORM_URL}
        title=""
        aria-hidden="true"
        tabIndex={-1}
        scrolling="no"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        style={{
          width: PREVIEW_FRAME.width,
          height: PREVIEW_FRAME.height,
          transform: `scale(${scale}) translate(${-PREVIEW_CROP.left}px, ${-PREVIEW_CROP.top}px)`,
        }}
      />
    </div>
  )
}

export function NewsletterSection() {
  const { t } = useLanguage()

  if (!NEWSLETTER_ENABLED) {
    if (!import.meta.env.DEV) return null
    return (
      <div className="newsletter-card newsletter-card--dev" role="note">
        [DEV] Newsletter sin configurar: define VITE_BREVO_FORM_ACTION_URL en .env.local (ver .env.example).
        En producción esta sección y el pop-up no se muestran hasta configurarla.
      </div>
    )
  }

  return (
    <section id="newsletter" aria-labelledby="newsletter-title" className="newsletter-card fade-up">
      <h2 className="results-title" id="newsletter-title"><Icon name="mail" size={22} className="title-icon" />{t('newsletter.sectionTitle')}</h2>
      <div className="newsletter-preview">
        <BrevoPreview />
        <button
          type="button"
          className="newsletter-preview__btn"
          aria-haspopup="dialog"
          aria-label={t('newsletter.previewAriaLabel')}
          onClick={() => globalThis.dispatchEvent(new Event(OPEN_EVENT))}
        />
      </div>
    </section>
  )
}

// Panel no modal. Se abre solo una vez por sesión, o cuando el usuario pulsa la vista
// previa de la sección; en ese caso recibe el foco porque lo ha pedido el usuario.
export function NewsletterPopup() {
  const { t } = useLanguage()
  const [autoEligible] = useState(() => NEWSLETTER_ENABLED && !getPromptState())
  const [open, setOpen] = useState(false)
  const [openedByUser, setOpenedByUser] = useState(false)
  const panelRef = useRef(null)
  const returnFocusRef = useRef(null)

  useEffect(() => {
    if (!autoEligible) return

    function openOnce() {
      cleanup()
      if (!getPromptState()) setOpen(true)
    }
    function onScroll() {
      const max = document.documentElement.scrollHeight - globalThis.innerHeight
      if (max > 0 && globalThis.scrollY / max >= POPUP_SCROLL) openOnce()
    }
    const timer = setTimeout(openOnce, POPUP_DELAY_MS)
    globalThis.addEventListener('scroll', onScroll, { passive: true })

    function cleanup() {
      clearTimeout(timer)
      globalThis.removeEventListener('scroll', onScroll)
    }
    return cleanup
  }, [autoEligible])

  useEffect(() => {
    if (!NEWSLETTER_ENABLED) return
    function onOpenRequest() {
      returnFocusRef.current = document.activeElement
      setOpenedByUser(true)
      setOpen(true)
    }
    globalThis.addEventListener(OPEN_EVENT, onOpenRequest)
    return () => globalThis.removeEventListener(OPEN_EVENT, onOpenRequest)
  }, [])

  useEffect(() => {
    if (open && openedByUser) panelRef.current?.focus()
  }, [open, openedByUser])

  const dismiss = useCallback(() => {
    setPromptState('dismissed')
    if (panelRef.current?.contains(document.activeElement)) {
      const target = returnFocusRef.current
      if (target?.isConnected) target.focus()
      else document.activeElement.blur()
    }
    setOpen(false)
    setOpenedByUser(false)
  }, [])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, dismiss])

  if (!NEWSLETTER_ENABLED) return null

  return (
    <>
      <div className="sr-only" role="status">{open && !openedByUser ? t('newsletter.popup.announce') : ''}</div>
      {open && (
        <div
          ref={panelRef}
          className="newsletter-popup"
          role="dialog"
          aria-modal="false"
          aria-label={t('newsletter.iframeTitle')}
          tabIndex={-1}
          onFocus={e => {
            if (e.relatedTarget && !panelRef.current?.contains(e.relatedTarget)) returnFocusRef.current = e.relatedTarget
          }}
        >
          <button
            type="button"
            className="newsletter-popup__close"
            aria-label={t('newsletter.popup.closeAriaLabel')}
            onClick={dismiss}
          >
            <Icon name="close" size={18} />
          </button>
          <BrevoForm />
        </div>
      )}
    </>
  )
}
