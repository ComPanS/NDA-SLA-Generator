import { FileText, Menu, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useAuthStore, useLogout } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/ui';
import { parseLocaleFromPath } from '@/shared/i18n/localePath';
import { useLocalizedNavigate } from '@/shared/i18n/useLocalizedPath';

type NavItem = { nameKey: string; href: string };

export const Header = () => {
  const { t } = useTranslation('common');
  const navigate = useLocalizedNavigate();
  const location = useLocation();
  const { logicalPath } = parseLocaleFromPath(location.pathname);
  const { isAuthenticated } = useAuthStore();
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const anchorLinks: NavItem[] = useMemo(
    () => [
      { nameKey: 'nav.howItWorks', href: '#how-it-works' },
      { nameKey: 'nav.pricing', href: '#pricing' },
      { nameKey: 'nav.reviews', href: '#reviews' },
      { nameKey: 'nav.faq', href: '#faq' },
    ],
    []
  );

  const productLinks = useMemo(
    () => [
      { nameKey: 'header.dashboard', href: '/dashboard' },
      { nameKey: 'header.templates', href: '/templates' },
      { nameKey: 'header.billing', href: '/billing' },
      { nameKey: 'header.profile', href: '/profile' },
    ],
    []
  );

  const navigateAnchor = (href: string) => {
    if (href.startsWith('#')) {
      const targetId = href.slice(1);
      if (logicalPath === '/') {
        const el = typeof document !== 'undefined' ? document.getElementById(targetId) : null;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        navigate(`/${href}`);
      }
    } else {
      navigate(href);
    }
    setMobileMenuOpen(false);
  };

  const handleStart = () => {
    navigate(isAuthenticated ? '/new-contract' : '/register');
    setMobileMenuOpen(false);
  };

  const handleGuest = () => {
    navigate('/guest-contract');
    setMobileMenuOpen(false);
  };

  const handleLogin = () => {
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">{t('brand.name')}</span>
            </button>
          </div>

          {!isAuthenticated && (
            <div className="hidden md:flex items-center gap-8">
              {anchorLinks.map((item) => (
                <button
                  key={item.nameKey}
                  type="button"
                  onClick={() => navigateAnchor(item.href)}
                  className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {t(item.nameKey)}
                </button>
              ))}
            </div>
          )}

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {productLinks.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => navigate(item.href)}
                    className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    {t(item.nameKey)}
                  </button>
                ))}
                <Button variant="outline" onClick={handleStart}>
                  {t('header.newContract')}
                </Button>
                <Button variant="ghost" onClick={handleLogout}>
                  {t('header.logout')}
                </Button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                  onClick={handleLogin}
                >
                  {t('header.login')}
                </button>
                <Button onClick={handleStart}>{t('header.createContract')}</Button>
                <Button variant="outline" onClick={handleGuest}>
                  {t('header.guest')}
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-700"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-4">
              {!isAuthenticated &&
                anchorLinks.map((item) => (
                  <button
                    key={item.nameKey}
                    type="button"
                    onClick={() => navigateAnchor(item.href)}
                    className="text-gray-700 hover:text-blue-600 transition-colors px-2 py-2 text-left cursor-pointer"
                  >
                    {t(item.nameKey)}
                  </button>
                ))}

              <div className="pt-4 border-t border-gray-200 flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    {productLinks.map((item) => (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => navigate(item.href)}
                        className="text-gray-700 hover:text-blue-600 transition-colors px-2 py-2 text-left cursor-pointer"
                      >
                        {t(item.nameKey)}
                      </button>
                    ))}
                    <div className="flex gap-2 flex-col">
                      <Button variant="outline" className="w-full" onClick={handleStart}>
                        {t('header.newContract')}
                      </Button>
                      <Button variant="ghost" className="w-full" onClick={handleLogout}>
                        {t('header.logout')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="text-gray-700 hover:text-blue-600 transition-colors px-2 py-2 text-left cursor-pointer"
                      onClick={handleLogin}
                    >
                      {t('header.login')}
                    </button>
                    <div className="flex gap-2 flex-col">
                      <Button className="w-full" onClick={handleStart}>
                        {t('header.createContract')}
                      </Button>
                      <Button variant="outline" className="w-full" onClick={handleGuest}>
                        {t('header.guest')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
