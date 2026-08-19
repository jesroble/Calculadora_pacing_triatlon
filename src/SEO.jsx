import { Helmet } from 'react-helmet-async'
import { useLanguage } from './i18n/LanguageContext.js'

export default function SEO() {
  const { lang, t } = useLanguage()
  return (
    <Helmet>
      <html lang={lang} />
      <title>{t('seo.title')}</title>
      <meta name="description" content={t('seo.description')} />
    </Helmet>
  )
}
