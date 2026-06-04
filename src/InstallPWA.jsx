import { useEffect, useState } from 'react'

// Detecta si la app ya está abierta como instalada (standalone)
function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

// Detecta iOS (incluido iPadOS, que se presenta como Mac con pantalla táctil)
function isIOS() {
  const ua = window.navigator.userAgent
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(isStandalone())
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    // Android / Chrome / Edge: el navegador avisa de que la PWA es instalable
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    // Tras instalar, ocultamos el botón
    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // Ya instalada: no mostramos nada
  if (installed) return null

  const ios = isIOS()

  // Sin prompt nativo disponible y no es iOS: no hay nada que ofrecer
  if (!deferredPrompt && !ios) return null

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
      return
    }
    // iOS: no existe prompt programático, mostramos las instrucciones
    setShowIosHint((v) => !v)
  }

  return (
    <div className="install-pwa fade-up delay-2">
      <button type="button" className="install-btn" onClick={handleClick}>
        <span aria-hidden="true">📲</span> Instalar app
      </button>

      {ios && showIosHint && (
        <p className="install-hint">
          En iPhone/iPad: pulsa <strong>Compartir</strong> <span aria-hidden="true">⬆️</span> y
          luego <strong>«Añadir a pantalla de inicio»</strong>.
        </p>
      )}
    </div>
  )
}
