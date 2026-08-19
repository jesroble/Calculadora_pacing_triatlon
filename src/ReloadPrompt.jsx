import { useRegisterSW } from 'virtual:pwa-register/react'
import Icon from './Icons.jsx'
import { useLanguage } from './i18n/LanguageContext.js'

export default function ReloadPrompt() {
  const { t } = useLanguage()
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
          <strong>{t('reloadPrompt.title')}</strong>
          <span className="reload-prompt__sub"> {t('reloadPrompt.subtitle')}</span>
        </span>
      </div>
      <div className="reload-prompt__actions">
        <button
          type="button"
          className="reload-prompt__btn reload-prompt__btn--update"
          onClick={() => updateServiceWorker(true)}
        >
          {t('reloadPrompt.updateButton')}
        </button>
        <button
          type="button"
          className="reload-prompt__btn reload-prompt__btn--dismiss"
          aria-label={t('reloadPrompt.closeAriaLabel')}
          onClick={() => setNeedRefresh(false)}
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  )
}
