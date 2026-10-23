import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icons.jsx'
import { useLanguage } from './i18n/LanguageContext.js'
import {
  NEWSLETTER_ENABLED,
  PRIVACY_POLICY_URL,
  getPromptState,
  isValidEmail,
  requestSubscription,
  setPromptState,
} from './brevo.js'

// El pop-up espera a que el usuario haya usado la calculadora un rato
const POPUP_MIN_DELAY_MS = 25000
const POPUP_MIN_SCROLL = 0.5

function NewsletterForm({ idPrefix }) {
  const { lang, t } = useLanguage()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | invalid | sending | success | error
  const inputRef = useRef(null)
  const honeypotRef = useRef(null)
  const successRef = useRef(null)
  const sending = status === 'sending'

  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
  }, [status])

  async function handleSubmit(e) {
    e.preventDefault()
    if (sending) return
    const value = email.trim()
    if (!isValidEmail(value)) {
      setStatus('invalid')
      inputRef.current?.focus()
      return
    }
    setStatus('sending')
    try {
      await requestSubscription({ email: value, lang, honeypot: honeypotRef.current?.value ?? '' })
      setEmail('')
      setStatus('success')
      setPromptState('requested')
    } catch {
      setStatus('error')
    }
  }

  const msgId = `${idPrefix}-msg`
  const privacyId = `${idPrefix}-privacy`

  return (
    <form className="newsletter-form" method="post" noValidate onSubmit={handleSubmit}>
      {status !== 'success' && (
        <div className="field">
          <label htmlFor={`${idPrefix}-email`}>{t('newsletter.emailLabel')}</label>
          <div className="newsletter-form__row">
            <input
              ref={inputRef}
              id={`${idPrefix}-email`}
              type="email"
              name="EMAIL"
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              required
              placeholder={t('newsletter.emailPlaceholder')}
              value={email}
              readOnly={sending}
              onChange={e => {
                setEmail(e.target.value)
                if (status === 'invalid' || status === 'error') setStatus('idle')
              }}
              aria-invalid={status === 'invalid'}
              aria-describedby={`${msgId} ${privacyId}`}
            />
            <button type="submit" className="newsletter-btn" aria-disabled={sending}>
              {sending ? t('newsletter.sending') : t('newsletter.submit')}
            </button>
          </div>
          {/* Campo trampa anti-bots de Brevo: invisible para personas y lectores de pantalla */}
          <input
            ref={honeypotRef}
            type="text"
            name="email_address_check"
            defaultValue=""
            className="newsletter-honeypot"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
        </div>
      )}

      <div id={msgId} aria-live="polite">
        {status === 'invalid' && <p className="newsletter-msg newsletter-msg--error">{t('newsletter.invalidEmail')}</p>}
        {status === 'error' && <p className="newsletter-msg newsletter-msg--error">{t('newsletter.error')}</p>}
        {status === 'success' && (
          <div ref={successRef} tabIndex={-1} className="newsletter-msg newsletter-msg--success">
            <strong>{t('newsletter.successTitle')}</strong>
            <p>{t('newsletter.successText')}</p>
          </div>
        )}
      </div>

      <p id={privacyId} className="newsletter-privacy">
        {t('newsletter.privacyNotice')}{' '}
        <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer">
          {t('newsletter.privacyLink')}<span className="sr-only">{t('newsletter.newTab')}</span>
        </a>
      </p>
    </form>
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
      <h2 className="results-title" id="newsletter-title"><Icon name="mail" size={22} className="title-icon" />{t('newsletter.title')}</h2>
      <p className="newsletter-card__intro">{t('newsletter.intro')}</p>
      <NewsletterForm idPrefix="newsletter-inline" />
    </section>
  )
}

function isInlineNewsletterVisible() {
  const el = document.getElementById('newsletter')
  if (!el) return false
  const r = el.getBoundingClientRect()
  return r.top < globalThis.innerHeight && r.bottom > 0
}

// Panel no modal: no roba el foco ni bloquea la página. Se ofrece una vez por sesión,
// tras un tiempo mínimo y cuando el usuario ya ha bajado hasta los resultados.
export function NewsletterPopup() {
  const { t } = useLanguage()
  const [eligible] = useState(() => NEWSLETTER_ENABLED && !getPromptState())
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const returnFocusRef = useRef(null)

  useEffect(() => {
    if (!eligible) return
    let timeReached = false
    let scrollReached = false

    function maybeOpen() {
      if (!timeReached || !scrollReached || isInlineNewsletterVisible()) return
      cleanup()
      if (!getPromptState()) setOpen(true)
    }
    function onScroll() {
      const max = document.documentElement.scrollHeight - globalThis.innerHeight
      if (max > 0 && globalThis.scrollY / max >= POPUP_MIN_SCROLL) scrollReached = true
      maybeOpen()
    }
    const timer = setTimeout(() => {
      timeReached = true
      maybeOpen()
    }, POPUP_MIN_DELAY_MS)
    globalThis.addEventListener('scroll', onScroll, { passive: true })

    function cleanup() {
      clearTimeout(timer)
      globalThis.removeEventListener('scroll', onScroll)
    }
    return cleanup
  }, [eligible])

  const dismiss = useCallback(() => {
    if (getPromptState() !== 'requested') setPromptState('dismissed')
    if (panelRef.current?.contains(document.activeElement)) {
      const target = returnFocusRef.current
      if (target?.isConnected) target.focus()
      else document.activeElement.blur()
    }
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, dismiss])

  if (!eligible) return null

  return (
    <>
      <div className="sr-only" role="status">{open ? t('newsletter.popup.announce') : ''}</div>
      {open && (
        <div
          ref={panelRef}
          className="newsletter-popup"
          role="dialog"
          aria-modal="false"
          aria-labelledby="newsletter-popup-title"
          aria-describedby="newsletter-popup-desc"
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
          <h2 className="newsletter-popup__title" id="newsletter-popup-title">{t('newsletter.popup.title')}</h2>
          <p className="newsletter-popup__text" id="newsletter-popup-desc">{t('newsletter.popup.text')}</p>
          <NewsletterForm idPrefix="newsletter-popup" />
        </div>
      )}
    </>
  )
}
