import { Container } from '@mui/material';
import { FileText } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { APP_LOCALES, type AppLocale } from '@/shared/i18n/constants';
import { persistUserLocale } from '@/shared/i18n/bootstrapLocale';
import i18n from '@/shared/i18n/i18n';
import { parseLocaleFromPath, toLocalizedPath } from '@/shared/i18n/localePath';
import { useLocalizedNavigate, useLocalizedPath } from '@/shared/i18n/useLocalizedPath';

interface LayoutProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
}

const localeLabels: Record<AppLocale, string> = {
  ru: 'Русский',
  en: 'English',
  es: 'Español',
  th: 'ไทย',
};

const Footer = () => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  const localizedNavigate = useLocalizedNavigate();
  const localizedPath = useLocalizedPath();
  const { logicalPath } = parseLocaleFromPath(location.pathname);
  const { isAuthenticated } = useAuthStore();

  const handleAnchor = (hash: string) => {
    if (logicalPath === '/') {
      const el = document.getElementById(hash.replace('#', ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    localizedNavigate(`/${hash}`);
  };

  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4 mt-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xl">{t('brand.name')}</span>
            </div>
            <p className="text-sm mb-4">{t('footer.tagline')}</p>
            <p className="text-xs">{t('footer.disclaimer')}</p>
          </div>

          {!isAuthenticated && (
            <div>
              <h4 className="text-white mb-3">{t('footer.navTitle')}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => handleAnchor('#how-it-works')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {t('nav.howItWorks')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleAnchor('#pricing')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {t('nav.pricing')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleAnchor('#reviews')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {t('nav.reviews')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleAnchor('#faq')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {t('nav.faq')}
                  </button>
                </li>
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-white mb-3">{t('footer.supportTitle')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to={localizedPath('/privacy')} className="hover:text-white transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to={localizedPath('/terms')} className="hover:text-white transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to={localizedPath('/lawyers')} className="hover:text-white transition-colors">
                  {t('footer.forLawyers')}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@dogovarai.ru"
                  className="hover:text-white transition-colors"
                >
                  support@dogovarai.ru
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-sm text-center flex flex-col items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-gray-400">
            <label htmlFor="footer-lang" className="sr-only">
              {t('footer.language')}
            </label>
            <span className="text-gray-500">{t('footer.language')}:</span>
            <select
              id="footer-lang"
              className="bg-gray-800 text-gray-200 border border-gray-600 rounded px-2 py-1 text-sm cursor-pointer"
              value={(APP_LOCALES.includes(i18n.language as AppLocale) ? i18n.language : 'ru') as AppLocale}
              onChange={(e) => {
                const lang = e.target.value as AppLocale;
                persistUserLocale(lang);
                void i18n.changeLanguage(lang);
                navigate(toLocalizedPath(logicalPath, lang), { replace: true });
              }}
            >
              {APP_LOCALES.map((loc) => (
                <option key={loc} value={loc}>
                  {localeLabels[loc]}
                </option>
              ))}
            </select>
          </div>
          <p>
            © {new Date().getFullYear()} {t('brand.name')}. {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export const Layout = ({ children, maxWidth = 'lg', fullWidth = false }: LayoutProps) => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (location.hash) return; // allow in-page anchor scrolling
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.search, location.hash]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 w-full">
        {fullWidth ? (
          children
        ) : (
          <Container
            maxWidth={maxWidth}
            sx={{
              flex: 1,
              py: { xs: 2, md: 4 },
              px: { xs: 2, sm: 3, md: 4 },
            }}
          >
            {children}
          </Container>
        )}
      </main>
      <Footer />
    </div>
  );
};
