import { useRegisterSW } from 'virtual:pwa-register/react'
import Icon from './Icons.jsx'

export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="reload-prompt" role="alert">
      <div className="reload-prompt__text">
        <Icon name="refresh" size={20} className="reload-prompt__icon" />
        <span>
          <strong>Nueva versión disponible</strong>
          <span className="reload-prompt__sub"> — mejoras y correcciones listas</span>
        </span>
      </div>
      <div className="reload-prompt__actions">
        <button
          type="button"
          className="reload-prompt__btn reload-prompt__btn--update"
          onClick={() => updateServiceWorker(true)}
        >
          Actualizar ahora
        </button>
        <button
          type="button"
          className="reload-prompt__btn reload-prompt__btn--dismiss"
          aria-label="Cerrar"
          onClick={() => setNeedRefresh(false)}
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  )
}
