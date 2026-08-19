import { useEffect, useState } from 'react'
import Icon from './Icons.jsx'
import { useLanguage } from './i18n/LanguageContext.js'

function isStandalone() {
  return (
    globalThis.matchMedia('(display-mode: standalone)').matches ||
    globalThis.navigator.standalone === true
  )
}

function isIOS() {
  const ua = globalThis.navigator.userAgent
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isMacSafari() {
  const ua = globalThis.navigator.userAgent
  return (
    /Macintosh/i.test(ua) &&
    /Safari/i.test(ua) &&
    !/Chrome|Chromium|Edg/i.test(ua)
  )
}

function IOSGuide() {
  const { t } = useLanguage()
  return (
    <div className="install-guide">
      <p className="install-guide__title">{t('installPwa.iosTitle')}</p>
      <ol className="install-guide__steps">
        <li>
          <span className="install-guide__step-icon">1</span>
          <span>{t('installPwa.iosStep1Prefix')} <strong>{t('installPwa.iosStep1Button')}</strong> <Icon name="share" size={15} className="install-guide__symbol" /> {t('installPwa.iosStep1Suffix')}</span>
        </li>
        <li>
          <span className="install-guide__step-icon">2</span>
          <span>{t('installPwa.iosStep2Prefix')} <strong>{t('installPwa.iosStep2Button')}</strong></span>
        </li>
        <li>
          <span className="install-guide__step-icon">3</span>
          <span>{t('installPwa.iosStep3Prefix')} <strong>{t('installPwa.iosStep3Button')}</strong> {t('installPwa.iosStep3Suffix')}</span>
        </li>
      </ol>
    </div>
  )
}

function MacSafariGuide() {
  const { t } = useLanguage()
  return (
    <div className="install-guide">
      <p className="install-guide__title">{t('installPwa.macTitle')}</p>
      <ol className="install-guide__steps">
        <li>
          <span className="install-guide__step-icon">1</span>
          <span>{t('installPwa.macStep1Prefix')} <strong>{t('installPwa.macStep1Button')}</strong></span>
        </li>
        <li>
          <span className="install-guide__step-icon">2</span>
          <span>{t('installPwa.macStep2Prefix')} <strong>{t('installPwa.macStep2Button')}</strong></span>
        </li>
        <li>
          <span className="install-guide__step-icon">3</span>
          <span>{t('installPwa.macStep3Prefix')} <strong>{t('installPwa.macStep3Button')}</strong></span>
        </li>
      </ol>
      <p className="install-guide__note">{t('installPwa.macNote')}</p>
    </div>
  )
}

export default function InstallPWA() {
  const { t } = useLanguage()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(isStandalone())
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    globalThis.addEventListener('beforeinstallprompt', onBeforeInstall)
    globalThis.addEventListener('appinstalled', onInstalled)
    return () => {
      globalThis.removeEventListener('beforeinstallprompt', onBeforeInstall)
      globalThis.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null

  const ios = isIOS()
  const macSaf = isMacSafari()

  // Chrome / Edge en Android o escritorio: prompt nativo disponible
  if (deferredPrompt) {
    return (
      <div className="install-pwa fade-up delay-2">
        <button
          type="button"
          className="install-btn"
          onClick={async () => {
            deferredPrompt.prompt()
            await deferredPrompt.userChoice
            setDeferredPrompt(null)
          }}
        >
          <Icon name="download" size={18} /> {t('installPwa.installButton')}
        </button>
      </div>
    )
  }

  // Safari en iOS o macOS: mostrar botón que abre guía
  if (ios || macSaf) {
    return (
      <div className="install-pwa fade-up delay-2">
        <button
          type="button"
          className="install-btn install-btn--outline"
          onClick={() => setShowGuide((v) => !v)}
          aria-expanded={showGuide}
        >
          <Icon name="download" size={18} /> {showGuide ? t('installPwa.hideGuide') : t('installPwa.showGuide')}
        </button>
        {showGuide && (ios ? <IOSGuide /> : <MacSafariGuide />)}
      </div>
    )
  }

  return null
}
