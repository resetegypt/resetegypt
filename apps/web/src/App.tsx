import { useTranslation } from 'react-i18next';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@reset/ui';
import { SUPPORTED_LANGUAGES, type Language } from './i18n';

export function App() {
  const { t, i18n } = useTranslation();

  const switchLang = (lng: Language) => i18n.changeLanguage(lng);

  return (
    <div className="min-h-screen bg-bg p-8 max-w-3xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">{t('app.title')}</h1>
        <p className="text-text-secondary">{t('app.subtitle')}</p>
        <Badge variant="info">{t('app.tagline')}</Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Langue / اللغة / Language</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          {SUPPORTED_LANGUAGES.map((lng) => (
            <Button
              key={lng}
              variant={i18n.language === lng ? 'primary' : 'outline'}
              size="sm"
              onClick={() => switchLang(lng)}
            >
              {t(`languages.${lng}`)}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API status</CardTitle>
        </CardHeader>
        <CardContent>
          <ApiStatus />
        </CardContent>
      </Card>
    </div>
  );
}

function ApiStatus() {
  const url = '/api/health';
  return (
    <div className="text-sm space-y-2">
      <p className="text-text-secondary">
        Vérification :{' '}
        <a href={url} target="_blank" rel="noreferrer" className="text-info underline">
          {url}
        </a>
      </p>
      <p className="text-text-tertiary">
        Ouvre ce lien — tu dois voir{' '}
        <code className="bg-bg-secondary px-1 rounded">{`{"status":"ok",...}`}</code>
      </p>
    </div>
  );
}
