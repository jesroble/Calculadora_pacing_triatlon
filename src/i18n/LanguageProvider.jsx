import { useMemo, useState } from 'react'
import { LanguageContext } from './LanguageContext.js'
import { translations } from './translations.js'
import { CATEGORY_LABELS } from './categoryLabels.js'

const LANG_KEY = 'triatlonpacing:lang' // hermano de STORAGE_KEY='triatlonpacing:lastPlan' en App.jsx
const LOCALE_MAP = { es: 'es-ES', en: 'en-GB' }

function loadLang() {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'es'
  } catch {
    return 'es'
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(loadLang)

  function setLang(next) {
    setLangState(next)
    try {
      localStorage.setItem(LANG_KEY, next)
    } catch {
      // localStorage no disponible (modo privado, cuota llena...) — no es crítico
    }
  }

  const value = useMemo(() => {
    const dict = translations[lang]

    function t(path) {
      const val = path.split('.').reduce((acc, k) => acc?.[k], dict)
      if (val === undefined) {
        if (import.meta.env.DEV) console.warn(`[i18n] missing key "${path}"`)
        return path
      }
      return val
    }

    function tCat(dimension, rawValue) {
      const entry = CATEGORY_LABELS[dimension]?.[rawValue]
      if (!entry) {
        if (import.meta.env.DEV) console.warn(`[i18n] missing category label "${dimension}.${rawValue}"`)
        return rawValue
      }
      return entry[lang] ?? entry.es
    }

    return { lang, setLang, t, tCat, locale: LOCALE_MAP[lang] }
  }, [lang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
