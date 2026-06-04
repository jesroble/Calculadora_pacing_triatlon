import { useEffect, useState } from 'react'

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
  return (
    <div className="install-guide">
      <p className="install-guide__title">Instalar en iPhone / iPad</p>
      <ol className="install-guide__steps">
        <li>
          <span className="install-guide__step-icon">1</span>
          <span>Pulsa el botón <strong>Compartir</strong> <span className="install-guide__symbol">⬆</span> en la barra inferior de Safari</span>
        </li>
        <li>
          <span className="install-guide__step-icon">2</span>
          <span>Desplázate y toca <strong>«Añadir a pantalla de inicio»</strong></span>
        </li>
        <li>
          <span className="install-guide__step-icon">3</span>
          <span>Pulsa <strong>«Añadir»</strong> — aparecerá el icono en tu pantalla</span>
        </li>
      </ol>
    </div>
  )
}

function MacSafariGuide() {
  return (
    <div className="install-guide">
      <p className="install-guide__title">Instalar en Mac con Safari</p>
      <ol className="install-guide__steps">
        <li>
          <span className="install-guide__step-icon">1</span>
          <span>En el menú superior de Safari, ve a <strong>Archivo</strong></span>
        </li>
        <li>
          <span className="install-guide__step-icon">2</span>
          <span>Selecciona <strong>«Añadir al Dock...»</strong></span>
        </li>
        <li>
          <span className="install-guide__step-icon">3</span>
          <span>Confirma pulsando <strong>«Añadir»</strong></span>
        </li>
      </ol>
      <p className="install-guide__note">Requiere Safari 17 · macOS Sonoma o superior</p>
    </div>
  )
}

export default function InstallPWA() {
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
          <span aria-hidden="true">📲</span> Instalar app
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
          <span aria-hidden="true">📲</span> {showGuide ? 'Ocultar guía' : 'Cómo instalar'}
        </button>
        {showGuide && (ios ? <IOSGuide /> : <MacSafariGuide />)}
      </div>
    )
  }

  return null
}
